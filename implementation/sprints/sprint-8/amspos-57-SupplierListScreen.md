# AMSPOS-57: `src/screens/inventory/SupplierListScreen.tsx`

**Sprint**: Sprint 8 — User Form & Inventory Screens
**Effort**: 1 day
**Dependencies**: AMSPOS-41 (inventoryStore / supplierService)
**Phase**: Inventory

---

## Description

CRUD screen for suppliers. Gated by `MANAGE_INVENTORY`. Supports create, edit, and delete.

---

## Instructions

### 1. `src/screens/inventory/SupplierListScreen.tsx`

**Permission guard:**

```typescript
usePermissionGuard('MANAGE_INVENTORY');
```

**Features:**

- `FlatList` of suppliers — each row shows: **name** + **contact info** (phone or email)
- **FAB** → opens a `SupplierForm` bottom sheet (or navigates to a `SupplierFormScreen`) for creating a new supplier
- **Edit:** tap a row (or an edit button) → opens the same form pre-filled with the supplier's data
- **Delete:** swipe or delete button → confirmation dialog → `deleteSupplier(supplierId)`

**Supplier fields** (for the form):

| Field | Type | Rules |
|-------|------|-------|
| Name | Text | Required |
| Contact (phone/email) | Text | Optional |
| Address | Text | Optional |

**Delete confirmation:**

```typescript
Alert.alert(
  'Delete Supplier',
  `Delete "${supplier.name}"? This cannot be undone.`,
  [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Delete', style: 'destructive', onPress: () => deleteSupplier(supplier.id) },
  ]
);
```

**Empty state:** Show `EmptyState` when no suppliers exist.

**Loading:** Show `LoadingOverlay` during initial load.

**Optimistic UI is NOT used** — wait for service call before refreshing.

---

## Common Rules

- Wrap in `ScreenWrapper`
- Confirmations use `Alert.alert` with Cancel + Confirm (destructive)
- Validation errors shown inline via `AppInput.error`

---

## Acceptance Criteria

- [ ] Screen is blocked for users without `MANAGE_INVENTORY`
- [ ] Lists all suppliers with name and contact info
- [ ] FAB opens a form for creating a new supplier
- [ ] Tapping a row (or edit button) opens the form pre-filled for editing
- [ ] Submitting valid data calls `createSupplier` or `updateSupplier` and refreshes the list
- [ ] Delete shows a confirmation dialog before calling `deleteSupplier`
- [ ] `EmptyState` shown when there are no suppliers
- [ ] `LoadingOverlay` shown during initial load
- [ ] Screen is wrapped in `ScreenWrapper`
- [ ] No TypeScript errors
