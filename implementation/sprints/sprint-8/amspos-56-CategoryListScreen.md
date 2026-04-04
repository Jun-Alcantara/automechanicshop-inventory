# AMSPOS-56: `src/screens/inventory/CategoryListScreen.tsx`

**Sprint**: Sprint 8 — User Form & Inventory Screens
**Effort**: 1 day
**Dependencies**: AMSPOS-41 (inventoryStore / categoryService)
**Phase**: Inventory

---

## Description

CRUD screen for product categories. Gated by `MANAGE_INVENTORY`. Supports inline creation and delete with confirmation.

---

## Instructions

### 1. `src/screens/inventory/CategoryListScreen.tsx`

**Permission guard:**

```typescript
usePermissionGuard('MANAGE_INVENTORY');
```

**Features:**

- `FlatList` of all categories (name only for MVP)
- **FAB "Add Category"** → shows an inline text input at the top of the list
- **Create flow:** user types a category name in the inline input and confirms → call `createCategory({ name })`, hide the input on success
- **Delete flow:** swipe-to-delete or a delete button per row → show confirmation dialog → call `deleteCategory(categoryId)` on confirm

**Delete confirmation:**

```typescript
Alert.alert(
  'Delete Category',
  `Delete "${category.name}"? This cannot be undone.`,
  [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Delete', style: 'destructive', onPress: () => deleteCategory(category.id) },
  ]
);
```

**Empty state:** Show `EmptyState` when no categories exist.

**Loading:** Show `LoadingOverlay` during initial load.

**Optimistic UI is NOT used** — wait for the service call before refreshing the list.

---

## Common Rules

- Wrap in `ScreenWrapper`
- Confirmations use `Alert.alert` with Cancel + Confirm (destructive)

---

## Acceptance Criteria

- [ ] Screen is blocked for users without `MANAGE_INVENTORY`
- [ ] Lists all categories from the store
- [ ] FAB opens an inline text input for entering a new category name
- [ ] Submitting a valid name calls `createCategory` and refreshes the list
- [ ] Delete button/swipe shows a confirmation dialog before calling `deleteCategory`
- [ ] `EmptyState` shown when there are no categories
- [ ] `LoadingOverlay` shown during initial load
- [ ] Screen is wrapped in `ScreenWrapper`
- [ ] No TypeScript errors
