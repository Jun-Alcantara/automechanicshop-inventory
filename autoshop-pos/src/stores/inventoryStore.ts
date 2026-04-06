import { create } from 'zustand';
import type { Subscription } from 'rxjs';
import { observeProducts } from '../services/productService';
import { observeServiceItems } from '../services/serviceItemService';
import type { Product, ServiceItem } from '../types';
import type { ProductModel } from '../models/ProductModel';
import type { ServiceModel } from '../models/ServiceModel';

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

const mapProduct = (m: ProductModel): Product => ({
  id: m.id,
  name: m.name,
  barcode: m.barcode,
  sellingPrice: m.sellingPrice,
  costPrice: m.costPrice,
  unitOfMeasure: m.unitOfMeasure,
  stockAvailable: m.stockAvailable,
  stockReserved: m.stockReserved,
  lowStockThreshold: m.lowStockThreshold,
  categoryId: m.categoryId,
  supplierId: m.supplierId,
  isActive: m.isActive,
  createdAt: m.createdAt,
  createdBy: m.createdBy,
  updatedAt: m.updatedAt,
  updatedBy: m.updatedBy,
});

const mapServiceItem = (m: ServiceModel): ServiceItem => ({
  id: m.id,
  name: m.name,
  basePrice: m.basePrice,
  isActive: m.isActive,
  createdAt: m.createdAt,
  createdBy: m.createdBy,
  updatedAt: m.updatedAt,
  updatedBy: m.updatedBy,
});

export const useInventoryStore = create<InventoryStore>((set, get) => ({
  products: [],
  serviceItems: [],
  loading: true,
  error: null,
  _productSubscription: null,
  _serviceSubscription: null,

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
    set({
      _productSubscription: null,
      _serviceSubscription: null,
      products: [],
      serviceItems: [],
      loading: true,
    });
  },
}));
