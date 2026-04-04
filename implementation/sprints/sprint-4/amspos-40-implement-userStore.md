# AMSPOS-40: Implement userStore — Users Observable

**Sprint**: Sprint 4 — Admin Stack & Settings Infrastructure
**Effort**: 1 day
**Dependencies**: AMSPOS-10, AMSPOS-11, AMSPOS-12, AMSPOS-19
**Phase**: Foundation

---

## Description

Fully implement `src/stores/userStore.ts` by wiring it to `observeUsers()` from `userService`. The store holds the full list of user accounts. Subscribed only when the active user has `MANAGE_USERS` permission (enforced by `AppListeners`).

---

## Instructions

### 1. `src/stores/userStore.ts` (replaces skeleton)

```typescript
import { create } from 'zustand';
import type { Subscription } from 'rxjs';
import { observeUsers } from '../services/userService';
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
        const users: User[] = models.map((m) => ({
          id: m.id,
          displayName: m.displayName,
          pinHash: m.pinHash,
          pinSalt: m.pinSalt,
          permissions: m.permissions,
          isMainAdmin: m.isMainAdmin,
          isActive: m.isActive,
          createdAt: m.createdAt,
          createdBy: m.createdBy,
          updatedAt: m.updatedAt,
          updatedBy: m.updatedBy,
        }));
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
```

---

## Acceptance Criteria

- [ ] `subscribe()` calls `observeUsers()` and maps results to `User[]`
- [ ] Calling `subscribe()` when already subscribed is a no-op (guard check)
- [ ] `unsubscribe()` stops the subscription and clears the user list
- [ ] `loading` is `true` until first emission
- [ ] `error` is set on observable error
- [ ] No TypeScript errors

## Definition of Done

- All acceptance criteria are met
- Code committed to `main`
