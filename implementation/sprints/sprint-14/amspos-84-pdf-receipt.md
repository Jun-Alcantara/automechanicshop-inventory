# AMSPOS-84: PDF Receipt Generation

**Sprint**: Sprint 14 — Settings, Hardware Integration & Unit Tests
**Effort**: 1.5 days
**Dependencies**: AMSPOS-68 (ReceiptScreen), expo-print, expo-sharing
**Phase**: Hardware Integration

---

## Description

Implement `src/utils/receiptPdf.ts` — generates an HTML receipt, converts it to a PDF using `expo-print`, and opens the device share sheet via `expo-sharing`. Called from `ReceiptScreen` when the user taps "Download PDF".

---

## Instructions

### 1. File

`src/utils/receiptPdf.ts`

### 2. Main export

```typescript
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Transaction, Customer, Vehicle } from 'src/types';

export const generateAndShareReceiptPDF = async (
  transaction: Transaction,
  customer: Customer | null,
  vehicle: Vehicle | null,
  cashierName: string,
  receiptHeader: string
): Promise<void> => {
  const html = buildReceiptHTML(transaction, customer, vehicle, cashierName, receiptHeader);

  // 80mm thermal paper ≈ 302px wide at 96dpi
  const { uri } = await Print.printToFileAsync({ html, width: 302 });

  const canShare = await Sharing.isAvailableAsync();
  if (canShare) {
    await Sharing.shareAsync(uri, {
      mimeType: 'application/pdf',
      dialogTitle: 'Save or Share Receipt',
    });
  }
};
```

### 3. HTML builder

```typescript
const buildReceiptHTML = (
  transaction: Transaction,
  customer: Customer | null,
  vehicle: Vehicle | null,
  cashierName: string,
  receiptHeader: string
): string => {
  // Returns a complete HTML string
};
```

#### HTML structure requirements

Use inline CSS. Font: monospace. Max width: 302px.

**Header block:**
- Shop name (`receiptHeader`) — centered, bold, slightly larger font
- Date/time (`transaction.finalized_at`) — centered, smaller font

For Void/Return: display a notice above the shop name:
```html
<p style="text-align:center; font-weight:bold;">*** VOID ***</p>
<p style="text-align:center;">Original Txn #XXXXX</p>
```

**Info block (left-aligned):**
```
Transaction ID: XXXX
Cashier: [cashierName]
Customer: [customer_name + vehicle_plate] or [Walk-in: walk_in_name] or [Walk-in]
```

**Line items table:**

Use an HTML `<table>` with four columns: Item | Qty | Unit Price | Total.

```html
<table style="width:100%; border-collapse:collapse; font-size:11px;">
  <thead>
    <tr>
      <th style="text-align:left;">Item</th>
      <th style="text-align:right;">Qty</th>
      <th style="text-align:right;">Price</th>
      <th style="text-align:right;">Total</th>
    </tr>
  </thead>
  <tbody>
    <!-- one <tr> per line item -->
    <!-- add-on rows indented with padding-left -->
  </tbody>
</table>
```

**Totals block (right-aligned):**
```
Subtotal:    ₱XXXX
VAT (12%):   ₱XXXX
...
TOTAL:       ₱XXXX
```

**Payments block:**
```
Cash:              ₱XXXX
GCash (ref: XXXX): ₱XXXX
Change Due:        ₱XXXX
```

**Footer:**
```
Thank you!  (centered)
```

#### Dividers

Use `<hr style="border-top: 1px dashed #000;" />` between sections.

### 4. Currency formatting

Use `formatPHP(amount)` from `src/utils/formatCurrency.ts` for all monetary values.

### 5. Customer display logic

Match the same logic used in `ReceiptScreen`:
- If `customer`: show `customer.name` + `vehicle.plate`
- Else if `transaction.walk_in_name`: show `Walk-in: [walk_in_name]`
- Else: show `Walk-in`

---

## Acceptance Criteria

- [ ] `generateAndShareReceiptPDF` generates a PDF and opens the share sheet
- [ ] PDF width is set to 302px (80mm equivalent)
- [ ] HTML receipt includes: shop header, date/time, transaction ID, cashier, customer, line items table, add-ons, subtotal, VAT breakdown, total, payment methods, change due, footer
- [ ] Void/Return receipts include the appropriate notice above the shop header
- [ ] `Sharing.isAvailableAsync()` is checked before calling `shareAsync`
- [ ] `formatPHP` used for all monetary values
- [ ] No TypeScript errors
