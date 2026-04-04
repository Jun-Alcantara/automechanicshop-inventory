import { create } from 'zustand';

interface SessionStore {
  user: null; // will be typed as User | null in AMSPOS-12
  status: 'NONE' | 'ACTIVE' | 'LOCKED';
  lastActivityAt: number;

  login: (userId: string) => Promise<void>;
  logout: () => void;
  lock: () => void;
  unlock: (pin: string) => Promise<boolean>;
  refreshActivity: () => void;
}

export const useSessionStore = create<SessionStore>((set, get) => ({
  user: null,
  status: 'NONE',
  lastActivityAt: 0,

  login: async (_userId) => { /* implemented in AMSPOS-12 */ },
  logout: () => set({ user: null, status: 'NONE' }),
  lock: () => set({ status: 'LOCKED' }),
  unlock: async (_pin) => false,
  refreshActivity: () => set({ lastActivityAt: Date.now() }),
}));
