# AMSPOS-44: Implement `transactionDraftStore`

**Sprint**: Sprint 6 — Zustand Stores
**Effort**: 2 days
**Dependencies**: AMSPOS-38 (transactionService)
**Phase**: Foundation

---

## Description

Implement `src/stores/transactionDraftStore.ts`. This is the most complex store — it wraps all write operations from `transactionService` and maintains a reactive local copy of the currently open draft transaction and its line items.

The pattern for every write action is:
1. Call the corresponding `transactionService` function
2. Call `refreshDraft(transactionId)` to reload updated state from the DB
3. `refreshDraft` calls `set({ draft, lineItems })`

---

## Instructions

### 1. `src/stores/transactionDraftStore.ts`

```typescript
import { create } from 'zustand';
import { database } from '../services/database';
import { Q } from '@nozbe/watermelondb';
import {
  addLineItem as svcAddLineItem,
  removeLineItem as svcRemoveLineItem,
  updateLineItemQty as svcUpdateLineItemQty,
  applyDiscount as svcApplyDiscount,
  removeDiscount as svcRemoveDiscount,
  applyAddOn as svcApplyAddOn,
  removeAddOn as svcRemoveAddOn,
} from '../services/transactionService';
import type { Transaction, LineItem, Product, ServiceItem, User, AddOnInput } from '../types';

interface TransactionDraftStore {
  draft: Transaction | null;
  lineItems: LineItem[];
  loading: boolean;

  openDraft: (transactionId: string) => Promise<void>;
  refreshDraft: (transactionId: string) => Promise<void>;
  addLineItem: (transactionId: string, item: Product | ServiceItem, actingUser: User) => Promise<void>;
  removeLineItem: (lineItemId: string, transactionId: string, actingUser: User) => Promise<void>;
  updateLineItemQty: (lineItemId: string, transactionId: string, qty: number, actingUser: User) => Promise<void>;
  applyDiscount: (lineItemId: string, transactionId: string, type: 'FIXED' | 'PERCENTAGE', value: number, actingUser: User) => Promise<void>;
  removeDiscount: (lineItemId: string, transactionId: string, actingUser: User) => Promise<void>;
  applyAddOn: (lineItemId: string, transactionId: string, input: AddOnInput, actingUser: User) => Promise<void>;
  removeAddOn: (addOnId: string, lineItemId: string, transactionId: string, actingUser: User) => Promise<void>;
  clearDraft: () => void;
}

// Helper: fetch transaction + its line items from WatermelonDB and map to plain types
const fetchDraftData = async (transactionId: string): Promise<{ draft: Transaction; lineItems: LineItem[] }> => {
  const txModel = await database.get('transactions').find(transactionId);
  const liModels = await txModel.lineItems.fetch();

  const draft: Transaction = {
    id: txModel.id,
    status: txModel.status,
    subtotal: txModel.subtotal,
    discountTotal: txModel.discountTotal,
    taxAmount: txModel.taxAmount,
    grandTotal: txModel.grandTotal,
    customerId: txModel.customerId,
    vehicleId: txModel.vehicleId,
    mileageIn: txModel.mileageIn,
    mileageOut: txModel.mileageOut,
    notes: txModel.notes,
    createdAt: txModel.createdAt,
    createdBy: txModel.createdBy,
    updatedAt: txModel.updatedAt,
    updatedBy: txModel.updatedBy,
  };

  const lineItems: LineItem[] = liModels.map((li: any) => ({
    id: li.id,
    transactionId: li.transactionId,
    itemType: li.itemType,
    itemId: li.itemId,
    name: li.name,
    unitPrice: li.unitPrice,
    quantity: li.quantity,
    discountType: li.discountType,
    discountValue: li.discountValue,
    lineTotal: li.lineTotal,
    createdAt: li.createdAt,
    createdBy: li.createdBy,
    updatedAt: li.updatedAt,
    updatedBy: li.updatedBy,
  }));

  return { draft, lineItems };
};

export const useTransactionDraftStore = create<TransactionDraftStore>((set) => ({
  draft: null,
  lineItems: [],
  loading: false,

  openDraft: async (transactionId) => {
    set({ loading: true });
    const { draft, lineItems } = await fetchDraftData(transactionId);
    set({ draft, lineItems, loading: false });
  },

  refreshDraft: async (transactionId) => {
    const { draft, lineItems } = await fetchDraftData(transactionId);
    set({ draft, lineItems });
  },

  addLineItem: async (transactionId, item, actingUser) => {
    await svcAddLineItem(transactionId, item, actingUser);
    const { draft, lineItems } = await fetchDraftData(transactionId);
    set({ draft, lineItems });
  },

  removeLineItem: async (lineItemId, transactionId, actingUser) => {
    await svcRemoveLineItem(lineItemId, transactionId, actingUser);
    const { draft, lineItems } = await fetchDraftData(transactionId);
    set({ draft, lineItems });
  },

  updateLineItemQty: async (lineItemId, transactionId, qty, actingUser) => {
    await svcUpdateLineItemQty(lineItemId, transactionId, qty, actingUser);
    const { draft, lineItems } = await fetchDraftData(transactionId);
    set({ draft, lineItems });
  },

  applyDiscount: async (lineItemId, transactionId, type, value, actingUser) => {
    await svcApplyDiscount(lineItemId, transactionId, type, value, actingUser);
    const { draft, lineItems } = await fetchDraftData(transactionId);
    set({ draft, lineItems });
  },

  removeDiscount: async (lineItemId, transactionId, actingUser) => {
    await svcRemoveDiscount(lineItemId, transactionId, actingUser);
    const { draft, lineItems } = await fetchDraftData(transactionId);
    set({ draft, lineItems });
  },

  applyAddOn: async (lineItemId, transactionId, input, actingUser) => {
    await svcApplyAddOn(lineItemId, transactionId, input, actingUser);
    const { draft, lineItems } = await fetchDraftData(transactionId);
    set({ draft, lineItems });
  },

  removeAddOn: async (addOnId, lineItemId, transactionId, actingUser) => {
    await svcRemoveAddOn(addOnId, lineItemId, transactionId, actingUser);
    const { draft, lineItems } = await fetchDraftData(transactionId);
    set({ draft, lineItems });
  },

  clearDraft: () => set({ draft: null, lineItems: [], loading: false }),
}));
```

### Notes

- `fetchDraftData` is a private helper shared by all write actions. It uses WatermelonDB's `.find()` on the `transactions` table and `.fetch()` on the `lineItems` relation.
- All field names in the mapper must match WatermelonDB model column names (snake_case in DB, camelCase via `@text`/`@field` decorators on the model). Adjust if your `TransactionModel` / `LineItemModel` use different property names.
- Import names for service functions (`svcAddLineItem`, etc.) must match the actual exported names from `transactionService.ts`.

---

## Acceptance Criteria

- [ ] `openDraft(id)` loads the transaction and its line items; `draft` and `lineItems` are set
- [ ] Each write action calls the service then re-fetches and updates state
- [ ] `clearDraft()` resets `draft`, `lineItems`, and `loading`
- [ ] `loading` is `true` only during `openDraft`, not during write actions
- [ ] No TypeScript errors

## Definition of Done

- Acceptance criteria met
- File committed to `main`
