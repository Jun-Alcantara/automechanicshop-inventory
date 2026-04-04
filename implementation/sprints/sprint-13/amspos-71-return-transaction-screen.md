# AMSPOS-71: `src/screens/transactions/ReturnTransactionScreen.tsx`

**Sprint**: Sprint 13 — Payment & Post-Transaction Flows
**Effort**: 1 day
**Dependencies**: AMSPOS-69 (TransactionHistoryDetailScreen), AMSPOS-82 (Sprint 4)
**Phase**: Transactions

---

## Description

Allow a user with the `VOID_TRANSACTIONS` permission to process a full-transaction return against a FINALIZED transaction. Blocked if the transaction is already VOIDED or RETURNED. Creates a new RETURNED transaction record referencing the original.

---

## Instructions

### 1. Route param & permission guard

```typescript
// TransactionStackParamList:
ReturnTransaction: { transactionId: string };
```

```typescript
const isAuthorized = usePermissionGuard('VOID_TRANSACTIONS');
if (!isAuthorized) return null;
```

### 2. Data loading

Fetch the original transaction via `transactionService.getTransaction(transactionId)`. Include line items and payment records.

### 3. Status guard

Block the return if the transaction status is not `FINALIZED`:

```typescript
if (transaction.status !== 'FINALIZED') {
  Alert.alert(
    'Cannot Process Return',
    'Returns can only be processed for finalized transactions.',
    [{ text: 'OK', onPress: () => navigation.goBack() }]
  );
  return null;
}
```

### 4. Layout

Wrap in `ScreenWrapper`. Stack vertically:

1. **Original transaction summary** — transaction ID, finalized date, total amount, line item list.
2. **Per-method refund breakdown** — display-only, same as VoidTransactionScreen:
   ```
   Return ₱500.00 cash
   Reverse ₱200.00 GCash (ref: XXXXXX)
   ```
   Informational only — no in-app reversal automation.
3. **Reason field** — multi-line `TextInput`, required.
4. **"Process Return" button** — disabled until `reason.trim().length > 0`.

### 5. State

```typescript
const [reason, setReason] = useState('');
const [loading, setLoading] = useState(false);
```

### 6. Return handler

```typescript
const handleReturn = async () => {
  setLoading(true);
  try {
    await processReturn(transactionId, reason.trim(), actingUser);
    navigation.replace('TransactionHistoryDetail', { transactionId });
  } finally {
    setLoading(false);
  }
};
```

Use `<LoadingOverlay visible={loading} />` during the async call (see AMSPOS-89).

### 7. What `processReturn` must do (service layer)

In `transactionService.ts`, `processReturn` must in a single `database.write()`:

1. Create a new transaction record with:
   - `type: 'RETURNED'`
   - `original_transaction_id: transactionId`
   - `reason: reason`
   - `status: 'RETURNED'`
2. Set `has_return = true` on the original transaction (blocks future void).
3. Reverse all committed product stock from the original transaction back to inventory.
4. Append an audit log entry.

> Returns are full-transaction only. Partial line-item returns are out of scope (FRD §4 Returns).

---

## Acceptance Criteria

- [ ] Screen is guarded by `usePermissionGuard('VOID_TRANSACTIONS')` — returns `null` if unauthorized
- [ ] Blocked if transaction status is not `FINALIZED` (shows alert, navigates back)
- [ ] Original transaction summary (ID, date, total, items) is displayed
- [ ] Per-method refund breakdown is displayed (display only)
- [ ] Reason field is required — "Process Return" button disabled when empty
- [ ] `processReturn(id, reason, actingUser)` is called on submit
- [ ] On success, navigates to `TransactionHistoryDetail`
- [ ] `processReturn` creates a RETURNED transaction referencing `original_transaction_id`
- [ ] `processReturn` sets `has_return = true` on original transaction
- [ ] Product stock from original transaction is reversed
- [ ] `LoadingOverlay` shown during `processReturn`
- [ ] No TypeScript errors
