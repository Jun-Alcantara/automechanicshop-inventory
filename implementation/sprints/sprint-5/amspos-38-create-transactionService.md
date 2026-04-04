# AMSPOS-38: Create transactionService

**Sprint**: Sprint 5 — Inventory, Customer & Transaction Services
**Effort**: 2.5 days
**Dependencies**: AMSPOS-3, AMSPOS-8, AMSPOS-33 (productService), AMSPOS-34 (serviceItemService)
**Phase**: Transactions

---

## Description

Create `src/services/transactionService.ts` — the most complex service in the POS system. Manages the full transaction lifecycle including line items, stock reservation, payment finalization, void operations, and returns. All writes are atomic with audit logging and strict stock management rules.

---

## Instructions

### Type Definitions

Add these interfaces to the service file:

```typescript
interface CreateTransactionInput {
  customerId?: string;  // optional for walk-in customers
  notes?: string;
}

interface PaymentInput {
  method: 'CASH' | 'CARD' | 'MOBILE';
  amount: number;
  reference?: string;  // for card/mobile transactions
}

interface AddOnInput {
  addOnId: string;
  amount: number;
  description: string;
}
```

### Observables

```typescript
import { database } from './database';
import { Q } from '@nozbe/watermelondb';
import type { Transaction, User, Product, ServiceItem, Customer } from '../types';
import { TransactionModel } from '../models/TransactionModel';
import { LineItemModel } from '../models/LineItemModel';
import { PaymentModel } from '../models/PaymentModel';
import { AddOnModel } from '../models/AddOnModel';

/**
 * Observables - for store subscriptions
 */

export const observeOpenTransactions = () =>
  database.get<TransactionModel>('transactions')
    .query(
      Q.where('status', 'IN_PROGRESS'),
      Q.sortBy('created_at', Q.desc)
    )
    .observe();

export const observeTransactionsForCustomer = (customerId: string) =>
  database.get<TransactionModel>('transactions')
    .query(
      Q.where('customer_id', customerId),
      Q.sortBy('created_at', Q.desc)
    )
    .observe();
```

### Transaction Lifecycle

```typescript
/**
 * Create a new transaction (IN_PROGRESS state)
 */
export const createTransaction = async (input: CreateTransactionInput, actingUser: User): Promise<Transaction> => {
  let created: Transaction | null = null;
  await database.write(async () => {
    const model = await database.get<TransactionModel>('transactions').create((t) => {
      t.customerId = input.customerId ?? null;
      t.status = 'IN_PROGRESS';
      t.notes = input.notes ?? '';
      t.subtotal = 0;
      t.discount = 0;
      t.tax = 0;
      t.total = 0;
      t.hasReturn = false;
      t.originalTransactionId = null;
      t.createdAt = new Date();
      t.createdBy = actingUser.id;
      t.updatedAt = new Date();
      t.updatedBy = actingUser.id;
      t.finalizedAt = null;
      t.finalizedBy = null;
    });
    await database.get('audit_logs').create((log: any) => {
      log.timestamp = new Date();
      log.userId = actingUser.id;
      log.userName = actingUser.displayName;
      log.actionType = 'CREATE_TRANSACTION';
      log.entityType = 'TRANSACTION';
      log.entityId = model.id;
      log.after = JSON.stringify({ customerId: input.customerId, status: 'IN_PROGRESS' });
      log.note = '';
    });
    created = mapTransactionModel(model);
  });
  return created!;
};

/**
 * Finalize transaction: commit stock, set status to FINALIZED, create payments
 * CRITICAL: This is an atomic operation that must succeed completely or fail completely.
 */
export const finalizeTransaction = async (
  transactionId: string,
  payments: PaymentInput[],
  actingUser: User
): Promise<void> => {
  const transaction = await database.get<TransactionModel>('transactions').find(transactionId);
  const lineItems = await database.get<LineItemModel>('line_items')
    .query(Q.where('transaction_id', transactionId))
    .fetch();

  await database.write(async () => {
    // 1. Update transaction status to FINALIZED
    await transaction.update((t) => {
      t.status = 'FINALIZED';
      t.finalizedAt = new Date();
      t.finalizedBy = actingUser.id;
      t.updatedAt = new Date();
      t.updatedBy = actingUser.id;
    });

    // 2. For each line item with a product, commit reserved stock
    for (const lineItem of lineItems) {
      if (lineItem.itemType === 'PRODUCT') {
        const product = await database.get('products').find(lineItem.itemId);
        await product.update((p: any) => {
          // Decrement stockReserved, keep stockAvailable as-is (already reserved in addLineItem)
          p.stockReserved = Math.max(0, p.stockReserved - lineItem.quantity);
          p.updatedAt = new Date();
          p.updatedBy = actingUser.id;
        });
      }
    }

    // 3. Create payment records
    for (const payment of payments) {
      await database.get<PaymentModel>('payments').create((p) => {
        p.transactionId = transactionId;
        p.method = payment.method;
        p.amount = payment.amount;
        p.reference = payment.reference ?? '';
        p.createdAt = new Date();
        p.createdBy = actingUser.id;
      });
    }

    // 4. Create audit log for finalization
    await database.get('audit_logs').create((log: any) => {
      log.timestamp = new Date();
      log.userId = actingUser.id;
      log.userName = actingUser.displayName;
      log.actionType = 'FINALIZE_TRANSACTION';
      log.entityType = 'TRANSACTION';
      log.entityId = transactionId;
      log.after = JSON.stringify({ status: 'FINALIZED', paymentCount: payments.length });
      log.note = '';
    });
  });
};

/**
 * Cancel an IN_PROGRESS transaction: release all reserved stock
 */
export const cancelTransaction = async (transactionId: string, actingUser: User): Promise<void> => {
  const transaction = await database.get<TransactionModel>('transactions').find(transactionId);
  const lineItems = await database.get<LineItemModel>('line_items')
    .query(Q.where('transaction_id', transactionId))
    .fetch();

  await database.write(async () => {
    // 1. Update transaction status to CANCELLED
    await transaction.update((t) => {
      t.status = 'CANCELLED';
      t.updatedAt = new Date();
      t.updatedBy = actingUser.id;
    });

    // 2. Release all reserved stock back to available
    for (const lineItem of lineItems) {
      if (lineItem.itemType === 'PRODUCT') {
        const product = await database.get('products').find(lineItem.itemId);
        await product.update((p: any) => {
          // Move stock from reserved back to available
          p.stockAvailable = p.stockAvailable + lineItem.quantity;
          p.stockReserved = Math.max(0, p.stockReserved - lineItem.quantity);
          p.updatedAt = new Date();
          p.updatedBy = actingUser.id;
        });
      }
    }

    // 3. Create audit log
    await database.get('audit_logs').create((log: any) => {
      log.timestamp = new Date();
      log.userId = actingUser.id;
      log.userName = actingUser.displayName;
      log.actionType = 'CANCEL_TRANSACTION';
      log.entityType = 'TRANSACTION';
      log.entityId = transactionId;
      log.after = JSON.stringify({ status: 'CANCELLED' });
      log.note = '';
    });
  });
};

/**
 * Void a FINALIZED transaction: release all committed stock back to available
 * CRITICAL: Must check hasReturn — cannot void if a return has already been processed
 */
export const voidTransaction = async (
  transactionId: string,
  reason: string,
  actingUser: User
): Promise<void> => {
  const transaction = await database.get<TransactionModel>('transactions').find(transactionId);

  // Check if return has already been processed
  if (transaction.hasReturn === true) {
    throw new Error('A return has already been processed');
  }

  const lineItems = await database.get<LineItemModel>('line_items')
    .query(Q.where('transaction_id', transactionId))
    .fetch();

  await database.write(async () => {
    // 1. Update transaction status to VOIDED
    await transaction.update((t) => {
      t.status = 'VOIDED';
      t.updatedAt = new Date();
      t.updatedBy = actingUser.id;
    });

    // 2. Release all committed stock back to available
    for (const lineItem of lineItems) {
      if (lineItem.itemType === 'PRODUCT') {
        const product = await database.get('products').find(lineItem.itemId);
        await product.update((p: any) => {
          // stockReserved should already be 0 (committed), so add back to available
          p.stockAvailable = p.stockAvailable + lineItem.quantity;
          p.updatedAt = new Date();
          p.updatedBy = actingUser.id;
        });
      }
    }

    // 3. Create audit log
    await database.get('audit_logs').create((log: any) => {
      log.timestamp = new Date();
      log.userId = actingUser.id;
      log.userName = actingUser.displayName;
      log.actionType = 'VOID_TRANSACTION';
      log.entityType = 'TRANSACTION';
      log.entityId = transactionId;
      log.after = JSON.stringify({ status: 'VOIDED', reason });
      log.note = reason;
    });
  });
};

/**
 * Process return for a FINALIZED transaction
 * CRITICAL: Must set hasReturn=true on original transaction AND create a new RETURNED transaction
 */
export const processReturn = async (
  transactionId: string,
  reason: string,
  actingUser: User
): Promise<void> => {
  const originalTransaction = await database.get<TransactionModel>('transactions').find(transactionId);
  const lineItems = await database.get<LineItemModel>('line_items')
    .query(Q.where('transaction_id', transactionId))
    .fetch();

  await database.write(async () => {
    // 1. Mark original transaction as having a return
    await originalTransaction.update((t) => {
      t.hasReturn = true;
      t.updatedAt = new Date();
      t.updatedBy = actingUser.id;
    });

    // 2. Create new RETURNED transaction referencing the original
    const returnedTransaction = await database.get<TransactionModel>('transactions').create((t) => {
      t.customerId = originalTransaction.customerId;
      t.status = 'RETURNED';
      t.notes = `Return of transaction ${transactionId}: ${reason}`;
      t.originalTransactionId = transactionId;
      t.subtotal = originalTransaction.subtotal;
      t.discount = originalTransaction.discount;
      t.tax = originalTransaction.tax;
      t.total = originalTransaction.total;
      t.hasReturn = false;
      t.createdAt = new Date();
      t.createdBy = actingUser.id;
      t.updatedAt = new Date();
      t.updatedBy = actingUser.id;
      t.finalizedAt = new Date();
      t.finalizedBy = actingUser.id;
    });

    // 3. For each line item with a product, return stock to available
    for (const lineItem of lineItems) {
      if (lineItem.itemType === 'PRODUCT') {
        const product = await database.get('products').find(lineItem.itemId);
        await product.update((p: any) => {
          // Stock was already committed (stockReserved = 0), so return to available
          p.stockAvailable = p.stockAvailable + lineItem.quantity;
          p.updatedAt = new Date();
          p.updatedBy = actingUser.id;
        });
      }
    }

    // 4. Create audit logs
    await database.get('audit_logs').create((log: any) => {
      log.timestamp = new Date();
      log.userId = actingUser.id;
      log.userName = actingUser.displayName;
      log.actionType = 'PROCESS_RETURN';
      log.entityType = 'TRANSACTION';
      log.entityId = transactionId;
      log.after = JSON.stringify({ hasReturn: true, returnedTransactionId: returnedTransaction.id });
      log.note = reason;
    });
  });
};
```

### Line Items

```typescript
/**
 * Add line item to transaction: reserve stock if product
 * CRITICAL: Stock reservation is atomic in a single database.write() block
 */
export const addLineItem = async (
  transactionId: string,
  item: Product | ServiceItem,
  quantity: number,
  actingUser: User
): Promise<void> => {
  const transaction = await database.get<TransactionModel>('transactions').find(transactionId);

  await database.write(async () => {
    // 1. Create line item
    await database.get<LineItemModel>('line_items').create((li) => {
      li.transactionId = transactionId;
      li.itemType = 'productId' in item ? 'PRODUCT' : 'SERVICE';
      li.itemId = item.id;
      li.description = item.name;
      li.quantity = quantity;
      li.unitPrice = 'sellingPrice' in item ? item.sellingPrice : item.basePrice;
      li.lineTotal = quantity * ('sellingPrice' in item ? item.sellingPrice : item.basePrice);
      li.discount = 0;
      li.discountType = null;
      li.tax = 0;
      li.createdAt = new Date();
      li.createdBy = actingUser.id;
    });

    // 2. If product, atomically reserve stock
    if ('productId' in item) {
      const product = await database.get('products').find(item.id);
      await product.update((p: any) => {
        // Decrement available, increment reserved
        p.stockAvailable = p.stockAvailable - quantity;
        p.stockReserved = p.stockReserved + quantity;
        p.updatedAt = new Date();
        p.updatedBy = actingUser.id;
      });
    }

    // 3. Update transaction totals
    const allLineItems = await database.get<LineItemModel>('line_items')
      .query(Q.where('transaction_id', transactionId))
      .fetch();
    const newSubtotal = allLineItems.reduce((sum, li) => sum + li.lineTotal, 0);
    await transaction.update((t) => {
      t.subtotal = newSubtotal;
      t.total = newSubtotal - t.discount + t.tax;
      t.updatedAt = new Date();
      t.updatedBy = actingUser.id;
    });

    // 4. Create audit log
    await database.get('audit_logs').create((log: any) => {
      log.timestamp = new Date();
      log.userId = actingUser.id;
      log.userName = actingUser.displayName;
      log.actionType = 'ADD_LINE_ITEM';
      log.entityType = 'TRANSACTION';
      log.entityId = transactionId;
      log.after = JSON.stringify({
        itemId: item.id,
        itemType: 'productId' in item ? 'PRODUCT' : 'SERVICE',
        quantity,
      });
      log.note = '';
    });
  });
};

/**
 * Remove line item from transaction: reverse stock reservation if product
 * CRITICAL: Stock reversal is atomic in a single database.write() block
 */
export const removeLineItem = async (lineItemId: string, actingUser: User): Promise<void> => {
  const lineItem = await database.get<LineItemModel>('line_items').find(lineItemId);
  const transaction = await database.get<TransactionModel>('transactions').find(lineItem.transactionId);

  await database.write(async () => {
    // 1. If product, atomically reverse stock reservation
    if (lineItem.itemType === 'PRODUCT') {
      const product = await database.get('products').find(lineItem.itemId);
      await product.update((p: any) => {
        // Increment available, decrement reserved
        p.stockAvailable = p.stockAvailable + lineItem.quantity;
        p.stockReserved = Math.max(0, p.stockReserved - lineItem.quantity);
        p.updatedAt = new Date();
        p.updatedBy = actingUser.id;
      });
    }

    // 2. Delete line item
    await lineItem.destroyPermanently();

    // 3. Update transaction totals
    const allLineItems = await database.get<LineItemModel>('line_items')
      .query(Q.where('transaction_id', lineItem.transactionId))
      .fetch();
    const newSubtotal = allLineItems.reduce((sum, li) => sum + li.lineTotal, 0);
    await transaction.update((t) => {
      t.subtotal = newSubtotal;
      t.total = newSubtotal - t.discount + t.tax;
      t.updatedAt = new Date();
      t.updatedBy = actingUser.id;
    });

    // 4. Create audit log
    await database.get('audit_logs').create((log: any) => {
      log.timestamp = new Date();
      log.userId = actingUser.id;
      log.userName = actingUser.displayName;
      log.actionType = 'REMOVE_LINE_ITEM';
      log.entityType = 'TRANSACTION';
      log.entityId = lineItem.transactionId;
      log.after = JSON.stringify({ lineItemId });
      log.note = '';
    });
  });
};

/**
 * Update line item quantity
 */
export const updateLineItemQty = async (lineItemId: string, qty: number, actingUser: User): Promise<void> => {
  const lineItem = await database.get<LineItemModel>('line_items').find(lineItemId);
  const transaction = await database.get<TransactionModel>('transactions').find(lineItem.transactionId);
  const qtyDiff = qty - lineItem.quantity;

  await database.write(async () => {
    // 1. If product, adjust stock reservation
    if (lineItem.itemType === 'PRODUCT') {
      const product = await database.get('products').find(lineItem.itemId);
      await product.update((p: any) => {
        p.stockAvailable = p.stockAvailable - qtyDiff;
        p.stockReserved = p.stockReserved + qtyDiff;
        p.updatedAt = new Date();
        p.updatedBy = actingUser.id;
      });
    }

    // 2. Update line item
    await lineItem.update((li) => {
      li.quantity = qty;
      li.lineTotal = qty * li.unitPrice;
      li.updatedAt = new Date();
      li.updatedBy = actingUser.id;
    });

    // 3. Update transaction totals
    const allLineItems = await database.get<LineItemModel>('line_items')
      .query(Q.where('transaction_id', lineItem.transactionId))
      .fetch();
    const newSubtotal = allLineItems.reduce((sum, li) => sum + li.lineTotal, 0);
    await transaction.update((t) => {
      t.subtotal = newSubtotal;
      t.total = newSubtotal - t.discount + t.tax;
      t.updatedAt = new Date();
      t.updatedBy = actingUser.id;
    });

    // 4. Create audit log
    await database.get('audit_logs').create((log: any) => {
      log.timestamp = new Date();
      log.userId = actingUser.id;
      log.userName = actingUser.displayName;
      log.actionType = 'UPDATE_LINE_ITEM_QTY';
      log.entityType = 'TRANSACTION';
      log.entityId = lineItem.transactionId;
      log.before = JSON.stringify({ quantity: lineItem.quantity });
      log.after = JSON.stringify({ quantity: qty });
      log.note = '';
    });
  });
};

/**
 * Apply discount to a line item
 */
export const applyDiscount = async (
  lineItemId: string,
  type: 'FIXED' | 'PERCENTAGE',
  value: number,
  actingUser: User
): Promise<void> => {
  const lineItem = await database.get<LineItemModel>('line_items').find(lineItemId);
  const transaction = await database.get<TransactionModel>('transactions').find(lineItem.transactionId);

  const discountAmount = type === 'FIXED' ? value : (lineItem.lineTotal * value) / 100;

  await database.write(async () => {
    // 1. Update line item discount
    await lineItem.update((li) => {
      li.discount = discountAmount;
      li.discountType = type;
      li.updatedAt = new Date();
      li.updatedBy = actingUser.id;
    });

    // 2. Update transaction totals
    const allLineItems = await database.get<LineItemModel>('line_items')
      .query(Q.where('transaction_id', lineItem.transactionId))
      .fetch();
    const newSubtotal = allLineItems.reduce((sum, li) => sum + li.lineTotal, 0);
    const totalDiscount = allLineItems.reduce((sum, li) => sum + li.discount, 0);
    await transaction.update((t) => {
      t.discount = totalDiscount;
      t.total = newSubtotal - totalDiscount + t.tax;
      t.updatedAt = new Date();
      t.updatedBy = actingUser.id;
    });

    // 3. Create audit log
    await database.get('audit_logs').create((log: any) => {
      log.timestamp = new Date();
      log.userId = actingUser.id;
      log.userName = actingUser.displayName;
      log.actionType = 'APPLY_DISCOUNT';
      log.entityType = 'TRANSACTION';
      log.entityId = lineItem.transactionId;
      log.after = JSON.stringify({ discountType: type, discountValue: value, discountAmount });
      log.note = '';
    });
  });
};
```

### Add-Ons

```typescript
/**
 * Apply add-on to a line item
 */
export const applyAddOn = async (
  lineItemId: string,
  input: AddOnInput,
  actingUser: User
): Promise<void> => {
  const lineItem = await database.get<LineItemModel>('line_items').find(lineItemId);
  const transaction = await database.get<TransactionModel>('transactions').find(lineItem.transactionId);

  await database.write(async () => {
    // 1. Create add-on record
    await database.get<AddOnModel>('add_ons').create((ao) => {
      ao.lineItemId = lineItemId;
      ao.addOnId = input.addOnId;
      ao.description = input.description;
      ao.amount = input.amount;
      ao.createdAt = new Date();
      ao.createdBy = actingUser.id;
    });

    // 2. Update line item total
    await lineItem.update((li) => {
      li.lineTotal = li.lineTotal + input.amount;
      li.updatedAt = new Date();
      li.updatedBy = actingUser.id;
    });

    // 3. Update transaction totals
    const allLineItems = await database.get<LineItemModel>('line_items')
      .query(Q.where('transaction_id', lineItem.transactionId))
      .fetch();
    const newSubtotal = allLineItems.reduce((sum, li) => sum + li.lineTotal, 0);
    await transaction.update((t) => {
      t.subtotal = newSubtotal;
      t.total = newSubtotal - t.discount + t.tax;
      t.updatedAt = new Date();
      t.updatedBy = actingUser.id;
    });

    // 4. Create audit log
    await database.get('audit_logs').create((log: any) => {
      log.timestamp = new Date();
      log.userId = actingUser.id;
      log.userName = actingUser.displayName;
      log.actionType = 'APPLY_ADD_ON';
      log.entityType = 'TRANSACTION';
      log.entityId = lineItem.transactionId;
      log.after = JSON.stringify({ addOnId: input.addOnId, amount: input.amount });
      log.note = '';
    });
  });
};

/**
 * Remove add-on from a line item
 */
export const removeAddOn = async (addOnId: string, lineItemId: string, actingUser: User): Promise<void> => {
  const addOn = await database.get<AddOnModel>('add_ons').find(addOnId);
  const lineItem = await database.get<LineItemModel>('line_items').find(lineItemId);
  const transaction = await database.get<TransactionModel>('transactions').find(lineItem.transactionId);

  await database.write(async () => {
    // 1. Update line item total
    await lineItem.update((li) => {
      li.lineTotal = li.lineTotal - addOn.amount;
      li.updatedAt = new Date();
      li.updatedBy = actingUser.id;
    });

    // 2. Delete add-on
    await addOn.destroyPermanently();

    // 3. Update transaction totals
    const allLineItems = await database.get<LineItemModel>('line_items')
      .query(Q.where('transaction_id', lineItem.transactionId))
      .fetch();
    const newSubtotal = allLineItems.reduce((sum, li) => sum + li.lineTotal, 0);
    await transaction.update((t) => {
      t.subtotal = newSubtotal;
      t.total = newSubtotal - t.discount + t.tax;
      t.updatedAt = new Date();
      t.updatedBy = actingUser.id;
    });

    // 4. Create audit log
    await database.get('audit_logs').create((log: any) => {
      log.timestamp = new Date();
      log.userId = actingUser.id;
      log.userName = actingUser.displayName;
      log.actionType = 'REMOVE_ADD_ON';
      log.entityType = 'TRANSACTION';
      log.entityId = lineItem.transactionId;
      log.after = JSON.stringify({ addOnId });
      log.note = '';
    });
  });
};

/**
 * Helper functions
 */

const mapTransactionModel = (m: TransactionModel): Transaction => ({
  id: m.id,
  customerId: m.customerId,
  status: m.status,
  notes: m.notes,
  subtotal: m.subtotal,
  discount: m.discount,
  tax: m.tax,
  total: m.total,
  hasReturn: m.hasReturn,
  originalTransactionId: m.originalTransactionId,
  createdAt: m.createdAt,
  createdBy: m.createdBy,
  updatedAt: m.updatedAt,
  updatedBy: m.updatedBy,
  finalizedAt: m.finalizedAt,
  finalizedBy: m.finalizedBy,
});
```

---

## Acceptance Criteria

- [ ] `observeOpenTransactions()` returns only IN_PROGRESS transactions, sorted by created_at descending
- [ ] `observeTransactionsForCustomer()` returns all transactions for a customer, sorted by created_at descending
- [ ] `createTransaction()` atomically creates a transaction and writes an audit log
- [ ] `addLineItem()` for PRODUCT atomically decrements `stockAvailable` and increments `stockReserved` in a single `database.write()` block
- [ ] `removeLineItem()` for PRODUCT atomically reverses stock reservation in a single `database.write()` block
- [ ] `updateLineItemQty()` correctly adjusts stock reservation when quantity changes
- [ ] `finalizeTransaction()` atomically commits stock (decrements `stockReserved`), sets status to FINALIZED, creates payment records, and logs audit entry in a single `database.write()` block
- [ ] `cancelTransaction()` releases all reserved stock back to `stockAvailable` atomically
- [ ] `voidTransaction()` throws `"A return has already been processed"` if `hasReturn === true`
- [ ] `voidTransaction()` releases all committed stock back to `stockAvailable` atomically
- [ ] `processReturn()` atomically sets `hasReturn = true` on original transaction AND creates a new RETURNED transaction referencing `original_transaction_id`
- [ ] `applyDiscount()` updates line item and transaction totals
- [ ] `applyAddOn()` and `removeAddOn()` correctly adjust line item and transaction totals
- [ ] All functions use TypeScript with proper type safety
- [ ] No TypeScript compilation errors

## Definition of Done

- All acceptance criteria are met
- `npx tsc --noEmit` passes
- Code committed to `main`
