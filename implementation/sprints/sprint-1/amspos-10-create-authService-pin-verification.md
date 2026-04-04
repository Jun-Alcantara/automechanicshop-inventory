# AMSPOS-10: Create authService — PIN Verification

**Sprint**: Sprint 1 — Auth Services & Utilities
**Effort**: 1 day
**Dependencies**: AMSPOS-3, AMSPOS-9
**Phase**: Auth

---

## Description

Create `src/services/authService.ts` with functions for verifying a PIN against a user record and looking up a user by PIN. This service is used by `sessionStore` for login and unlock.

---

## Instructions

### 1. `src/services/authService.ts`

```typescript
import { database } from './database';
import { Q } from '@nozbe/watermelondb';
import { UserModel } from '../models/UserModel';
import { verifyPin } from '../utils/pinHash';
import type { User } from '../types';

/**
 * Maps a UserModel record to the plain User interface.
 * Only services (not stores or screens) call this function.
 */
export const mapUserModel = (model: UserModel): User => ({
  id: model.id,
  displayName: model.displayName,
  pinHash: model.pinHash,
  pinSalt: model.pinSalt,
  permissions: model.permissions,
  isMainAdmin: model.isMainAdmin,
  isActive: model.isActive,
  createdAt: model.createdAt,
  createdBy: model.createdBy,
  updatedAt: model.updatedAt,
  updatedBy: model.updatedBy,
});

/**
 * Looks up a user by attempting PIN verification against all active user records.
 * Returns the matching User or null if no match.
 *
 * Note: We iterate through all active users and verify the PIN hash.
 * PINs are unique across all accounts (enforced at creation time in userService),
 * so at most one user will match.
 */
export const authenticateByPin = async (pin: string): Promise<User | null> => {
  const activeUsers = await database
    .get<UserModel>('users')
    .query(Q.where('is_active', true))
    .fetch();

  for (const userModel of activeUsers) {
    const matches = await verifyPin(pin, userModel.pinHash, userModel.pinSalt);
    if (matches) {
      return mapUserModel(userModel);
    }
  }

  return null;
};

/**
 * Fetches a single user by ID.
 * Used by sessionStore.login() after successful PIN auth.
 */
export const getUserById = async (userId: string): Promise<User | null> => {
  try {
    const userModel = await database.get<UserModel>('users').find(userId);
    if (!userModel.isActive) return null;
    return mapUserModel(userModel);
  } catch {
    return null;
  }
};

/**
 * Checks whether a given PIN is already in use by any active user.
 * Used during user creation and PIN change to enforce uniqueness.
 */
export const isPinTaken = async (
  pin: string,
  excludeUserId?: string
): Promise<boolean> => {
  const activeUsers = await database
    .get<UserModel>('users')
    .query(Q.where('is_active', true))
    .fetch();

  for (const userModel of activeUsers) {
    if (excludeUserId && userModel.id === excludeUserId) continue;
    const matches = await verifyPin(pin, userModel.pinHash, userModel.pinSalt);
    if (matches) return true;
  }

  return false;
};
```

### 2. Error handling rules

- `getUserById` returns `null` (never throws) — the caller handles the missing-user case
- `authenticateByPin` returns `null` on no match — callers display "Incorrect PIN" message
- Never log PIN values — log `userId` only

### 3. Dependency rule reminder

`authService.ts` imports from `database.ts` and `UserModel`. No screen, store, or hook imports from `authService.ts` except through `sessionStore`. If a store action needs auth, it calls `authService`, not `database` directly.

---

## Acceptance Criteria

- [ ] `authenticateByPin(pin)` returns the matching `User` or `null`
- [ ] `getUserById(id)` returns a `User` or `null` (never throws)
- [ ] `isPinTaken(pin)` correctly excludes `excludeUserId` when provided
- [ ] `mapUserModel` maps all fields from `UserModel` to the `User` interface
- [ ] No TypeScript errors

## Definition of Done

- All acceptance criteria are met
- `npx tsc --noEmit` passes
- Code committed to `main`
