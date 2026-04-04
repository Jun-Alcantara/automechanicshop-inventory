# AMSPOS-79: `src/screens/admin/UserFormScreen.tsx`

**Sprint**: Sprint 8 — User Form & Inventory Screens
**Effort**: 1.5 days
**Dependencies**: AMSPOS-40 (userService, userStore)
**Phase**: Auth / User Management

---

## Description

Create or edit a user account. Route param `userId` determines mode: present = edit, absent = create. Gated by `MANAGE_USERS` permission.

---

## Instructions

### 1. `src/screens/admin/UserFormScreen.tsx`

**Permission guard:**

```typescript
usePermissionGuard('MANAGE_USERS');
```

**Route params:**

```typescript
type Params = { userId?: string };
// userId present → load existing user, pre-fill form (edit mode)
// userId absent  → blank form (create mode)
```

**Form fields:**

| Field | Type | Rules |
|-------|------|-------|
| Display Name | Text input | Required |
| PIN | Numeric input | Required on create; optional on edit (blank = keep existing) |
| Confirm PIN | Numeric input | Required when PIN is entered; must match PIN |
| Permissions | Checklist (8 items) | See below |

**Permissions checklist:**

```typescript
const PERMISSION_LABELS = {
  MANAGE_INVENTORY:    'Manage Inventory',
  CREATE_TRANSACTIONS: 'Create Transactions',
  APPLY_DISCOUNTS:     'Apply Discounts',
  VOID_TRANSACTIONS:   'Void Transactions',
  CANCEL_TRANSACTIONS: 'Cancel Transactions',
  VIEW_REPORTS:        'View Reports',
  MANAGE_SETTINGS:     'Manage Settings',
  MANAGE_USERS:        'Manage Users (Admin only)',
};
```

- `MANAGE_USERS` checkbox is **disabled** (grayed out) if the acting user is NOT Main Admin — only Main Admin can grant this permission.

**Deactivate button:**

- Shown only in **edit mode**
- Hidden when the target user is Main Admin
- Shows `Alert.alert` confirmation before calling `deactivateUser(userId)`

**Submit:**

```typescript
// Create mode: createUser({ displayName, pin, permissions })
// Edit mode:   updateUser(userId, { displayName, pin?: string, permissions })
// Validation on submit — show inline errors via AppInput.error
// Wait for service call to complete before navigating back (no optimistic UI)
```

---

## Common Rules

- Wrap in `ScreenWrapper`
- Monetary values use `formatPHP` (not applicable here, but PIN is numeric)
- Delete/deactivate confirmations use `Alert.alert` with Cancel + Confirm

---

## Acceptance Criteria

- [ ] Create mode: submitting with valid fields calls `createUser` with hashed PIN and selected permissions
- [ ] Edit mode: existing display name and permissions are pre-filled into the form
- [ ] PIN field is optional in edit mode; leaving it blank keeps the existing PIN
- [ ] `MANAGE_USERS` checkbox is disabled when the acting user is not Main Admin
- [ ] Deactivate button appears only in edit mode (and not for Main Admin target)
- [ ] Deactivate shows a confirmation dialog before calling `deactivateUser`
- [ ] Validation errors are shown inline below each field
- [ ] Screen is wrapped in `ScreenWrapper`
- [ ] No TypeScript errors
