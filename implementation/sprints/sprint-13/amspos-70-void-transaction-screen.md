# AMSPOS-70: `src/screens/transactions/VoidTransactionScreen.tsx`

**Sprint**: Sprint 13 — Payment & Post-Transaction Flows
**Effort**: 1 day
**Dependencies**: AMSPOS-69 (TransactionHistoryDetailScreen), AMSPOS-82 (Sprint 4)
**Phase**: Transactions

---

## Description

Allow a user with the `VOID_TRANSACTIONS` permission to void a finalized transaction. Blocked if a return has already been processed. Captures a mandatory reason before submitting.

---

## Instructions

### 1. Route param & permission guard

```typescript
// TransactionStackParamList:
VoidTransaction: { transactionId: string };
```

```typescript
const isAuthorized = usePermissionGuard('VOID_TRANSACTIONS');
if (!isAuthorized) return null;
```

### 2. Data loading

Fetch the transaction via `transactionService.getTransaction(transactionId)`. Include line items and payment records.

### 3. hasReturn guard

After loading, check if the transaction has already had a return processed:

```typescript
if (transaction.hasReturn) {
  Alert.alert(
    'Cannot Void',
    'A return has already been processed for this transaction. It cannot be voided.',
    [{ text: 'OK', onPress: () => navigation.goBack() }]
  );
  return null;
}
```

### 4. Layout

Wrap in `ScreenWrapper`. Stack vertically:

1. **Transaction summary** — transaction ID, total amount, brief line item summary (item names, quantities).
2. **Payment refund breakdown** — display-only list showing what was paid per method:
   ```
   Return ₱500.00 cash
   Reverse ₱200.00 GCash (ref: XXXXXX)
   ```
   This is informational only — the app does **not** automate the actual reversal.
3. **Reason field** — multi-line `TextInput`, required (cannot be empty).
4. **"Void Transaction" button** — disabled until `reason.trim().length > 0`.

### 5. State

```typescript
const [reason, setReason] = useState('');
const [loading, setLoading] = useState(false);
```

### 6. Void handler

```typescript
const handleVoid = async () => {
  setLoading(true);
  try {
    await voidTransaction(transactionId, reason.trim(), actingUser);
    navigation.replace('TransactionHistoryDetail', { transactionId });
  } finally {
    setLoading(false);
  }
};
```

Use `<LoadingOverlay visible={loading} />` during the async call (see AMSPOS-89).

### 7. Stock reversion

`voidTransaction` in `transactionService.ts` must reverse all committed product stock atomically in a single `database.write()` block. This is part of the service layer, not the screen.

---

## Acceptance Criteria

- [ ] Screen is guarded by `usePermissionGuard('VOID_TRANSACTIONS')` — returns `null` if unauthorized
- [ ] If `transaction.hasReturn === true`, shows alert and navigates back
- [ ] Transaction summary (ID, total, line items) is displayed
- [ ] Per-method refund breakdown is displayed (display only)
- [ ] Reason field is required — "Void Transaction" button disabled when empty
- [ ] `voidTransaction(id, reason, actingUser)` is called on submit
- [ ] On success, navigates to `TransactionHistoryDetail`
- [ ] `LoadingOverlay` shown during `voidTransaction`
- [ ] No TypeScript errors
