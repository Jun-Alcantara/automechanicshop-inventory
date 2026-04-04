# AMSPOS-19: Implement AppListeners — Subscription Lifecycle

**Sprint**: Sprint 2 — Auth Screens & Components
**Effort**: 1 day
**Dependencies**: AMSPOS-13, AMSPOS-14, AMSPOS-15, AMSPOS-18
**Phase**: Auth

---

## Description

Create `src/components/layout/AppListeners.tsx`. This component mounts inside `RootNavigator`, watches `sessionStore.status`, and manages the lifecycle of all WatermelonDB observable subscriptions. When status becomes `ACTIVE`, it subscribes all stores. When `LOCKED` or `NONE`, it unsubscribes all.

It also mounts `useInactivityTimer`.

---

## Instructions

### 1. `src/components/layout/AppListeners.tsx`

```typescript
import React, { useEffect } from 'react';
import { useSessionStore } from '@stores/sessionStore';
import { useInventoryStore } from '@stores/inventoryStore';
import { useCatalogStore } from '@stores/catalogStore';
import { useOpenTransactionsStore } from '@stores/openTransactionsStore';
import { useSettingsStore } from '@stores/settingsStore';
import { useUserStore } from '@stores/userStore';
import { useInactivityTimer } from '@hooks/useInactivityTimer';
import { hasPermission } from '@utils/permissions';

/**
 * Mounts as a sibling to the main navigation tree inside RootNavigator.
 * Manages all Zustand store subscriptions tied to the active session.
 */
export const AppListeners: React.FC = () => {
  const { status, user } = useSessionStore();

  // Always mount inactivity timer — it self-activates only when status === 'ACTIVE'
  useInactivityTimer();

  useEffect(() => {
    if (status === 'ACTIVE') {
      // Subscribe all unconditional stores
      useSettingsStore.getState().subscribe();
      useInventoryStore.getState().subscribe();
      useCatalogStore.getState().subscribe();
      useOpenTransactionsStore.getState().subscribe();

      // Conditional: userStore only for MANAGE_USERS permission
      if (user && hasPermission(user, 'MANAGE_USERS')) {
        useUserStore.getState().subscribe();
      }
    } else {
      // Unsubscribe all on LOCKED or NONE
      useSettingsStore.getState().unsubscribe();
      useInventoryStore.getState().unsubscribe();
      useCatalogStore.getState().unsubscribe();
      useOpenTransactionsStore.getState().unsubscribe();
      useUserStore.getState().unsubscribe();
    }
  }, [status, user]);

  // This component renders nothing — it is a side-effect-only component
  return null;
};
```

### 2. Error surface

Each store's observable subscription has an `error` callback that sets `store.error`. Add a separate `AppErrorBanner` component (AMSPOS-86) to read these errors and display a banner. `AppListeners` does not directly render UI.

### 3. Where to mount

Mount `AppListeners` inside `RootNavigator` but outside the `Stack.Navigator` so it persists across all navigation states:

```typescript
// In RootNavigator.tsx (AMSPOS-21):
return (
  <>
    <AppListeners />
    <Stack.Navigator>
      {/* ... screens */}
    </Stack.Navigator>
  </>
);
```

---

## Acceptance Criteria

- [ ] When `status === 'ACTIVE'`, subscribes: `settingsStore`, `inventoryStore`, `catalogStore`, `openTransactionsStore`
- [ ] When `status === 'ACTIVE'` and user has `MANAGE_USERS`, also subscribes `userStore`
- [ ] When `status !== 'ACTIVE'`, unsubscribes all stores
- [ ] `useInactivityTimer` is called inside this component
- [ ] Component renders `null` (no UI)
- [ ] No TypeScript errors

## Definition of Done

- All acceptance criteria are met
- Manually verify: login → stores subscribe; logout → stores unsubscribe (check via console logs in store subscribe/unsubscribe)
- Code committed to `main`
