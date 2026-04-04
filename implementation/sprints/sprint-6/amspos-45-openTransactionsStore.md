# AMSPOS-45: Implement `openTransactionsStore`

**Sprint**: Sprint 6 — Zustand Stores
**Effort**: 0.5 day
**Dependencies**: AMSPOS-38 (transactionService)
**Phase**: Foundation

---

## Description

Implement `src/stores/openTransactionsStore.ts`. Wire to `observeOpenTransactions()` from `transactionService`. Maps WatermelonDB transaction models to typed `Transaction[]` plain objects (headers only — no `lineItems` or `payments` are loaded here). Follows the same single-subscription pattern as `userStore`.

---

## Instructions

### 1. `src/stores/openTransactionsStore.ts`

```typescript
import { create } from 'zustand';
import type { Subscription } from 'rxjs';
import { observeOpenTransactions } from '../services/transactionService';
import type { Transaction } from '../types';

interface OpenTransactionsStore {
  transactions: Transaction[];
  loading: boolean;
  error: Error | null;
  _subscription: Subscription | null;

  subscribe: () => void;
  unsubscribe: () => void;
}

const mapTransaction = (m: any): Transaction => ({
  id: m.id,
  status: m.status,
  subtotal: m.subtotal,
  discountTotal: m.discountTotal,
  taxAmount: m.taxAmount,
  grandTotal: m.grandTotal,
  customerId: m.customerId,
  vehicleId: m.vehicleId,
  mileageIn: m.mileageIn,
  mileageOut: m.mileageOut,
  notes: m.notes,
  createdAt: m.createdAt,
  createdBy: m.createdBy,
  updatedAt: m.updatedAt,
  updatedBy: m.updatedBy,
});

export const useOpenTransactionsStore = create<OpenTransactionsStore>((set, get) => ({
  transactions: [], loading: true, error: null, _subscription: null,

  subscribe: () => {
    if (get()._subscription) return;

    const sub = observeOpenTransactions().subscribe({
      next: (models) => set({ transactions: models.map(mapTransaction), loading: false }),
      error: (e) => set({ error: e, loading: false }),
    });
    set({ _subscription: sub });
  },

  unsubscribe: () => {
    get()._subscription?.unsubscribe();
    set({ _subscription: null, transactions: [], loading: true });
  },
}));
```

### Notes

- `observeOpenTransactions()` in `transactionService` should query `transactions` table filtered by `status = 'IN_PROGRESS'`, ordered by `created_at DESC`.
- This store holds transaction headers only. Line items are loaded separately by `transactionDraftStore` when a transaction is opened for editing.

---

## Acceptance Criteria

- [ ] `transactions` is populated with all `IN_PROGRESS` transactions reactively
- [ ] `loading` starts `true` and becomes `false` after first emission
- [ ] `error` is set if the observable errors
- [ ] `unsubscribe` clears subscription and resets state
- [ ] Guard prevents double-subscription
- [ ] No TypeScript errors

## Definition of Done

- Acceptance criteria met
- File committed to `main`
