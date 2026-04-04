# AMSPOS-12: Implement sessionStore — Login, Logout, Lock, Unlock

**Sprint**: Sprint 1 — Auth Services & Utilities
**Effort**: 1 day
**Dependencies**: AMSPOS-7, AMSPOS-10
**Phase**: Auth

---

## Description

Fully implement `src/stores/sessionStore.ts` with all session lifecycle actions: login, logout, lock, unlock. Wire it to `authService`. Add the `user` field typed as `User | null`. This store is the source of truth for who is logged in.

---

## Instructions

### 1. Replace the skeleton in `src/stores/sessionStore.ts`

```typescript
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
      const { useTransactionDraftStore } = await import('./transactionDraftStore');
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
```

### 2. Update the skeleton's type stubs

The skeleton in AMSPOS-7 used `user: null` without proper typing. Now that types exist, the compiler will enforce `User | null`. If there are any residual type errors from other stores that import `useSessionStore`, fix them by using a selector:

```typescript
// In other stores or hooks:
const user = useSessionStore(s => s.user);
```

### 3. Audit logging for login/logout

Login and logout audit entries are written by `auditService` (AMSPOS-18). `sessionStore` does not write audit logs directly — it calls auth service functions which do. The store only manages session state.

Exception: the `unlock` action is not audited at the store level — the PinLockScreen uses the `auditService` directly after a successful unlock to log the re-login event.

---

## Acceptance Criteria

- [ ] `user` field is typed as `User | null` using the `User` interface from `src/types`
- [ ] `login(userId)` fetches user from DB via `getUserById` and sets `status: 'ACTIVE'`
- [ ] `logout()` sets `user: null, status: 'NONE'`
- [ ] `lock()` sets `status: 'LOCKED'` without clearing `user`
- [ ] `unlock(pin)` verifies PIN via `authenticateByPin`, clears draft if different user unlocks, returns `boolean`
- [ ] `refreshActivity()` updates `lastActivityAt` to `Date.now()`
- [ ] No TypeScript errors

## Definition of Done

- All acceptance criteria are met
- `npx tsc --noEmit` passes
- Code committed to `main`
