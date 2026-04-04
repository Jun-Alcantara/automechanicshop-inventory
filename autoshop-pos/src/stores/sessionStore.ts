import { create } from 'zustand';
import { authenticateByPin, getUserById } from '../services/authService';
import type { User } from '../types';

interface SessionStore {
  user: User | null;
  status: 'NONE' | 'ACTIVE' | 'LOCKED';
  lastActivityAt: number;

  login: (userId: string) => Promise<void>;
  logout: () => void;
  lock: () => void;
  unlock: (pin: string) => Promise<boolean>;
  refreshActivity: () => void;
  authenticatePin: (pin: string) => Promise<User | null>;
}

export const useSessionStore = create<SessionStore>((set, get) => ({
  user: null,
  status: 'NONE',
  lastActivityAt: 0,

  /**
   * Called after PIN is verified. Loads the user record from DB and sets status ACTIVE.
   */
  login: async (userId: string) => {
    const user = await getUserById(userId);
    if (!user) throw new Error('User not found after authentication.');
    set({ user, status: 'ACTIVE', lastActivityAt: Date.now() });
  },

  /**
   * Logs the current user out. All subscriptions are cleaned up by AppListeners.
   */
  logout: () => {
    set({ user: null, status: 'NONE', lastActivityAt: 0 });
  },

  /**
   * Locks the session. Status becomes LOCKED but user ref is preserved
   * (needed to show the locked user's name on PinLockScreen).
   */
  lock: () => {
    set({ status: 'LOCKED' });
  },

  /**
   * Verifies the PIN and unlocks. Returns true if correct.
   * If a different user unlocks (different PIN owner), clears the draft store
   * to prevent User B from inheriting User A's transaction context.
   */
  unlock: async (pin: string): Promise<boolean> => {
    const matchedUser = await authenticateByPin(pin);
    if (!matchedUser) return false;

    const currentUserId = get().user?.id;

    if (matchedUser.id !== currentUserId) {
      // Different user unlocked — clear draft store
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { useTransactionDraftStore } = require('./transactionDraftStore') as typeof import('./transactionDraftStore');
      useTransactionDraftStore.getState().clearDraft();
    }

    set({ user: matchedUser, status: 'ACTIVE', lastActivityAt: Date.now() });
    return true;
  },

  /**
   * Resets the inactivity timer. Called on every user interaction.
   */
  refreshActivity: () => {
    set({ lastActivityAt: Date.now() });
  },

  /**
   * Exposed for the initial login flow (not unlock).
   * Used by PinLockScreen / InitSetupScreen via usePinAuth hook.
   */
  authenticatePin: async (pin: string): Promise<User | null> => {
    return authenticateByPin(pin);
  },
}));
