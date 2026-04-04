# AMSPOS-49: Create Permission Check Utilities

**Sprint**: Sprint 2 — Auth Screens & Components
**Effort**: 0.5 day
**Dependencies**: None
**Phase**: Foundation

---

## Description

`hasPermission` was introduced in AMSPOS-17. This task ensures `src/utils/permissions.ts` is complete, tested, and re-exports properly. Add a second utility `requirePermission` (throws if user lacks permission, for service-layer enforcement).

---

## Instructions

### 1. Complete `src/utils/permissions.ts`

```typescript
import type { User } from '../types';
import type { Permission } from '../constants/permissions';

export const hasPermission = (user: User | null, permission: Permission): boolean => {
  if (!user) return false;
  if (user.isMainAdmin) return true;
  return user.permissions.includes(permission);
};

/**
 * Throws an error if the user does not have the required permission.
 * Use at the start of service functions that require authorization.
 */
export const requirePermission = (user: User | null, permission: Permission): void => {
  if (!hasPermission(user, permission)) {
    throw new Error(`Permission denied: ${permission} required.`);
  }
};
```

### 2. Unit tests

```typescript
// src/utils/__tests__/permissions.test.ts
import { hasPermission, requirePermission } from '../permissions';
import type { User } from '../../types';

const makeUser = (permissions: string[], isMainAdmin = false): User =>
  ({ permissions, isMainAdmin, isActive: true } as User);

describe('hasPermission', () => {
  it('null user → false', () => expect(hasPermission(null, 'MANAGE_INVENTORY')).toBe(false));
  it('mainAdmin → always true', () => expect(hasPermission(makeUser([], true), 'MANAGE_INVENTORY')).toBe(true));
  it('user with permission → true', () => expect(hasPermission(makeUser(['MANAGE_INVENTORY']), 'MANAGE_INVENTORY')).toBe(true));
  it('user without permission → false', () => expect(hasPermission(makeUser([]), 'MANAGE_INVENTORY')).toBe(false));
});

describe('requirePermission', () => {
  it('throws for missing permission', () => {
    expect(() => requirePermission(makeUser([]), 'MANAGE_USERS')).toThrow('Permission denied');
  });
  it('does not throw for valid permission', () => {
    expect(() => requirePermission(makeUser(['MANAGE_USERS']), 'MANAGE_USERS')).not.toThrow();
  });
});
```

---

## Acceptance Criteria

- [ ] `hasPermission` works for null, mainAdmin, and regular users
- [ ] `requirePermission` throws with a descriptive message when permission is missing
- [ ] Unit tests pass
- [ ] No TypeScript errors

## Definition of Done

- All acceptance criteria are met
- Tests pass
- Code committed to `main`
