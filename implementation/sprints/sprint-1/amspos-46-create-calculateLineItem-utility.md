# AMSPOS-46: Create calculateLineItem Utility

**Sprint**: Sprint 1 — Auth Services & Utilities
**Effort**: 0.5 day
**Dependencies**: AMSPOS-8
**Phase**: Foundation

---

## Description

Create `src/utils/calculateLineItem.ts` — a pure function that computes the computed fields for a single line item: `subtotal`, `vatAmount`, `discountAmount`, and `total`. This is called by `transactionService` when creating/updating line items, and by `calculateTransaction` when summing the transaction total.

---

## Instructions

### 1. `src/utils/calculateLineItem.ts`

```typescript
import { VAT_RATE, VAT_TYPES, type VatType } from '../constants/vatTypes';

export interface LineItemInput {
  unitPrice: number;
  quantity: number;
  vatType: VatType;
  discountType: 'FIXED' | 'PERCENTAGE' | '';
  discountValue: number;
  addOnsTotal: number; // sum of all add-on amounts for this line item
}

export interface LineItemCalcResult {
  subtotal: number;
  vatAmount: number;
  discountAmount: number;
  total: number;
}

/**
 * Computes all derived monetary fields for a single line item.
 * All amounts are in PHP, rounded to 2 decimal places.
 */
export const calculateLineItem = (input: LineItemInput): LineItemCalcResult => {
  const { unitPrice, quantity, vatType, discountType, discountValue, addOnsTotal } = input;

  const subtotal = round(unitPrice * quantity);

  // Discount
  let discountAmount = 0;
  if (discountType === 'FIXED') {
    discountAmount = Math.min(discountValue, subtotal); // can't discount more than the item cost
  } else if (discountType === 'PERCENTAGE') {
    discountAmount = round((subtotal * discountValue) / 100);
  }

  const discountedSubtotal = round(subtotal - discountAmount);

  // VAT
  let vatAmount = 0;
  if (vatType === VAT_TYPES.VAT_EXCLUSIVE) {
    // Price does NOT include VAT — add 12% on top
    vatAmount = round(discountedSubtotal * VAT_RATE);
  } else if (vatType === VAT_TYPES.VAT_INCLUSIVE) {
    // Price ALREADY includes VAT — extract the VAT component
    // VAT = price × (rate / (1 + rate))
    vatAmount = round(discountedSubtotal * (VAT_RATE / (1 + VAT_RATE)));
  }
  // VAT_TYPES.NO_VAT → vatAmount stays 0

  const total = round(discountedSubtotal + vatAmount + addOnsTotal);

  return { subtotal, vatAmount, discountAmount, total };
};

const round = (value: number): number =>
  Math.round(value * 100) / 100;
```

### 2. Write unit tests

Create `src/utils/__tests__/calculateLineItem.test.ts`:

```typescript
import { calculateLineItem } from '../calculateLineItem';

describe('calculateLineItem', () => {
  it('NO_VAT: total = unit_price × qty', () => {
    const result = calculateLineItem({
      unitPrice: 100, quantity: 2, vatType: 'NO_VAT',
      discountType: '', discountValue: 0, addOnsTotal: 0,
    });
    expect(result.subtotal).toBe(200);
    expect(result.vatAmount).toBe(0);
    expect(result.discountAmount).toBe(0);
    expect(result.total).toBe(200);
  });

  it('VAT_EXCLUSIVE: adds 12% on top', () => {
    const result = calculateLineItem({
      unitPrice: 100, quantity: 1, vatType: 'VAT_EXCLUSIVE',
      discountType: '', discountValue: 0, addOnsTotal: 0,
    });
    expect(result.vatAmount).toBe(12);
    expect(result.total).toBe(112);
  });

  it('VAT_INCLUSIVE: extracts VAT from price', () => {
    const result = calculateLineItem({
      unitPrice: 112, quantity: 1, vatType: 'VAT_INCLUSIVE',
      discountType: '', discountValue: 0, addOnsTotal: 0,
    });
    // VAT = 112 × (0.12 / 1.12) ≈ 12
    expect(result.vatAmount).toBeCloseTo(12, 1);
    expect(result.total).toBeCloseTo(112, 1);
  });

  it('FIXED discount reduces subtotal', () => {
    const result = calculateLineItem({
      unitPrice: 100, quantity: 2, vatType: 'NO_VAT',
      discountType: 'FIXED', discountValue: 50, addOnsTotal: 0,
    });
    expect(result.discountAmount).toBe(50);
    expect(result.total).toBe(150);
  });

  it('PERCENTAGE discount reduces subtotal by percentage', () => {
    const result = calculateLineItem({
      unitPrice: 200, quantity: 1, vatType: 'NO_VAT',
      discountType: 'PERCENTAGE', discountValue: 10, addOnsTotal: 0,
    });
    expect(result.discountAmount).toBe(20);
    expect(result.total).toBe(180);
  });

  it('addOnsTotal adds to total', () => {
    const result = calculateLineItem({
      unitPrice: 100, quantity: 1, vatType: 'NO_VAT',
      discountType: '', discountValue: 0, addOnsTotal: 25,
    });
    expect(result.total).toBe(125);
  });
});
```

---

## Acceptance Criteria

- [ ] `calculateLineItem` returns `subtotal`, `vatAmount`, `discountAmount`, `total`
- [ ] `NO_VAT`: vatAmount is 0
- [ ] `VAT_EXCLUSIVE`: vatAmount = subtotal × 12%
- [ ] `VAT_INCLUSIVE`: vatAmount is extracted from already-inclusive price
- [ ] `FIXED` discount: capped at subtotal (cannot go negative)
- [ ] `PERCENTAGE` discount: correctly applied before VAT
- [ ] All returned values are rounded to 2 decimal places
- [ ] Unit tests pass

## Definition of Done

- All acceptance criteria are met
- Unit tests pass (`npm test`)
- Code committed to `main`
