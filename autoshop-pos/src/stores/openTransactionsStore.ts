import { create } from 'zustand';
import type { Subscription } from 'rxjs';

interface OpenTransactionsStore {
  transactions: unknown[]; // will be typed as Transaction[] in AMSPOS-45
  loading: boolean;
  error: Error | null;
  _subscription: Subscription | null;

  subscribe: () => void;
  unsubscribe: () => void;
}

export const useOpenTransactionsStore = create<OpenTransactionsStore>((set, get) => ({
  transactions: [],
  loading: true,
  error: null,
  _subscription: null,

  subscribe: () => { /* implemented in AMSPOS-45 */ },
  unsubscribe: () => {
    get()._subscription?.unsubscribe();
    set({ _subscription: null });
  },
}));
