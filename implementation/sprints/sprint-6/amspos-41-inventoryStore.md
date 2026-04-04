# AMSPOS-41: Implement `inventoryStore`

**Sprint**: Sprint 6 — Zustand Stores
**Effort**: 1 day
**Dependencies**: AMSPOS-33 (productService), AMSPOS-34 (serviceItemService)
**Phase**: Foundation

---

## Description

Implement `src/stores/inventoryStore.ts`. Wire to `observeProducts()` and `observeServiceItems()` observables from their respective services. Map WatermelonDB model instances to typed plain objects and expose them as reactive Zustand state.

---

## Instructions

### 1. `src/stores/inventoryStore.ts`

```typescript
import { create } from 'zustand';
import type { Subscription } from 'rxjs';
import { observeProducts } from '../services/productService';
import { observeServiceItems } from '../services/serviceItemService';
import type { Product, ServiceItem } from '../types';

interface InventoryStore {
  products: Product[];
  serviceItems: ServiceItem[];
  loading: boolean;
  error: Error | null;
  _productSubscription: Subscription | null;
  _serviceSubscription: Subscription | null;

  subscribe: () => void;
  unsubscribe: () => void;
}

const mapProduct = (m: any): Product => ({
  id: m.id, name: m.name, barcode: m.barcode,
  sellingPrice: m.sellingPrice, costPrice: m.costPrice,
  unitOfMeasure: m.unitOfMeasure, stockAvailable: m.stockAvailable,
  stockReserved: m.stockReserved, lowStockThreshold: m.lowStockThreshold,
  categoryId: m.categoryId, supplierId: m.supplierId,
  isActive: m.isActive, createdAt: m.createdAt, createdBy: m.createdBy,
  updatedAt: m.updatedAt, updatedBy: m.updatedBy,
});

const mapServiceItem = (m: any): ServiceItem => ({
  id: m.id, name: m.name, basePrice: m.basePrice,
  isActive: m.isActive, createdAt: m.createdAt, createdBy: m.createdBy,
  updatedAt: m.updatedAt, updatedBy: m.updatedBy,
});

export const useInventoryStore = create<InventoryStore>((set, get) => ({
  products: [], serviceItems: [], loading: true, error: null,
  _productSubscription: null, _serviceSubscription: null,

  subscribe: () => {
    if (get()._productSubscription) return;

    const ps = observeProducts().subscribe({
      next: (models) => set({ products: models.map(mapProduct), loading: false }),
      error: (e) => set({ error: e, loading: false }),
    });
    const ss = observeServiceItems().subscribe({
      next: (models) => set({ serviceItems: models.map(mapServiceItem) }),
      error: (e) => set({ error: e }),
    });
    set({ _productSubscription: ps, _serviceSubscription: ss });
  },

  unsubscribe: () => {
    get()._productSubscription?.unsubscribe();
    get()._serviceSubscription?.unsubscribe();
    set({ _productSubscription: null, _serviceSubscription: null, products: [], serviceItems: [], loading: true });
  },
}));
```

---

## Acceptance Criteria

- [ ] `products` and `serviceItems` are populated reactively from their observables
- [ ] `loading` starts `true` and becomes `false` after first `products` emission
- [ ] `error` is set if either observable errors
- [ ] `unsubscribe` clears subscriptions and resets state
- [ ] Guard prevents double-subscription (`if (get()._productSubscription) return`)
- [ ] No TypeScript errors

## Definition of Done

- Acceptance criteria met
- File committed to `main`
