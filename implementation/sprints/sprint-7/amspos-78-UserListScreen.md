# AMSPOS-78: `src/screens/admin/UserListScreen.tsx`

**Sprint**: Sprint 7 — Dashboard, Reports & User Screens
**Effort**: 1 day
**Dependencies**: AMSPOS-40 (userStore / userService)
**Phase**: Auth / User Management

---

## Description

Admin screen that lists all users (active and deactivated). Gated by `MANAGE_USERS` permission. Supports creating a new user and editing an existing one.

---

## Instructions

### 1. `src/screens/admin/UserListScreen.tsx`

**Permission guard:**

```typescript
usePermissionGuard('MANAGE_USERS');
```

**Data source:**

```typescript
const { users } = useUserStore(); // includes active + deactivated
```

**Inline `UserRow` component** (no separate file needed for MVP):

```typescript
// Each row displays:
// - Display name
// - Active / Deactivated badge
// - Number of permissions assigned
// - Deactivated users rendered at reduced opacity (e.g. opacity: 0.4)
// - Tapping a row navigates to UserForm with { userId: user.id }
```

**"New User" button:**

- Shown as a FAB or header right button
- Navigates to `UserForm` with no `userId` (create mode)

**Layout:**

```
┌─────────────────────────────────────┐
│  Users                    [+ New]   │  ← header button or FAB
├─────────────────────────────────────┤
│  John Doe        [Active]   3 perms │
│  Jane Smith   [Deactivated] 1 perm  │  ← reduced opacity
│  ...                                │
└─────────────────────────────────────┘
```

- `FlatList` for the user list
- Show `EmptyState` if `users` array is empty
- Wrap in `ScreenWrapper`

---

## Acceptance Criteria

- [ ] Screen is blocked for users without `MANAGE_USERS` permission
- [ ] Lists all users (active and deactivated) from `useUserStore`
- [ ] Each row shows display name, active/deactivated badge, and permission count
- [ ] Deactivated users are shown at reduced opacity
- [ ] Tapping a row navigates to `UserForm` with the user's ID
- [ ] "New User" button navigates to `UserForm` in create mode (no ID)
- [ ] `EmptyState` is shown when the user list is empty
- [ ] Screen is wrapped in `ScreenWrapper`
- [ ] No TypeScript errors
