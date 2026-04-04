# AMSPOS-67: `src/screens/transactions/PaymentScreen.tsx`

**Sprint**: Sprint 13 — Payment & Post-Transaction Flows
**Effort**: 1.5 days
**Dependencies**: AMSPOS-44 (transactionDraftStore), AMSPOS-66 (TransactionDetailScreen), AMSPOS-82 (Sprint 4)
**Phase**: Transactions

---

## Description

Record payment for a finalized transaction. Supports multiple payment methods (Cash, GCash, Maya), split payments, e-wallet reference number capture, and computes change on the cash portion only.

---

## Instructions

### 1. Route param

```typescript
// TransactionStackParamList:
Payment: { transactionId: string };
```

### 2. State

```typescript
const [payments, setPayments] = useState<PaymentEntry[]>([]);
const [method, setMethod] = useState<'Cash' | 'GCash' | 'Maya'>('Cash');
const [amount, setAmount] = useState('');
const [referenceNumber, setReferenceNumber] = useState('');
const [photoUri, setPhotoUri] = useState<string | null>(null);
const [loading, setLoading] = useState(false);
```

Where `PaymentEntry`:
```typescript
type PaymentEntry = {
  method: 'Cash' | 'GCash' | 'Maya';
  amount: number;
  referenceNumber?: string;
  photoUri?: string | null;
};
```

### 3. Fetch transaction total

Load the transaction total from `transactionDraftStore` (already open) or re-fetch from WatermelonDB via `transactionService.getTransaction(transactionId)`.

### 4. Layout

Wrap in `ScreenWrapper`. Stack vertically:

1. **Transaction total display** — large text showing total amount due.
2. **Payment method selector** — radio/toggle: `Cash | GCash | Maya`.
3. **Amount field** — numeric text input.
4. **For GCash/Maya only**:
   - `Reference Number` text field (required before "Add Payment" is enabled).
   - `Attach Photo` button — `expo-image-picker` to capture or select; stores local URI.
5. **"Add Payment" button** — validates inputs, then appends to `payments` list.
6. **Payment summary list** — each row: method label, amount, remove (×) button.
7. **Remaining Balance** — `totalAmount - sum(payments)`, updated in real-time.
8. **Cash Change** — computed only on the cash portion using `calculateChangeDue`.
9. **"Finalize" button** — disabled until `totalPayments >= totalAmount`.

### 5. E-wallet amount cap

```typescript
const remainingBalance = totalAmount - payments.reduce((s, p) => s + p.amount, 0);
// When method is GCash or Maya, cap the entered amount at remainingBalance:
if ((method === 'GCash' || method === 'Maya') && parsedAmount > remainingBalance) {
  // show validation error or clamp
}
```

### 6. Cash change calculation

```typescript
import { calculateChangeDue } from 'src/utils/calculateChangeDue';

const cashPaid = payments.filter(p => p.method === 'Cash').reduce((s, p) => s + p.amount, 0);
const cashChange = calculateChangeDue(cashPaid, totalAmount - nonCashPaid);
```

### 7. Finalize handler

```typescript
const handleFinalize = async () => {
  setLoading(true);
  try {
    await finalizeTransaction(transactionId, payments, actingUser);
    navigation.replace('Receipt', { transactionId });
  } finally {
    setLoading(false);
  }
};
```

Use `<LoadingOverlay visible={loading} />` during the async call (see AMSPOS-89).

### 8. Session lock guard

Per FRD §4.5, payment entries are non-persistent across session locks. If the session locks mid-payment, navigate back to `TransactionDetail`.

```typescript
const sessionStatus = useSessionStore(s => s.status);

useEffect(() => {
  if (sessionStatus === 'LOCKED') {
    navigation.goBack();
  }
}, [sessionStatus]);
```

---

## Acceptance Criteria

- [ ] Multiple payment methods can be added one at a time
- [ ] GCash/Maya require a reference number before "Add Payment" is enabled
- [ ] E-wallet amounts are capped at remaining unpaid balance
- [ ] Cash change is computed on cash portion only using `calculateChangeDue`
- [ ] "Finalize" button disabled until `totalPayments >= totalAmount`
- [ ] `finalizeTransaction` called on finalize; navigates to `ReceiptScreen` on success
- [ ] Session lock navigates back to `TransactionDetail`
- [ ] `LoadingOverlay` shown during `finalizeTransaction`
- [ ] No TypeScript errors
