# AMSPOS-73: `src/screens/modals/DiscountPickerModal.tsx`

**Sprint**: Sprint 11 — Transaction Core Screens & Modals
**Effort**: 1 day
**Dependencies**: AMSPOS-72 (BarcodeScanner — same callback pattern), AMSPOS-44 (line item types)
**Phase**: Transactions

---

## Description

Modal for selecting a discount to apply to a specific line item. Supports Fixed Amount (₱) or Percentage (%) discount. Uses the same module-level callback pattern as `BarcodeScannerModal`.

---

## Instructions

### 1. Callback pattern

```typescript
type DiscountType = 'FIXED' | 'PERCENTAGE';

type DiscountPayload = {
  type: DiscountType;
  value: number;
} | null; // null = remove discount

let _pendingOnApply: ((payload: DiscountPayload) => void) | null = null;

export const setDiscountCallback = (cb: (payload: DiscountPayload) => void) => {
  _pendingOnApply = cb;
};
```

Callers (e.g. `TransactionDetail` line item row) must:
1. Call `setDiscountCallback((payload) => { /* apply to line item */ })`
2. Navigate to `DiscountPicker` modal screen, passing `{ currentDiscountType, currentDiscountValue }` as route params

### 2. `src/screens/modals/DiscountPickerModal.tsx`

**Route params:**

```typescript
type Params = {
  currentDiscountType?: 'FIXED' | 'PERCENTAGE';
  currentDiscountValue?: number;
};
```

**State:**

```typescript
const [discountType, setDiscountType] = useState<'FIXED' | 'PERCENTAGE'>(
  params.currentDiscountType ?? 'FIXED'
);
const [value, setValue] = useState(
  params.currentDiscountValue ? String(params.currentDiscountValue) : ''
);
```

**Layout:**

1. Toggle row: "Fixed Amount" | "Percentage" — mutually exclusive (per FRD §4.3)
   - Tapping a toggle option sets `discountType` and clears `value`

2. Amount input:
   - Label: `"Discount Amount (₱)"` when `discountType === 'FIXED'`
   - Label: `"Discount %"` when `discountType === 'PERCENTAGE'`
   - `keyboardType="numeric"`

3. "Remove Discount" `AppButton` — only render if `params.currentDiscountType` is set:
   ```typescript
   const handleRemove = () => {
     _pendingOnApply?.(null);
     _pendingOnApply = null;
     navigation.goBack();
   };
   ```

4. "Apply" `AppButton`:
   ```typescript
   const handleApply = () => {
     const numericValue = parseFloat(value);
     if (!isValid(numericValue)) return;
     _pendingOnApply?.({ type: discountType, value: numericValue });
     _pendingOnApply = null;
     navigation.goBack();
   };
   ```

**Validation (inline error message):**

```typescript
const isValid = (num: number): boolean => {
  if (isNaN(num) || num <= 0) return false;
  if (discountType === 'PERCENTAGE' && num > 100) return false;
  return true;
};
```

- Fixed: must be > 0 (upper bound against line item subtotal is enforced in the transaction service, not here)
- Percentage: must be between 1 and 100

**Wrap in `ScreenWrapper`.**

---

## Acceptance Criteria

- [ ] Uses module-level `setDiscountCallback` / `_pendingOnApply` pattern
- [ ] Toggle switches between Fixed Amount and Percentage — mutually exclusive
- [ ] Label changes based on selected type
- [ ] Validation: fixed > 0; percentage 1–100; shows inline error on invalid submit
- [ ] "Remove Discount" button visible only when a discount is currently applied
- [ ] "Apply" fires callback with `{ type, value }` then closes
- [ ] "Remove Discount" fires callback with `null` then closes
- [ ] Wrapped in `ScreenWrapper`
- [ ] No TypeScript errors

## Definition of Done

- Acceptance criteria met
- Code committed to `main`
