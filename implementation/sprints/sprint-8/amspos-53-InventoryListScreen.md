# AMSPOS-53: `src/screens/inventory/InventoryListScreen.tsx`

**Sprint**: Sprint 8 — User Form & Inventory Screens
**Effort**: 1.5 days
**Dependencies**: AMSPOS-41 (inventoryStore)
**Phase**: Inventory

---

## Description

Browse all products and service items. Two tabs: **Products** and **Services**. Viewing is unrestricted; create/edit actions require `MANAGE_INVENTORY`.

---

## Instructions

### 1. `src/screens/inventory/InventoryListScreen.tsx`

**No `usePermissionGuard`** — viewing inventory is open to all logged-in users.

Use `useHasPermission('MANAGE_INVENTORY')` to conditionally show the FAB and enable row navigation to forms.

---

#### Products Tab

```typescript
const { products } = useInventoryStore();
const [query, setQuery] = useState('');

const filtered = products.filter(p =>
  p.name.toLowerCase().includes(query.toLowerCase()) ||
  p.barcode?.includes(query)
);
```

- Search bar at the top (filters by name or barcode)
- `FlatList` of `ProductCard` components
- Tapping a row → navigate to `ProductForm` with `{ productId }` *(only if `canManage`)*
- FAB "New Product" → navigate to `ProductForm` with no `productId` *(only if `canManage`)*

#### Services Tab

- `FlatList` of service items from `useInventoryStore().serviceItems`
- Each row: service name + base price (`formatPHP`)
- Tapping a row → navigate to `ServiceForm` with `{ serviceId }` *(only if `canManage`)*
- FAB "New Service" → navigate to `ServiceForm` with no `serviceId` *(only if `canManage`)*

**Empty state:** Show `EmptyState` when the filtered list is empty.

**Loading:** Show `LoadingOverlay` while the store's `loading` flag is true.

---

## Common Rules

- Wrap in `ScreenWrapper`
- Monetary values use `formatPHP`

---

## Acceptance Criteria

- [ ] Products tab shows all products with search filtering by name and barcode
- [ ] Services tab shows all service items with name and base price
- [ ] FAB and row edit navigation are hidden for users without `MANAGE_INVENTORY`
- [ ] `ProductCard` rows navigate to `ProductForm` when tapped (if permitted)
- [ ] Service rows navigate to `ServiceForm` when tapped (if permitted)
- [ ] `EmptyState` is shown when the list is empty or no search results
- [ ] `LoadingOverlay` is shown during initial load
- [ ] Screen is wrapped in `ScreenWrapper`
- [ ] No TypeScript errors
