# AMSPOS-16: Implement usePermissionGuard Hook

**Sprint**: Sprint 2 — Auth Screens & Components
**Effort**: 0.5 day
**Dependencies**: AMSPOS-12
**Phase**: Auth

---

## Description

Create `src/hooks/usePermissionGuard.ts`. This hook is called at the top of every permission-gated screen. If the current user lacks the required permission, it navigates back and shows a toast. Returns a boolean so the screen can render `null` before the check resolves.

---

## Instructions

### 1. `src/hooks/usePermissionGuard.ts`

```typescript
import { useEffect } from 'react';
import { Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSessionStore } from '@stores/sessionStore';
import { hasPermission } from '@utils/permissions';
import type { Permission } from '@constants/permissions';

/**
 * Screen-level permission guard.
 * Call at the very top of a screen component (before any other hooks).
 * Returns true when authorized, false when not.
 *
 * Usage:
 *   const isAuthorized = usePermissionGuard('MANAGE_INVENTORY');
 *   if (!isAuthorized) return null;
 */
export const usePermissionGuard = (permission: Permission): boolean => {
  const user = useSessionStore((s) => s.user);
  const navigation = useNavigation();
  const isAuthorized = hasPermission(user, permission);

  useEffect(() => {
    if (!isAuthorized) {
      navigation.goBack();
      Alert.alert(
        'Access Denied',
        "You don't have permission to access this screen."
      );
    }
  }, [isAuthorized, navigation]);

  return isAuthorized;
};
```

### 2. Usage pattern in screens

```typescript
export const ProductFormScreen: React.FC = () => {
  const isAuthorized = usePermissionGuard('MANAGE_INVENTORY');
  if (!isAuthorized) return null; // prevents any screen effects from running

  // ... rest of screen
};
```

Returning `null` is critical — without it, `useEffect` hooks in the screen body would run before the guard fires, potentially triggering unauthorized database queries.

---

## Acceptance Criteria

- [ ] `usePermissionGuard(permission)` reads `user` from `useSessionStore`
- [ ] Returns `false` and calls `navigation.goBack()` + `Alert.alert` when user lacks permission
- [ ] Returns `true` when user has the permission
- [ ] Main Admin (`isMainAdmin: true`) always returns `true`
- [ ] No TypeScript errors

## Definition of Done

- All acceptance criteria are met
- Code committed to `main`
