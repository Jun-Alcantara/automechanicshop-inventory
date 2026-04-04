# AMSPOS-69: `src/screens/transactions/TransactionHistoryDetailScreen.tsx`

**Sprint**: Sprint 12 — TransactionDetailScreen (Complex)
**Effort**: 1 day
**Dependencies**: AMSPOS-38 (transactionService), AMSPOS-47 (calculateTransactionTotals), AMSPOS-30 (LineItemRow)
**Phase**: Transactions

---

## Description

A read-only view of a completed or voided transaction. Displays the full transaction record including line items, totals, and payment breakdown. Provides Void and Return action buttons for users with the appropriate permission.

---

## Instructions

### 1. Route param

```typescript
// TransactionStackParamList:
TransactionHistoryDetail: { transactionId: string };
```

### 2. Data fetching

Fetch once on mount — this screen does not need to be reactive:

```typescript
const { transactionId } = route.params;
const [transaction, setTransaction] = useState<TransactionWithDetails | null>(null);
const [loading, setLoading] = useState(true);

useEffect(() => {
  transactionService
    .getById(transactionId) // includes line_items and payments
    .then(setTransaction)
    .finally(() => setLoading(false));
}, [transactionId]);
```

### 3. Layout sections

All sections are read-only. Wrap in `ScreenWrapper` with a `ScrollView`.

**Section 1 — Transaction header:**
- Transaction ID (e.g. `#TXN-00042`)
- Status badge (use the `Badge` component, colour from transaction status)
- Date and time (formatted)
- Cashier name
- Customer name (or "Walk-in" if no customer)
- Vehicle plate (if applicable)

**Section 2 — Line items list:**

Use `LineItemRow` in read-only mode (no edit/remove controls). Render as a plain `map` inside `ScrollView` (not a `FlatList`, since the outer container is already scrollable).

**Section 3 — Totals:**

```typescript
const totals = calculateTransactionTotals(transaction.lineItems);
// Display: Subtotal, VAT, Total
```

**Section 4 — Payments:**

List each payment record:
- Payment method label (e.g. "Cash", "GCash")
- Amount (formatted with `formatCurrency`)
- Reference number (if present, e.g. for GCash/card payments)

### 4. Action buttons (permission-gated)

Both buttons require `VOID_TRANSACTIONS` permission. Use `useHasPermission`.

```typescript
const canVoid = useHasPermission('VOID_TRANSACTIONS');
```

- **"Void Transaction"** — navigate to `VoidTransaction` screen, passing `{ transactionId }`
  - Disabled (with tooltip) if `transaction.has_return === true`
- **"Process Return"** — navigate to `ReturnTransaction` screen, passing `{ transactionId }`

Only render action buttons when `canVoid === true`.

```typescript
{canVoid && (
  <>
    <AppButton
      label="Void Transaction"
      onPress={() => navigation.navigate('VoidTransaction', { transactionId })}
      disabled={transaction.has_return}
    />
    <AppButton
      label="Process Return"
      onPress={() => navigation.navigate('ReturnTransaction', { transactionId })}
    />
  </>
)}
```

Add a note beneath the Void button when disabled:
```typescript
{transaction.has_return && (
  <Text style={styles.disabledNote}>
    Cannot void: a return has already been processed for this transaction.
  </Text>
)}
```

### 5. Loading state

Show a `LoadingSpinner` (or `ActivityIndicator`) while `loading === true`.

---

## Acceptance Criteria

- [ ] Fetches transaction by ID on mount (one-time, not reactive)
- [ ] Shows loading indicator while fetching
- [ ] Displays transaction header: ID, status badge, date/time, cashier, customer, vehicle
- [ ] Displays line items in read-only mode (no edit/remove controls)
- [ ] Displays totals: subtotal, VAT, total via `calculateTransactionTotals`
- [ ] Displays payment records with method, amount, and reference number
- [ ] "Void Transaction" and "Process Return" buttons only visible with `VOID_TRANSACTIONS` permission
- [ ] "Void Transaction" button is disabled when `has_return === true`
- [ ] Disabled state shows explanatory note
- [ ] Wrapped in `ScreenWrapper` + `ScrollView`
- [ ] No TypeScript errors

## Definition of Done

- Acceptance criteria met
- Code committed to `main`
