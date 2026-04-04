# AMSPOS-68: `src/screens/transactions/ReceiptScreen.tsx`

**Sprint**: Sprint 13 — Payment & Post-Transaction Flows
**Effort**: 1.5 days
**Dependencies**: AMSPOS-67 (PaymentScreen), AMSPOS-82 (usePrinter, generateReceiptPDF)
**Phase**: Transactions

---

## Description

Show a complete receipt preview after finalization (or after a Void/Return). Allow the cashier to print via Bluetooth, download as PDF, or skip.

---

## Instructions

### 1. Route param

```typescript
// TransactionStackParamList:
Receipt: { transactionId: string };
```

### 2. Data loading

Fetch the finalized transaction from WatermelonDB via `transactionService.getTransaction(transactionId)`. Include all related line items and payment records.

### 3. Layout

Wrap in `ScreenWrapper`. The screen is a scrollable receipt preview followed by action buttons fixed at the bottom.

#### Receipt preview content (in order):

```
[Shop name / receipt header]       ← settingsStore.settings.receiptHeader
[Date & time]                      ← transaction.finalized_at (formatted)
Transaction ID: XXXX
Cashier: [displayName of finalized_by user]
Customer: [customer_name + vehicle_plate] or [Walk-in: walk_in_name] or [Walk-in]

─────────────────────────────────
Item Name             Qty  Price  Total
...
─────────────────────────────────
Subtotal:             ₱XXXX
VAT (12%):            ₱XXXX
[additional VAT rows per type if applicable]
─────────────────────────────────
TOTAL:                ₱XXXX

Payment:
  Cash:               ₱XXXX
  GCash (ref: XXXX):  ₱XXXX
  ...
Change Due:           ₱XXXX
```

For Void/Return receipts, display a notice at the very top:
```
── VOID ── Original Txn #XXXXX
```
or
```
── RETURN ── Original Txn #XXXXX
```

### 4. Action buttons

Three buttons at the bottom:

**"Print Receipt"**
```typescript
const { printData } = usePrinter();
const handlePrint = async () => {
  try {
    await printData(escposCommands);
    navigation.replace('Dashboard');
  } catch {
    Alert.alert(
      'Printer Unavailable',
      'The printer could not be reached.',
      [
        { text: 'Retry', onPress: handlePrint },
        { text: 'Skip', onPress: () => navigation.replace('Dashboard') },
      ]
    );
  }
};
```

**"Download PDF"**
```typescript
import { generateReceiptPDF } from 'src/utils/generateReceiptPDF';
import * as Sharing from 'expo-sharing';

const handleDownloadPDF = async () => {
  const uri = await generateReceiptPDF(transactionData);
  await Sharing.shareAsync(uri);
  navigation.replace('Dashboard');
};
```

**"Skip"**
```typescript
navigation.replace('Dashboard');
```

### 5. Post-action navigation

After any successful action (Print, PDF, Skip), use `navigation.replace('Dashboard')` to prevent the user from navigating back to the receipt.

---

## Acceptance Criteria

- [ ] Receipt preview displays all required fields: shop header, date/time, transaction ID, cashier, customer, line items, subtotal, VAT breakdown, total, payment methods, change due
- [ ] Void/Return receipts show the appropriate notice at the top referencing the original transaction ID
- [ ] "Print Receipt" calls `usePrinter().printData`
- [ ] Print failure shows "Printer Unavailable" alert with Retry / Skip options
- [ ] "Download PDF" generates and shares the receipt PDF via `expo-sharing`
- [ ] "Skip" navigates to Dashboard without printing
- [ ] All three actions use `navigation.replace('Dashboard')` (no back navigation to receipt)
- [ ] No TypeScript errors
