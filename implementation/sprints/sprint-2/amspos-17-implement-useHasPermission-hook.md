# AMSPOS-17: Implement useHasPermission Hook

**Sprint**: Sprint 2 — Auth Screens & Components
**Effort**: 0.5 day
**Dependencies**: AMSPOS-12
**Phase**: Auth

---

## Description

Create `src/hooks/useHasPermission.ts`. Returns a boolean for conditional UI rendering (show/hide buttons). Lighter than `usePermissionGuard` — does not navigate away, just returns the boolean.

---

## Instructions

### 1. `src/utils/permissions.ts`

First, create the `hasPermission` pure utility (referenced by both hooks):

```typescript
import type { User } from '../types';
import type { Permission } from '../constants/permissions';

/**
 * Pure utility — no hooks, no side effects.
 * Used inside services and store actions for access checks.
 */
export const hasPermission = (user: User | null, permission: Permission): boolean => {
  if (!user) return false;
  if (user.isMainAdmin) return true;
  return user.permissions.includes(permission);
};
```

### 2. `src/hooks/useHasPermission.ts`

```typescript
import { useSessionStore } from '@stores/sessionStore';
import { hasPermission } from '@utils/permissions';
import type { Permission } from '@constants/permissions';

/**
 * Returns true if the current user has the given permission.
 * Use for conditional UI rendering (show/hide buttons, sections).
 *
 * Usage:
 *   const canApplyDiscount = useHasPermission('APPLY_DISCOUNTS');
 *   {canApplyDiscount && <AppButton label="Apply Discount" onPress={...} />}
 */
export const useHasPermission = (permission: Permission): boolean => {
  const user = useSessionStore((s) => s.user);
  return hasPermission(user, permission);
};
```

---

## Acceptance Criteria

- [ ] `hasPermission(null, any)` returns `false`
- [ ] `hasPermission(mainAdminUser, any)` returns `true`
- [ ] `hasPermission(user, 'MANAGE_INVENTORY')` returns `true` only if the permission is in `user.permissions`
- [ ] `useHasPermission` is a React hook that reads from `useSessionStore`
- [ ] No TypeScript errors

## Definition of Done

- All acceptance criteria are met
- Code committed to `main`
