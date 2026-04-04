# AMSPOS-42: Implement `catalogStore`

**Sprint**: Sprint 6 — Zustand Stores
**Effort**: 1 day
**Dependencies**: AMSPOS-35 (catalogService)
**Phase**: Foundation

---

## Description

Implement `src/stores/catalogStore.ts`. Wire to `observeCategories()`, `observeSuppliers()`, and `observeAddOns()` from `catalogService`. Maps each model to its corresponding typed plain object. Follows the same pattern as `inventoryStore` but with three entity types.

---

## Instructions

### 1. `src/stores/catalogStore.ts`

```typescript
import { create } from 'zustand';
import type { Subscription } from 'rxjs';
import { observeCategories, observeSuppliers, observeAddOns } from '../services/catalogService';
import type { Category, Supplier, AddOn } from '../types';

interface CatalogStore {
  categories: Category[];
  suppliers: Supplier[];
  addOns: AddOn[];
  loading: boolean;
  error: Error | null;
  _categorySubscription: Subscription | null;
  _supplierSubscription: Subscription | null;
  _addOnSubscription: Subscription | null;

  subscribe: () => void;
  unsubscribe: () => void;
}

const mapCategory = (m: any): Category => ({
  id: m.id, name: m.name,
  isActive: m.isActive, createdAt: m.createdAt, createdBy: m.createdBy,
  updatedAt: m.updatedAt, updatedBy: m.updatedBy,
});

const mapSupplier = (m: any): Supplier => ({
  id: m.id, name: m.name, contactPerson: m.contactPerson,
  phone: m.phone, email: m.email, address: m.address,
  isActive: m.isActive, createdAt: m.createdAt, createdBy: m.createdBy,
  updatedAt: m.updatedAt, updatedBy: m.updatedBy,
});

const mapAddOn = (m: any): AddOn => ({
  id: m.id, name: m.name, price: m.price,
  isActive: m.isActive, createdAt: m.createdAt, createdBy: m.createdBy,
  updatedAt: m.updatedAt, updatedBy: m.updatedBy,
});

export const useCatalogStore = create<CatalogStore>((set, get) => ({
  categories: [], suppliers: [], addOns: [], loading: true, error: null,
  _categorySubscription: null, _supplierSubscription: null, _addOnSubscription: null,

  subscribe: () => {
    if (get()._categorySubscription) return;

    const cs = observeCategories().subscribe({
      next: (models) => set({ categories: models.map(mapCategory), loading: false }),
      error: (e) => set({ error: e, loading: false }),
    });
    const ss = observeSuppliers().subscribe({
      next: (models) => set({ suppliers: models.map(mapSupplier) }),
      error: (e) => set({ error: e }),
    });
    const as = observeAddOns().subscribe({
      next: (models) => set({ addOns: models.map(mapAddOn) }),
      error: (e) => set({ error: e }),
    });
    set({ _categorySubscription: cs, _supplierSubscription: ss, _addOnSubscription: as });
  },

  unsubscribe: () => {
    get()._categorySubscription?.unsubscribe();
    get()._supplierSubscription?.unsubscribe();
    get()._addOnSubscription?.unsubscribe();
    set({
      _categorySubscription: null, _supplierSubscription: null, _addOnSubscription: null,
      categories: [], suppliers: [], addOns: [], loading: true,
    });
  },
}));
```

---

## Acceptance Criteria

- [ ] `categories`, `suppliers`, and `addOns` populate reactively
- [ ] `loading` starts `true` and becomes `false` after first `categories` emission
- [ ] `error` is set if any observable errors
- [ ] `unsubscribe` clears all three subscriptions and resets state
- [ ] Guard prevents double-subscription
- [ ] No TypeScript errors

## Definition of Done

- Acceptance criteria met
- File committed to `main`
