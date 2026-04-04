# AMSPOS-50: `src/screens/dashboard/DashboardScreen.tsx`

**Sprint**: Sprint 7 — Dashboard, Reports & User Screens
**Effort**: 1.5 days
**Dependencies**: AMSPOS-41 (inventoryStore), AMSPOS-42 (transactionStore / transactionService)
**Phase**: Reports/Dashboard

---

## Description

The main Dashboard screen. Displays today's sales KPIs, the top 5 selling parts, and low stock alerts. Data refreshes whenever the screen comes into focus.

---

## Instructions

### 1. `src/screens/dashboard/DashboardScreen.tsx`

**Data sources:**

| Widget | Source | Notes |
|--------|--------|-------|
| Total Sales Today | One-time DB query via `transactionService` | Sum of `totalAmount` for `FINALIZED` transactions where `finalized_at >= start of today` |
| Order Count Today | Same query | Count of rows |
| Top 5 Selling Parts | Same query — aggregate `line_items` where `type = PRODUCT` | Rank by `quantity` sold |
| Low Stock Alerts | `useInventoryStore().products` | Filter: `stockAvailable <= lowStockThreshold` |

**Implementation notes:**

```typescript
// "Today" stats: use useEffect + useState (one-time query, not observable)
// Refresh on focus: wrap fetch in useFocusEffect(() => { fetchTodayStats(); })
// Low stock: derived from store — no async needed

const [todayStats, setTodayStats] = useState<TodayStats | null>(null);
const { products } = useInventoryStore();
const lowStockItems = products.filter(p => p.stockAvailable <= p.lowStockThreshold);

useFocusEffect(useCallback(() => {
  fetchTodayStats().then(setTodayStats);
}, []));
```

**Layout:**

```
┌──────────────────────────────────────┐
│  Total Sales Today  |  Orders Today  │  ← 2 KPI cards in a row
├──────────────────────────────────────┤
│  Top Selling Parts                   │  ← ranked list (up to 5 rows)
├──────────────────────────────────────┤
│  Low Stock Alerts                    │  ← StockBadge per item
└──────────────────────────────────────┘
```

- Wrap in `ScreenWrapper`
- Show `EmptyState` in each section when there is no data
- Use `SectionHeader` for section titles

---

## Acceptance Criteria

- [ ] Displays today's total sales amount and order count as KPI cards
- [ ] Displays top 5 selling parts (by quantity) for today
- [ ] Displays all products where `stockAvailable <= lowStockThreshold`
- [ ] Data refreshes when screen comes into focus (`useFocusEffect`)
- [ ] Empty sections show `EmptyState` component
- [ ] Screen is wrapped in `ScreenWrapper`
- [ ] No TypeScript errors
