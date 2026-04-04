import { create } from 'zustand';
import type { Subscription } from 'rxjs';

interface CatalogStore {
  categories: unknown[];
  suppliers: unknown[];
  addOns: unknown[];
  error: Error | null;
  _subscription: Subscription | null;

  subscribe: () => void;
  unsubscribe: () => void;
}

export const useCatalogStore = create<CatalogStore>((set, get) => ({
  categories: [],
  suppliers: [],
  addOns: [],
  error: null,
  _subscription: null,

  subscribe: () => { /* implemented in AMSPOS-42 */ },
  unsubscribe: () => {
    get()._subscription?.unsubscribe();
    set({ _subscription: null });
  },
}));
