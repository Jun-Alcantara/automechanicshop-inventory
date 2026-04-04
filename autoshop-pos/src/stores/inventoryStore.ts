import { create } from 'zustand';
import type { Subscription } from 'rxjs';

interface InventoryStore {
  products: unknown[];
  serviceItems: unknown[];
  loading: boolean;
  error: Error | null;
  _productSubscription: Subscription | null;
  _serviceSubscription: Subscription | null;

  subscribe: () => void;
  unsubscribe: () => void;
}

export const useInventoryStore = create<InventoryStore>((set, get) => ({
  products: [],
  serviceItems: [],
  loading: true,
  error: null,
  _productSubscription: null,
  _serviceSubscription: null,

  subscribe: () => { /* implemented in AMSPOS-41 */ },
  unsubscribe: () => {
    get()._productSubscription?.unsubscribe();
    get()._serviceSubscription?.unsubscribe();
    set({ _productSubscription: null, _serviceSubscription: null });
  },
}));
