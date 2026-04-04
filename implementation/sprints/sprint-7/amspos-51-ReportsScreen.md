# AMSPOS-51: `src/screens/admin/ReportsScreen.tsx`

**Sprint**: Sprint 7 — Dashboard, Reports & User Screens
**Effort**: 1.5 days
**Dependencies**: AMSPOS-41 (inventoryStore), AMSPOS-42 (transactionService)
**Phase**: Reports/Dashboard

---

## Description

Admin screen for viewing Sales and Inventory reports. Gated by `VIEW_REPORTS` permission. Contains two tabs: Sales (with date range filter) and Inventory (current stock snapshot).

---

## Instructions

### 1. `src/screens/admin/ReportsScreen.tsx`

**Permission guard:**

```typescript
usePermissionGuard('VIEW_REPORTS'); // redirect/block if missing
```

**Two-tab layout:**

```
[ Sales ]  [ Inventory ]
```

---

#### Sales Tab

- Two date inputs: **Start Date** and **End Date** (default: start of today → now)
- On date change: fetch `FINALIZED` transactions in range from `transactionService`
- Display a list of transactions, each showing:
  - Transaction date/time
  - Subtotal, VAT amount, Total
- Show a summary row at the bottom: **Total Subtotal | Total VAT | Grand Total**
- Show `EmptyState` if no transactions in range

#### Inventory Tab

- Read `useInventoryStore().products` (already loaded — no async needed)
- Display all products in a list: name, current stock, unit
- Highlight low stock rows (e.g., red text or `StockBadge`)
- Show `EmptyState` if product list is empty

**No export functionality** — out of scope for MVP.

---

## Acceptance Criteria

- [ ] Screen is blocked for users without `VIEW_REPORTS` permission
- [ ] Sales tab shows transactions filtered by selected date range
- [ ] Sales tab shows subtotal, VAT, and total per transaction plus a grand total row
- [ ] Inventory tab shows all products with stock levels, low stock highlighted
- [ ] Both tabs show `EmptyState` when there is no data
- [ ] Screen is wrapped in `ScreenWrapper`
- [ ] No TypeScript errors
