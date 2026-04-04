# AMSPOS-11: Create userService — CRUD and Observable

**Sprint**: Sprint 1 — Auth Services & Utilities
**Effort**: 1 day
**Dependencies**: AMSPOS-3, AMSPOS-10
**Phase**: Auth

---

## Description

Create `src/services/userService.ts` with full CRUD for the `users` table and a WatermelonDB observable query. Includes user creation (with PIN hashing), deactivation, permission updates, and PIN reset. All writes are atomic with their audit log entries.

---

## Instructions

### 1. `src/services/userService.ts`

```typescript
import { database } from './database';
import { Q } from '@nozbe/watermelondb';
import { UserModel } from '../models/UserModel';
import { mapUserModel } from './authService';
import { generateSalt, hashPin, isPinTaken } from '../utils/pinHash';
import { PERMISSIONS, type Permission } from '../constants/permissions';
import type { User } from '../types';

// ─── Observable ──────────────────────────────────────────────────────────────

/**
 * Observable query for all users (active and inactive).
 * Subscribed to by useUserStore.
 */
export const observeUsers = () =>
  database
    .get<UserModel>('users')
    .query(Q.sortBy('display_name', Q.asc))
    .observe();

// ─── Reads ────────────────────────────────────────────────────────────────────

export const getAllUsers = async (): Promise<User[]> => {
  const models = await database
    .get<UserModel>('users')
    .query(Q.sortBy('display_name', Q.asc))
    .fetch();
  return models.map(mapUserModel);
};

// ─── Writes ───────────────────────────────────────────────────────────────────

interface CreateUserInput {
  displayName: string;
  pin: string;
  permissions: Permission[];
  actingUser: User;
}

export const createUser = async ({
  displayName,
  pin,
  permissions,
  actingUser,
}: CreateUserInput): Promise<User> => {
  if (await isPinTaken(pin)) {
    throw new Error('PIN is already in use. Choose a different PIN.');
  }

  const salt = await generateSalt();
  const pinHash = await hashPin(pin, salt);

  let createdUser: User | null = null;

  await database.write(async () => {
    const model = await database.get<UserModel>('users').create((u) => {
      u.displayName = displayName;
      u.pinHash = pinHash;
      u.pinSalt = salt;
      u.permissions = permissions;
      u.isMainAdmin = false;
      u.isActive = true;
      u.createdAt = new Date();
      u.createdBy = actingUser.id;
      u.updatedAt = new Date();
      u.updatedBy = actingUser.id;
    });

    await database.get('audit_logs').create((log: any) => {
      log.timestamp = new Date();
      log.userId = actingUser.id;
      log.userName = actingUser.displayName;
      log.actionType = 'CREATE_USER';
      log.entityType = 'USER';
      log.entityId = model.id;
      log.after = JSON.stringify({ displayName, permissions });
      log.note = '';
    });

    createdUser = mapUserModel(model);
  });

  return createdUser!;
};

interface UpdateUserInput {
  userId: string;
  displayName?: string;
  permissions?: Permission[];
  actingUser: User;
}

export const updateUser = async ({
  userId,
  displayName,
  permissions,
  actingUser,
}: UpdateUserInput): Promise<void> => {
  const model = await database.get<UserModel>('users').find(userId);

  await database.write(async () => {
    const before: Record<string, unknown> = {};
    const after: Record<string, unknown> = {};

    await model.update((u) => {
      if (displayName !== undefined) {
        before.displayName = u.displayName;
        after.displayName = displayName;
        u.displayName = displayName;
      }
      if (permissions !== undefined) {
        before.permissions = u.permissions;
        after.permissions = permissions;
        u.permissions = permissions;
      }
      u.updatedAt = new Date();
      u.updatedBy = actingUser.id;
    });

    await database.get('audit_logs').create((log: any) => {
      log.timestamp = new Date();
      log.userId = actingUser.id;
      log.userName = actingUser.displayName;
      log.actionType = 'EDIT_USER';
      log.entityType = 'USER';
      log.entityId = userId;
      log.before = JSON.stringify(before);
      log.after = JSON.stringify(after);
      log.note = '';
    });
  });
};

export const deactivateUser = async (userId: string, actingUser: User): Promise<void> => {
  const model = await database.get<UserModel>('users').find(userId);

  await database.write(async () => {
    await model.update((u) => {
      u.isActive = false;
      u.updatedAt = new Date();
      u.updatedBy = actingUser.id;
    });

    await database.get('audit_logs').create((log: any) => {
      log.timestamp = new Date();
      log.userId = actingUser.id;
      log.userName = actingUser.displayName;
      log.actionType = 'DEACTIVATE_USER';
      log.entityType = 'USER';
      log.entityId = userId;
      log.note = '';
    });
  });
};

export const resetUserPin = async (
  userId: string,
  newPin: string,
  actingUser: User
): Promise<void> => {
  if (await isPinTaken(newPin, userId)) {
    throw new Error('PIN is already in use. Choose a different PIN.');
  }

  const model = await database.get<UserModel>('users').find(userId);
  const salt = await generateSalt();
  const pinHashValue = await hashPin(newPin, salt);

  await database.write(async () => {
    await model.update((u) => {
      u.pinHash = pinHashValue;
      u.pinSalt = salt;
      u.updatedAt = new Date();
      u.updatedBy = actingUser.id;
    });

    await database.get('audit_logs').create((log: any) => {
      log.timestamp = new Date();
      log.userId = actingUser.id;
      log.userName = actingUser.displayName;
      log.actionType = 'RESET_PIN';
      log.entityType = 'USER';
      log.entityId = userId;
      log.note = '';
    });
  });
};

export const changeOwnPin = async (
  user: User,
  currentPin: string,
  newPin: string
): Promise<void> => {
  const { verifyPin } = await import('../utils/pinHash');
  const isCorrect = await verifyPin(currentPin, user.pinHash, user.pinSalt);
  if (!isCorrect) throw new Error('Current PIN is incorrect.');

  if (await isPinTaken(newPin, user.id)) {
    throw new Error('PIN is already in use. Choose a different PIN.');
  }

  const model = await database.get<UserModel>('users').find(user.id);
  const salt = await generateSalt();
  const pinHashValue = await hashPin(newPin, salt);

  await database.write(async () => {
    await model.update((u) => {
      u.pinHash = pinHashValue;
      u.pinSalt = salt;
      u.updatedAt = new Date();
      u.updatedBy = user.id;
    });

    await database.get('audit_logs').create((log: any) => {
      log.timestamp = new Date();
      log.userId = user.id;
      log.userName = user.displayName;
      log.actionType = 'CHANGE_PIN';
      log.entityType = 'USER';
      log.entityId = user.id;
      log.note = '';
    });
  });
};

/**
 * Seeds the Main Admin account during first-time setup.
 * Called once from InitSetupScreen. Returns the created User.
 */
export const createMainAdmin = async (
  displayName: string,
  pin: string
): Promise<User> => {
  const salt = await generateSalt();
  const pinHashValue = await hashPin(pin, salt);
  const allPermissions = Object.values(PERMISSIONS) as Permission[];

  let mainAdmin: User | null = null;

  await database.write(async () => {
    const model = await database.get<UserModel>('users').create((u) => {
      u.displayName = displayName;
      u.pinHash = pinHashValue;
      u.pinSalt = salt;
      u.permissions = allPermissions;
      u.isMainAdmin = true;
      u.isActive = true;
      u.createdAt = new Date();
      u.createdBy = 'system';
      u.updatedAt = new Date();
      u.updatedBy = 'system';
    });

    mainAdmin = mapUserModel(model);
  });

  return mainAdmin!;
};
```

---

## Acceptance Criteria

- [ ] `observeUsers()` returns a WatermelonDB Observable
- [ ] `createUser` hashes PIN, enforces uniqueness, writes user + audit log atomically
- [ ] `updateUser` records before/after values in audit log
- [ ] `deactivateUser` sets `isActive = false` with audit log entry
- [ ] `resetUserPin` and `changeOwnPin` hash new PIN and enforce uniqueness
- [ ] `createMainAdmin` creates a user with `isMainAdmin: true` and all permissions
- [ ] All writes use a single `database.write()` block (atomic with audit log)
- [ ] No TypeScript errors

## Definition of Done

- All acceptance criteria are met
- `npx tsc --noEmit` passes
- Code committed to `main`
