# AMSPOS-59: `src/screens/admin/CustomerListScreen.tsx`

**Sprint**: Sprint 9 — Product/Service Forms, Customer List & Barcode Scanner
**Effort**: 1 day
**Dependencies**: AMSPOS-36 (customerService)
**Phase**: Customers

---

## Description

Browse named customers and walk-ins. Supports search. FAB for creating a new customer, gated by `CREATE_TRANSACTIONS`. No full permission guard — all logged-in users can view.

---

## Instructions

### 1. `src/screens/admin/CustomerListScreen.tsx`

**No `usePermissionGuard`** — viewing the customer list is accessible to all logged-in users.

Use `useHasPermission('CREATE_TRANSACTIONS')` to show/hide the FAB.

**Search:**

```typescript
const [query, setQuery] = useState('');

// On query change (debounce ~300ms):
const results = await searchCustomers(query); // partial match on name + phone
```

**List rows:**

| Customer type | Display |
|---------------|---------|
| Named customer | Full name + phone number |
| Walk-in customer | Nickname + "Walk-in" badge |

- Tapping a row → navigate to `CustomerDetail` with `{ customerId }`
- FAB "New Customer" (visible only if `canCreate`) → navigate to `CustomerForm` (no `customerId`)

**Empty state:** Show `EmptyState` when search returns no results.

**Loading:** Show `LoadingOverlay` on initial load; show an inline activity indicator during search.

---

## Common Rules

- Wrap in `ScreenWrapper`
- No optimistic UI

---

## Acceptance Criteria

- [ ] Lists named customers (name + phone) and walk-ins (nickname + badge)
- [ ] Search bar filters by name and phone via `searchCustomers`
- [ ] Tapping a row navigates to `CustomerDetail`
- [ ] FAB "New Customer" is visible only for users with `CREATE_TRANSACTIONS`
- [ ] FAB navigates to `CustomerForm` in create mode
- [ ] `EmptyState` shown when no results
- [ ] `LoadingOverlay` shown during initial load
- [ ] Screen is wrapped in `ScreenWrapper`
- [ ] No TypeScript errors
