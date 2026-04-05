import { create } from 'zustand';
import type { Subscription } from 'rxjs';
import { observeUsers } from '../services/userService';
import { mapUserModel } from '../services/authService';
import type { User } from '../types';

interface UserStore {
  users: User[];
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

  subscribe: () => {
    if (get()._subscription) return; // already subscribed

    const subscription = observeUsers().subscribe({
      next: (models) => {
        const users: User[] = models.map((m) => mapUserModel(m));
        set({ users, loading: false, error: null });
      },
      error: (e) => set({ error: e, loading: false }),
    });

    set({ _subscription: subscription, loading: true });
  },

  unsubscribe: () => {
    get()._subscription?.unsubscribe();
    set({ _subscription: null, users: [], loading: true });
  },
}));
