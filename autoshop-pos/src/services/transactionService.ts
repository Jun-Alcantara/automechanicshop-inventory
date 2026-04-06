import { database } from './database';
import { Q } from '@nozbe/watermelondb';
import type { Transaction, Product, ServiceItem, User, PaymentInput, AddOnInput } from '../types';
import { TransactionModel } from '../models/TransactionModel';
import { LineItemModel } from '../models/LineItemModel';
import { PaymentModel } from '../models/PaymentModel';
import { LineItemAddOnModel } from '../models/LineItemAddOnModel';
import { ProductModel } from '../models/ProductModel';
import { DEFAULT_VAT_TYPE } from '../constants/vatTypes';

// ─── Mapper ───────────────────────────────────────────────────────────────────

const mapTransactionModel = (m: TransactionModel): Transaction => ({
  id: m.id,
  status: m.status as Transaction['status'],
  customerId: m.customerId,
  vehicleId: m.vehicleId,
  cashierId: m.cashierId,
  subtotal: m.subtotal,
  totalVat: m.totalVat,
  totalAmount: m.totalAmount,
  changeDue: m.changeDue,
  hasReturn: m.hasReturn,
  originalTransactionId: m.originalTransactionId,
  voidReason: m.voidReason,
  voidedBy: m.voidedBy,
  voidedAt: m.voidedAt,
  returnReason: m.returnReason,
  returnedBy: m.returnedBy,
  returnedAt: m.returnedAt,
  createdAt: m.createdAt,
  createdBy: m.createdBy,
  finalizedAt: m.finalizedAt,
  finalizedBy: m.finalizedBy,
  lineItems: [],
  payments: [],
});

// ─── Input Types ──────────────────────────────────────────────────────────────

interface CreateTransactionInput {
  customerId?: string;
  vehicleId?: string;
  cashierId: string;
}

// ─── Observables ─────────────────────────────────────────────────────────────

/**
 * Observable for all IN_PROGRESS transactions, sorted newest first.
 * Subscribed to by useOpenTransactionsStore.
 */
export const observeOpenTransactions = () =>
  database.get<TransactionModel>('transactions')
    .query(
      Q.where('status', 'IN_PROGRESS'),
      Q.sortBy('created_at', Q.desc)
    )
    .observe();

/**
 * Observable for all transactions belonging to a specific customer,
 * sorted newest first. Used on the customer detail screen.
 */
export const observeTransactionsForCustomer = (customerId: string) =>
  database.get<TransactionModel>('transactions')
    .query(
      Q.where('customer_id', customerId),
      Q.sortBy('created_at', Q.desc)
    )
    .observe();

// ─── Transaction Lifecycle ────────────────────────────────────────────────────

/**
 * Creates a new IN_PROGRESS transaction and writes a CREATE_TRANSACTION audit
 * log entry in the same atomic write block.
 */
export const createTransaction = async (
  input: CreateTransactionInput,
  actingUser: User
): Promise<Transaction> => {
  let created: Transaction | null = null;

  await database.write(async () => {
    const model = await database.get<TransactionModel>('transactions').create((t) => {
      t.status = 'IN_PROGRESS';
      t.customerId = input.customerId ?? '';
      t.vehicleId = input.vehicleId ?? '';
      t.cashierId = input.cashierId;
      t.subtotal = 0;
      t.totalVat = 0;
      t.totalAmount = 0;
      t.changeDue = 0;
      t.hasReturn = false;
      t.originalTransactionId = '';
      t.voidReason = '';
      t.voidedBy = '';
      t.voidedAt = 0;
      t.returnReason = '';
      t.returnedBy = '';
      t.returnedAt = 0;
      t.createdAt = new Date();
      t.createdBy = actingUser.id;
      t.finalizedAt = 0;
      t.finalizedBy = '';
    });

    await database.get('audit_logs').create((log: any) => {
      log.timestamp = new Date();
      log.userId = actingUser.id;
      log.userName = actingUser.displayName;
      log.actionType = 'CREATE_TRANSACTION';
      log.entityType = 'TRANSACTION';
      log.entityId = model.id;
      log.before = '';
      log.after = JSON.stringify({
        customerId: input.customerId,
        cashierId: input.cashierId,
        status: 'IN_PROGRESS',
      });
      log.note = '';
    });

    created = mapTransactionModel(model);
  });

  return created!;
};

/**
 * Finalizes a transaction: commits reserved stock, sets status to FINALIZED,
 * creates payment records, and writes an audit log entry.
 * CRITICAL: This is an atomic operation — all steps succeed or none do.
 */
export const finalizeTransaction = async (
  transactionId: string,
  payments: PaymentInput[],
  changeDue: number,
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
      t.changeDue = changeDue;
      t.finalizedAt = Date.now();
      t.finalizedBy = actingUser.id;
    });

    // 2. For each product line item, commit reserved stock (decrement stockReserved)
    for (const lineItem of lineItems) {
      if (lineItem.type === 'PRODUCT') {
        const product = await database.get<ProductModel>('products').find(lineItem.refId);
        await product.update((p) => {
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
        p.referenceNumber = payment.referenceNumber ?? '';
        p.receiptPhotoUri = payment.receiptPhotoUri ?? '';
      });
    }

    // 4. Write audit log
    await database.get('audit_logs').create((log: any) => {
      log.timestamp = new Date();
      log.userId = actingUser.id;
      log.userName = actingUser.displayName;
      log.actionType = 'FINALIZE_TRANSACTION';
      log.entityType = 'TRANSACTION';
      log.entityId = transactionId;
      log.before = '';
      log.after = JSON.stringify({ status: 'FINALIZED', paymentCount: payments.length });
      log.note = '';
    });
  });
};

/**
 * Cancels an IN_PROGRESS transaction: releases all reserved stock back to
 * available and sets status to CANCELLED.
 */
export const cancelTransaction = async (
  transactionId: string,
  actingUser: User
): Promise<void> => {
  const transaction = await database.get<TransactionModel>('transactions').find(transactionId);
  const lineItems = await database.get<LineItemModel>('line_items')
    .query(Q.where('transaction_id', transactionId))
    .fetch();

  await database.write(async () => {
    // 1. Update transaction status to CANCELLED
    await transaction.update((t) => {
      t.status = 'CANCELLED';
    });

    // 2. Release all reserved stock back to available
    for (const lineItem of lineItems) {
      if (lineItem.type === 'PRODUCT') {
        const product = await database.get<ProductModel>('products').find(lineItem.refId);
        await product.update((p) => {
          p.stockAvailable = p.stockAvailable + lineItem.quantity;
          p.stockReserved = Math.max(0, p.stockReserved - lineItem.quantity);
          p.updatedAt = new Date();
          p.updatedBy = actingUser.id;
        });
      }
    }

    // 3. Write audit log
    await database.get('audit_logs').create((log: any) => {
      log.timestamp = new Date();
      log.userId = actingUser.id;
      log.userName = actingUser.displayName;
      log.actionType = 'CANCEL_TRANSACTION';
      log.entityType = 'TRANSACTION';
      log.entityId = transactionId;
      log.before = '';
      log.after = JSON.stringify({ status: 'CANCELLED' });
      log.note = '';
    });
  });
};

/**
 * Voids a FINALIZED transaction: releases all committed stock back to available.
 * CRITICAL: Throws if hasReturn === true — cannot void after a return.
 */
export const voidTransaction = async (
  transactionId: string,
  reason: string,
  actingUser: User
): Promise<void> => {
  const transaction = await database.get<TransactionModel>('transactions').find(transactionId);

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
      t.voidReason = reason;
      t.voidedBy = actingUser.id;
      t.voidedAt = Date.now();
    });

    // 2. Release all committed stock back to available
    for (const lineItem of lineItems) {
      if (lineItem.type === 'PRODUCT') {
        const product = await database.get<ProductModel>('products').find(lineItem.refId);
        await product.update((p) => {
          // Stock was already committed (stockReserved = 0 after finalize), return to available
          p.stockAvailable = p.stockAvailable + lineItem.quantity;
          p.updatedAt = new Date();
          p.updatedBy = actingUser.id;
        });
      }
    }

    // 3. Write audit log
    await database.get('audit_logs').create((log: any) => {
      log.timestamp = new Date();
      log.userId = actingUser.id;
      log.userName = actingUser.displayName;
      log.actionType = 'VOID_TRANSACTION';
      log.entityType = 'TRANSACTION';
      log.entityId = transactionId;
      log.before = '';
      log.after = JSON.stringify({ status: 'VOIDED', reason });
      log.note = reason;
    });
  });
};

/**
 * Processes a return for a FINALIZED transaction: marks the original transaction
 * as having a return, creates a new RETURNED transaction referencing it, and
 * restores all product stock back to available.
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
      t.returnReason = reason;
      t.returnedBy = actingUser.id;
      t.returnedAt = Date.now();
    });

    // 2. Create new RETURNED transaction referencing the original
    const returnedTransaction = await database.get<TransactionModel>('transactions').create((t) => {
      t.status = 'RETURNED';
      t.customerId = originalTransaction.customerId;
      t.vehicleId = originalTransaction.vehicleId;
      t.cashierId = actingUser.id;
      t.subtotal = originalTransaction.subtotal;
      t.totalVat = originalTransaction.totalVat;
      t.totalAmount = originalTransaction.totalAmount;
      t.changeDue = 0;
      t.hasReturn = false;
      t.originalTransactionId = transactionId;
      t.voidReason = '';
      t.voidedBy = '';
      t.voidedAt = 0;
      t.returnReason = reason;
      t.returnedBy = actingUser.id;
      t.returnedAt = Date.now();
      t.createdAt = new Date();
      t.createdBy = actingUser.id;
      t.finalizedAt = Date.now();
      t.finalizedBy = actingUser.id;
    });

    // 3. For each product line item, return committed stock to available
    for (const lineItem of lineItems) {
      if (lineItem.type === 'PRODUCT') {
        const product = await database.get<ProductModel>('products').find(lineItem.refId);
        await product.update((p) => {
          // Stock was committed (stockReserved = 0 after finalize), return to available
          p.stockAvailable = p.stockAvailable + lineItem.quantity;
          p.updatedAt = new Date();
          p.updatedBy = actingUser.id;
        });
      }
    }

    // 4. Write audit log
    await database.get('audit_logs').create((log: any) => {
      log.timestamp = new Date();
      log.userId = actingUser.id;
      log.userName = actingUser.displayName;
      log.actionType = 'RETURN_TRANSACTION';
      log.entityType = 'TRANSACTION';
      log.entityId = transactionId;
      log.before = '';
      log.after = JSON.stringify({
        hasReturn: true,
        returnedTransactionId: returnedTransaction.id,
        reason,
      });
      log.note = reason;
    });
  });
};

// ─── Line Items ───────────────────────────────────────────────────────────────

/**
 * Adds a line item to a transaction, atomically reserving stock if it's a product.
 * CRITICAL: Stock reservation and line item creation are in a single database.write() block.
 */
export const addLineItem = async (
  transactionId: string,
  item: Product | ServiceItem,
  quantity: number,
  actingUser: User
): Promise<void> => {
  const transaction = await database.get<TransactionModel>('transactions').find(transactionId);
  const isProduct = 'sellingPrice' in item;
  const unitPrice = isProduct ? (item as Product).sellingPrice : (item as ServiceItem).basePrice;

  await database.write(async () => {
    // 1. Create line item
    await database.get<LineItemModel>('line_items').create((li) => {
      li.transactionId = transactionId;
      li.type = isProduct ? 'PRODUCT' : 'SERVICE';
      li.refId = item.id;
      li.name = item.name;
      li.unitPrice = unitPrice;
      li.quantity = quantity;
      li.vatType = DEFAULT_VAT_TYPE;
      li.discountType = '';
      li.discountValue = 0;
      li.subtotal = quantity * unitPrice;
      li.vatAmount = 0;
      li.discountAmount = 0;
      li.total = quantity * unitPrice;
    });

    // 2. If product, atomically reserve stock
    if (isProduct) {
      const product = await database.get<ProductModel>('products').find(item.id);
      await product.update((p) => {
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
    const newSubtotal = allLineItems.reduce((sum, li) => sum + li.subtotal, 0);
    const newTotal = allLineItems.reduce((sum, li) => sum + li.total, 0);
    await transaction.update((t) => {
      t.subtotal = newSubtotal;
      t.totalAmount = newTotal;
    });

    // 4. Write audit log
    await database.get('audit_logs').create((log: any) => {
      log.timestamp = new Date();
      log.userId = actingUser.id;
      log.userName = actingUser.displayName;
      log.actionType = 'ADD_ITEM';
      log.entityType = 'TRANSACTION';
      log.entityId = transactionId;
      log.before = '';
      log.after = JSON.stringify({
        itemId: item.id,
        itemType: isProduct ? 'PRODUCT' : 'SERVICE',
        quantity,
      });
      log.note = '';
    });
  });
};

/**
 * Removes a line item from a transaction, atomically reversing the stock
 * reservation if it was a product.
 * CRITICAL: Stock reversal and line item deletion are in a single database.write() block.
 */
export const removeLineItem = async (lineItemId: string, actingUser: User): Promise<void> => {
  const lineItem = await database.get<LineItemModel>('line_items').find(lineItemId);
  const transaction = await database.get<TransactionModel>('transactions').find(lineItem.transactionId);

  await database.write(async () => {
    // 1. If product, atomically reverse stock reservation
    if (lineItem.type === 'PRODUCT') {
      const product = await database.get<ProductModel>('products').find(lineItem.refId);
      await product.update((p) => {
        p.stockAvailable = p.stockAvailable + lineItem.quantity;
        p.stockReserved = Math.max(0, p.stockReserved - lineItem.quantity);
        p.updatedAt = new Date();
        p.updatedBy = actingUser.id;
      });
    }

    // 2. Delete the line item
    await lineItem.destroyPermanently();

    // 3. Update transaction totals
    const allLineItems = await database.get<LineItemModel>('line_items')
      .query(Q.where('transaction_id', lineItem.transactionId))
      .fetch();
    const newSubtotal = allLineItems.reduce((sum, li) => sum + li.subtotal, 0);
    const newTotal = allLineItems.reduce((sum, li) => sum + li.total, 0);
    await transaction.update((t) => {
      t.subtotal = newSubtotal;
      t.totalAmount = newTotal;
    });

    // 4. Write audit log
    await database.get('audit_logs').create((log: any) => {
      log.timestamp = new Date();
      log.userId = actingUser.id;
      log.userName = actingUser.displayName;
      log.actionType = 'REMOVE_ITEM';
      log.entityType = 'TRANSACTION';
      log.entityId = lineItem.transactionId;
      log.before = '';
      log.after = JSON.stringify({ lineItemId });
      log.note = '';
    });
  });
};

/**
 * Updates the quantity of a line item, adjusting stock reservation if it's
 * a product.
 */
export const updateLineItemQty = async (
  lineItemId: string,
  qty: number,
  actingUser: User
): Promise<void> => {
  const lineItem = await database.get<LineItemModel>('line_items').find(lineItemId);
  const transaction = await database.get<TransactionModel>('transactions').find(lineItem.transactionId);
  const qtyDiff = qty - lineItem.quantity;

  await database.write(async () => {
    // 1. If product, adjust stock reservation
    if (lineItem.type === 'PRODUCT') {
      const product = await database.get<ProductModel>('products').find(lineItem.refId);
      await product.update((p) => {
        p.stockAvailable = p.stockAvailable - qtyDiff;
        p.stockReserved = p.stockReserved + qtyDiff;
        p.updatedAt = new Date();
        p.updatedBy = actingUser.id;
      });
    }

    // 2. Update the line item
    await lineItem.update((li) => {
      li.quantity = qty;
      li.subtotal = qty * li.unitPrice;
      li.total = qty * li.unitPrice - li.discountAmount;
    });

    // 3. Update transaction totals
    const allLineItems = await database.get<LineItemModel>('line_items')
      .query(Q.where('transaction_id', lineItem.transactionId))
      .fetch();
    const newSubtotal = allLineItems.reduce((sum, li) => sum + li.subtotal, 0);
    const newTotal = allLineItems.reduce((sum, li) => sum + li.total, 0);
    await transaction.update((t) => {
      t.subtotal = newSubtotal;
      t.totalAmount = newTotal;
    });

    // 4. Write audit log
    await database.get('audit_logs').create((log: any) => {
      log.timestamp = new Date();
      log.userId = actingUser.id;
      log.userName = actingUser.displayName;
      log.actionType = 'EDIT_ITEM_QTY';
      log.entityType = 'TRANSACTION';
      log.entityId = lineItem.transactionId;
      log.before = JSON.stringify({ quantity: lineItem.quantity });
      log.after = JSON.stringify({ quantity: qty });
      log.note = '';
    });
  });
};

/**
 * Applies a discount to a line item and updates transaction totals.
 */
export const applyDiscount = async (
  lineItemId: string,
  type: 'FIXED' | 'PERCENTAGE',
  value: number,
  actingUser: User
): Promise<void> => {
  const lineItem = await database.get<LineItemModel>('line_items').find(lineItemId);
  const transaction = await database.get<TransactionModel>('transactions').find(lineItem.transactionId);
  const discountAmount = type === 'FIXED' ? value : (lineItem.subtotal * value) / 100;

  await database.write(async () => {
    // 1. Update line item discount
    await lineItem.update((li) => {
      li.discountType = type;
      li.discountValue = value;
      li.discountAmount = discountAmount;
      li.total = li.subtotal - discountAmount;
    });

    // 2. Update transaction totals
    const allLineItems = await database.get<LineItemModel>('line_items')
      .query(Q.where('transaction_id', lineItem.transactionId))
      .fetch();
    const newTotal = allLineItems.reduce((sum, li) => sum + li.total, 0);
    await transaction.update((t) => {
      t.totalAmount = newTotal;
    });

    // 3. Write audit log
    await database.get('audit_logs').create((log: any) => {
      log.timestamp = new Date();
      log.userId = actingUser.id;
      log.userName = actingUser.displayName;
      log.actionType = 'APPLY_DISCOUNT';
      log.entityType = 'TRANSACTION';
      log.entityId = lineItem.transactionId;
      log.before = '';
      log.after = JSON.stringify({ discountType: type, discountValue: value, discountAmount });
      log.note = '';
    });
  });
};

/**
 * Removes any discount from a line item and updates transaction totals.
 */
export const removeDiscount = async (
  lineItemId: string,
  actingUser: User
): Promise<void> => {
  const lineItem = await database.get<LineItemModel>('line_items').find(lineItemId);
  const transaction = await database.get<TransactionModel>('transactions').find(lineItem.transactionId);
  const prevDiscountType = lineItem.discountType;
  const prevDiscountValue = lineItem.discountValue;

  await database.write(async () => {
    // 1. Clear discount on line item
    await lineItem.update((li) => {
      li.discountType = '';
      li.discountValue = 0;
      li.discountAmount = 0;
      li.total = li.subtotal;
    });

    // 2. Update transaction totals
    const allLineItems = await database.get<LineItemModel>('line_items')
      .query(Q.where('transaction_id', lineItem.transactionId))
      .fetch();
    const newTotal = allLineItems.reduce((sum, li) => sum + li.total, 0);
    await transaction.update((t) => {
      t.totalAmount = newTotal;
    });

    // 3. Write audit log
    await database.get('audit_logs').create((log: any) => {
      log.timestamp = new Date();
      log.userId = actingUser.id;
      log.userName = actingUser.displayName;
      log.actionType = 'APPLY_DISCOUNT';
      log.entityType = 'TRANSACTION';
      log.entityId = lineItem.transactionId;
      log.before = JSON.stringify({ discountType: prevDiscountType, discountValue: prevDiscountValue });
      log.after = JSON.stringify({ discountType: '', discountValue: 0 });
      log.note = '';
    });
  });
};

// ─── Add-Ons ──────────────────────────────────────────────────────────────────

/**
 * Applies an add-on to a line item, incrementing the line item's total and
 * updating transaction totals accordingly.
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
    await database.get<LineItemAddOnModel>('line_item_add_ons').create((ao) => {
      ao.lineItemId = lineItemId;
      ao.addOnId = input.addOnId;
      ao.name = input.name;
      ao.amount = input.amount;
      ao.isOnTheFly = input.isOnTheFly;
    });

    // 2. Update line item total
    await lineItem.update((li) => {
      li.total = li.total + input.amount;
    });

    // 3. Update transaction totals
    const allLineItems = await database.get<LineItemModel>('line_items')
      .query(Q.where('transaction_id', lineItem.transactionId))
      .fetch();
    const newTotal = allLineItems.reduce((sum, li) => sum + li.total, 0);
    await transaction.update((t) => {
      t.totalAmount = newTotal;
    });
  });
};

/**
 * Removes an add-on from a line item, decrementing the line item's total and
 * updating transaction totals accordingly.
 */
export const removeAddOn = async (
  addOnRecordId: string,
  lineItemId: string,
  actingUser: User
): Promise<void> => {
  const addOn = await database.get<LineItemAddOnModel>('line_item_add_ons').find(addOnRecordId);
  const lineItem = await database.get<LineItemModel>('line_items').find(lineItemId);
  const transaction = await database.get<TransactionModel>('transactions').find(lineItem.transactionId);

  await database.write(async () => {
    // 1. Update line item total
    await lineItem.update((li) => {
      li.total = li.total - addOn.amount;
    });

    // 2. Delete add-on record
    await addOn.destroyPermanently();

    // 3. Update transaction totals
    const allLineItems = await database.get<LineItemModel>('line_items')
      .query(Q.where('transaction_id', lineItem.transactionId))
      .fetch();
    const newTotal = allLineItems.reduce((sum, li) => sum + li.total, 0);
    await transaction.update((t) => {
      t.totalAmount = newTotal;
    });
  });
};
