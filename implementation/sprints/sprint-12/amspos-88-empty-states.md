# AMSPOS-88: Empty States

**Sprint**: Sprint 12 — TransactionDetailScreen (Complex)
**Effort**: 0.5 day
**Dependencies**: AMSPOS-29 (EmptyState component), AMSPOS-53, AMSPOS-64, AMSPOS-66
**Phase**: Transactions

---

## Description

Add proper empty states to three screens using the `EmptyState` component from Sprint 0. Each screen should show a relevant message when its list is empty.

---

## Instructions

Use the existing `EmptyState` component from `src/components/common/EmptyState.tsx`. Pass it as `ListEmptyComponent` on FlatLists, or render it conditionally when data is empty.

### 1. `TransactionListScreen`

When there are no in-progress transactions:

```typescript
<EmptyState
  title="No Transactions"
  subtitle="No in-progress transactions. Tap + to start one."
/>
```

### 2. `TransactionDetailScreen`

When the draft has no line items added yet:

```typescript
<EmptyState
  title="No Items Added"
  subtitle="No items added yet. Search for products or services above."
/>
```

Place this as the `ListEmptyComponent` of the line items `FlatList`.

### 3. `InventoryListScreen`

When there are no products matching the current search/filter:

```typescript
<EmptyState
  title="No Products Found"
  subtitle="No products found. Tap + to add your first product."
/>
```

---

## Acceptance Criteria

- [ ] `TransactionListScreen` shows `EmptyState` when transaction list is empty
- [ ] `TransactionDetailScreen` shows `EmptyState` when line items list is empty
- [ ] `InventoryListScreen` shows `EmptyState` when product list is empty
- [ ] `EmptyState` is used (not a custom inline implementation)
- [ ] Empty states are not shown while data is loading
- [ ] No TypeScript errors

## Definition of Done

- Acceptance criteria met
- Code committed to `main`
