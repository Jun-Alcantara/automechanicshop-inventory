# AMSPOS-85: `src/screens/admin/AdminMenuScreen.tsx`

**Sprint**: Sprint 7 — Dashboard, Reports & User Screens
**Effort**: 0.5 day
**Dependencies**: AMSPOS-41, AMSPOS-42, AMSPOS-40 (Sprints 5-6)
**Phase**: Auth / Navigation

---

## Description

Entry point for the Admin tab. Renders a permission-gated list of navigation items. Only items the current user has permission to access are shown.

---

## Instructions

### 1. `src/screens/admin/AdminMenuScreen.tsx`

```typescript
// Menu items and their required permissions:
// - "Customers"     → navigate to CustomerList  (requires: CREATE_TRANSACTIONS)
// - "Reports"       → navigate to ReportsScreen (requires: VIEW_REPORTS)
// - "Audit Log"     → navigate to AuditLogScreen (requires: VIEW_REPORTS)
// - "Users"         → navigate to UserListScreen (requires: MANAGE_USERS)
// - "Settings"      → navigate to SettingsScreen (requires: MANAGE_SETTINGS)
// - "Change My PIN" → navigate to ChangeOwnPin   (always visible)

// Use useHasPermission() hook to conditionally render each item.
// Render each visible item as a TouchableOpacity row with a right chevron icon.
// Wrap in ScreenWrapper.
```

**Example structure:**

```tsx
const MENU_ITEMS = [
  { label: 'Customers',     screen: 'CustomerList',   permission: 'CREATE_TRANSACTIONS' },
  { label: 'Reports',       screen: 'Reports',        permission: 'VIEW_REPORTS' },
  { label: 'Audit Log',     screen: 'AuditLog',       permission: 'VIEW_REPORTS' },
  { label: 'Users',         screen: 'UserList',       permission: 'MANAGE_USERS' },
  { label: 'Settings',      screen: 'Settings',       permission: 'MANAGE_SETTINGS' },
  { label: 'Change My PIN', screen: 'ChangeOwnPin',   permission: null }, // always visible
];
```

Filter items where `permission === null || useHasPermission(permission)` before rendering.

---

## Acceptance Criteria

- [ ] Only menu items for which the current user has permission are rendered
- [ ] "Change My PIN" is always visible regardless of role
- [ ] Tapping each item navigates to the correct screen
- [ ] Each row shows a right-pointing chevron
- [ ] Screen is wrapped in `ScreenWrapper`
- [ ] No TypeScript errors
