# AMSPOS-83: Receipt Printing — Thermal 80mm

**Sprint**: Sprint 14 — Settings, Hardware Integration & Unit Tests
**Effort**: 2 days
**Dependencies**: AMSPOS-68 (ReceiptScreen), AMSPOS-82 (usePrinter hook)
**Phase**: Hardware Integration

---

## Description

Implement `src/utils/receiptPrinter.ts` — builds and sends ESC/POS commands for an 80mm Bluetooth thermal printer. Called from `ReceiptScreen` when the user taps "Print Receipt".

---

## Instructions

### 1. File

`src/utils/receiptPrinter.ts`

### 2. Function signature

```typescript
import BluetoothEscposPrinter from 'react-native-bluetooth-escpos-printer';
import { usePrinter } from 'src/hooks/usePrinter';
import { Transaction, Customer, Vehicle } from 'src/types';

export const printTransactionReceipt = async (
  transaction: Transaction,
  customer: Customer | null,
  vehicle: Vehicle | null,
  cashierName: string,
  receiptHeader: string,
  printer: ReturnType<typeof usePrinter>
): Promise<boolean> => {
  // build and send ESC/POS commands
  // returns true on success, throws on failure
};
```

### 3. ESC/POS command structure

Build commands in this order:

| # | Content | Alignment |
|---|---|---|
| 1 | `receiptHeader` (shop name) | CENTER |
| 2 | Date/time (`transaction.finalized_at`) | LEFT |
| 3 | `Transaction ID: XXXX` | LEFT |
| 4 | `Cashier: [cashierName]` | LEFT |
| 5 | Customer name + vehicle plate (or Walk-in label) | LEFT |
| 6 | Divider line (`─`.repeat(48)) | LEFT |
| 7 | Column header: `Item` / `Qty` / `Price` / `Total` | columns |
| 8 | Each line item (name wrapped at 32 chars, qty × price, VAT type, total) | columns |
| 9 | Add-ons indented 2 spaces below their parent item | LEFT |
| 10 | Divider | LEFT |
| 11 | `Subtotal: ₱XXXX` | RIGHT |
| 12 | VAT breakdown rows (one per VAT type present) | RIGHT |
| 13 | `TOTAL: ₱XXXX` (bold) | RIGHT |
| 14 | Blank line | |
| 15 | Payment method rows: `Cash: ₱XXXX`, `GCash (ref: XXXX): ₱XXXX` | LEFT |
| 16 | `Change Due: ₱XXXX` | LEFT |
| 17 | Blank line | |
| 18 | `Thank you!` | CENTER |
| 19 | Feed 4 lines + cut | |

### 4. Void / Return header

If `transaction.type === 'VOIDED'`, prepend before shop header:
```
*** VOID ***
Original Txn #XXXXX
```

If `transaction.type === 'RETURNED'`, prepend:
```
*** RETURN ***
Original Txn #XXXXX
```

### 5. Key ESC/POS API calls

```typescript
// Alignment
await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);
await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.LEFT);

// Plain text
await BluetoothEscposPrinter.printText('Some text\n', {});

// Columns (use for line items row)
await BluetoothEscposPrinter.printColumn(
  [24, 8, 8, 8],                          // column widths (chars) — must sum to 48
  [
    BluetoothEscposPrinter.ALIGN.LEFT,
    BluetoothEscposPrinter.ALIGN.RIGHT,
    BluetoothEscposPrinter.ALIGN.RIGHT,
    BluetoothEscposPrinter.ALIGN.RIGHT,
  ],
  ['Item name here', '2', '₱50', '₱100'],
  {}
);

// Feed and cut
await BluetoothEscposPrinter.printText('\n\n\n\n', {});
await BluetoothEscposPrinter.cutOnePoint();
```

### 6. Sending via usePrinter

Pass the printer instance from the calling screen and call `printer.printData(commands)`. The `usePrinter` hook handles Bluetooth connection state and error propagation — let errors bubble up to the caller (`ReceiptScreen`) which shows the Retry/Skip dialog.

### 7. Text helpers

- Wrap item names to 32 characters using a simple `wordWrap(text, 32)` helper within the file.
- Use `formatPHP(amount)` from `src/utils/formatCurrency.ts` for all monetary values.

---

## Acceptance Criteria

- [ ] `printTransactionReceipt` builds ESC/POS commands in the documented order
- [ ] Shop header is centered; all other content is left-aligned unless specified
- [ ] Line items use `printColumn` with correct column widths summing to 48
- [ ] Add-ons are indented below their parent item
- [ ] VAT breakdown has one row per VAT type present in the transaction
- [ ] Void/Return receipts prepend the appropriate `*** VOID ***` / `*** RETURN ***` notice
- [ ] Receipt ends with feed 4 lines and cut
- [ ] Errors are not swallowed — they propagate to `ReceiptScreen`
- [ ] No TypeScript errors
