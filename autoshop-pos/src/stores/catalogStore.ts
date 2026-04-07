import { create } from 'zustand';
import type { Subscription } from 'rxjs';
import { observeCategories, observeSuppliers, observeAddOns } from '../services/catalogService';
import type { Category, Supplier, AddOn } from '../types';
import type { CategoryModel } from '../models/CategoryModel';
import type { SupplierModel } from '../models/SupplierModel';
import type { AddOnModel } from '../models/AddOnModel';

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

const mapCategory = (m: CategoryModel): Category => ({
  id: m.id,
  name: m.name,
  createdAt: m.createdAt,
  createdBy: m.createdBy,
});

const mapSupplier = (m: SupplierModel): Supplier => ({
  id: m.id,
  name: m.name,
  contactInfo: m.contactInfo,
  createdAt: m.createdAt,
  createdBy: m.createdBy,
});

const mapAddOn = (m: AddOnModel): AddOn => ({
  id: m.id,
  name: m.name,
  amount: m.amount,
  isActive: m.isActive,
  createdAt: m.createdAt,
  createdBy: m.createdBy,
});

export const useCatalogStore = create<CatalogStore>((set, get) => ({
  categories: [],
  suppliers: [],
  addOns: [],
  loading: true,
  error: null,
  _categorySubscription: null,
  _supplierSubscription: null,
  _addOnSubscription: null,

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
      _categorySubscription: null,
      _supplierSubscription: null,
      _addOnSubscription: null,
      categories: [],
      suppliers: [],
      addOns: [],
      loading: true,
    });
  },
}));
