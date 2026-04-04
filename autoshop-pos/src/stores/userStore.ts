import { create } from 'zustand';
import type { Subscription } from 'rxjs';

interface UserStore {
  users: unknown[];
  loading: boolean;
  error: Error | null;
  _subscription: Subscription | null;

  subscribe: () => void;
  unsubscribe: () => void;
}

export const useUserStore = create<UserStore>((set, get) => ({
  users: [],
  loading: true,
  error: null,
  _subscription: null,

  subscribe: () => { /* implemented in AMSPOS-40 */ },
  unsubscribe: () => {
    get()._subscription?.unsubscribe();
    set({ _subscription: null });
  },
}));
