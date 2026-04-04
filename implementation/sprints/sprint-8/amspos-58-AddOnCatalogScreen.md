# AMSPOS-58: `src/screens/inventory/AddOnCatalogScreen.tsx`

**Sprint**: Sprint 8 — User Form & Inventory Screens
**Effort**: 1.5 days
**Dependencies**: AMSPOS-41 (inventoryStore / addOnService)
**Phase**: Inventory

---

## Description

Manage the predefined add-on catalog. Gated by `MANAGE_INVENTORY`. Supports create, edit, deactivate, and filtering by active status.

---

## Instructions

### 1. `src/screens/inventory/AddOnCatalogScreen.tsx`

**Permission guard:**

```typescript
usePermissionGuard('MANAGE_INVENTORY');
```

**State:**

```typescript
const [showActiveOnly, setShowActiveOnly] = useState(true);
```

**Features:**

#### List

- `FlatList` of add-on items from the store
- Each row shows: **name**, **amount** (`formatPHP`), **active/inactive badge**
- Filter toggle at top: "Active Only" / "Show All" — filters the displayed list in-memory

#### Create

- FAB or "Add" button → opens an inline form or modal with:
  - Name (required, text)
  - Amount (required, numeric)
- On submit: call `createAddOn({ name, amount })`, refresh list

#### Edit

- Tapping a row → opens the same form pre-filled with the add-on's current name and amount
- On submit: call `updateAddOn(addOnId, { name, amount })`

#### Deactivate

- Each active row has a deactivate button (or swipe action)
- Shows confirmation dialog:

```typescript
Alert.alert(
  'Deactivate Add-on',
  `Deactivate "${addOn.name}"? It will no longer appear during transactions.`,
  [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Deactivate', style: 'destructive', onPress: () => deactivateAddOn(addOn.id) },
  ]
);
```

- Inactive items show an "Activate" button instead → call `activateAddOn(addOn.id)` (no confirmation needed)

**Empty state:** Show `EmptyState` when no add-ons match the current filter.

**Loading:** Show `LoadingOverlay` during initial load.

**Optimistic UI is NOT used** — wait for service call before refreshing.

---

## Common Rules

- Wrap in `ScreenWrapper`
- Monetary values use `formatPHP`
- Confirmations use `Alert.alert` with Cancel + Confirm (destructive)
- Validation errors shown inline via `AppInput.error`

---

## Acceptance Criteria

- [ ] Screen is blocked for users without `MANAGE_INVENTORY`
- [ ] Lists add-ons with name, formatted amount, and active/inactive badge
- [ ] "Active Only" toggle filters the list to show only active add-ons
- [ ] FAB opens a form for creating a new add-on (name + amount)
- [ ] Tapping a row opens the form pre-filled for editing name/amount
- [ ] Deactivate button shows a confirmation dialog before calling `deactivateAddOn`
- [ ] Inactive rows show an "Activate" button that calls `activateAddOn` directly
- [ ] `EmptyState` shown when no add-ons match the current filter
- [ ] `LoadingOverlay` shown during initial load
- [ ] Screen is wrapped in `ScreenWrapper`
- [ ] No TypeScript errors
