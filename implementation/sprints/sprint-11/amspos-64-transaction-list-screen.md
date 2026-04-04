# AMSPOS-64: `src/screens/transactions/TransactionListScreen.tsx`

**Sprint**: Sprint 11 — Transaction Core Screens & Modals
**Effort**: 1 day
**Dependencies**: AMSPOS-41 (useOpenTransactionsStore), AMSPOS-44 (transactionService), AMSPOS-87 (ErrorBoundary done first)
**Phase**: Transactions

---

## Description

Shows all shop-wide IN_PROGRESS transactions from the open transactions store. Two sections: in-progress (live from store) and history (finalized/voided/returned). FAB to create a new transaction, guarded by `CREATE_TRANSACTIONS` permission.

---

## Instructions

### 1. `src/screens/transactions/TransactionListScreen.tsx`

**Store + data:**

```typescript
import { useOpenTransactionsStore } from 'src/store/useOpenTransactionsStore';

const transactions = useOpenTransactionsStore((s) => s.transactions);
```

Subscribe/unsubscribe on focus:

```typescript
import { useFocusEffect } from '@react-navigation/native';

useFocusEffect(
  React.useCallback(() => {
    useOpenTransactionsStore.getState().subscribe();
    return () => useOpenTransactionsStore.getState().unsubscribe();
  }, [])
);
```

**Layout (two sections):**

1. **"In Progress"** section — FlatList from `transactions`
   - Each row: transaction ID, customer name, vehicle plate, running total
   - Tap row → `navigation.navigate('TransactionDetail', { transactionId })`

2. **"History"** section — a "View History" button that navigates to a filtered history screen, OR shows recent FINALIZED/VOIDED/RETURNED transactions inline with a "See All" link
   - Use `transactionService.listTransactions({ statuses: ['FINALIZED', 'VOIDED', 'RETURNED'] })` for history data — call on mount/focus, store in local state

**FAB:**

```typescript
import { useHasPermission } from 'src/hooks/useHasPermission';
import { Permission } from 'src/constants/permissions';

const canCreate = useHasPermission(Permission.CREATE_TRANSACTIONS);

// Only render FAB if canCreate:
{canCreate && (
  <FAB onPress={() => navigation.navigate('NewTransaction')} label="New Transaction" />
)}
```

**Wrap in `ScreenWrapper`:**

```typescript
import { ScreenWrapper } from 'src/components/layout/ScreenWrapper';

return (
  <ScreenWrapper>
    {/* sections */}
  </ScreenWrapper>
);
```

---

## Acceptance Criteria

- [ ] Shows IN_PROGRESS transactions from `useOpenTransactionsStore`
- [ ] Subscribes on focus, unsubscribes on blur
- [ ] Each row displays transaction ID, customer name, vehicle plate, running total
- [ ] Tapping a row navigates to `TransactionDetail` with `transactionId`
- [ ] History section loads FINALIZED/VOIDED/RETURNED transactions
- [ ] FAB "New Transaction" only visible to users with `CREATE_TRANSACTIONS` permission
- [ ] Wrapped in `ScreenWrapper`
- [ ] No TypeScript errors

## Definition of Done

- Acceptance criteria met
- Code committed to `main`
