# AMSPOS-47: Create calculateTransaction Utility

**Sprint**: Sprint 1 — Auth Services & Utilities
**Effort**: 0.5 day
**Dependencies**: AMSPOS-8
**Phase**: Foundation

---

## Description

Create `src/utils/calculateTransaction.ts` — a pure function that sums all line items to produce the transaction-level totals: `subtotal`, `totalVat`, `totalAmount`, and `changeDue`. Used by `transactionService` when finalizing and by the `TransactionDetailScreen` for the running total display.

---

## Instructions

### 1. `src/utils/calculateTransaction.ts`

```typescript
import type { LineItem, PaymentInput } from '../types';

export interface TransactionTotals {
  subtotal: number;    // sum of all line item subtotals (before VAT, after discount)
  totalVat: number;   // sum of all line item vatAmounts
  totalAmount: number; // total due (sum of all line item totals)
  changeDue: number;  // cash change (totalCash - max(0, totalAmount - totalNonCash))
}

/**
 * Sums all line items into transaction-level totals.
 */
export const calculateTransactionTotals = (lineItems: LineItem[]): Omit<TransactionTotals, 'changeDue'> => {
  let subtotal = 0;
  let totalVat = 0;
  let totalAmount = 0;

  for (const item of lineItems) {
    subtotal += item.subtotal;
    totalVat += item.vatAmount;
    totalAmount += item.total;
  }

  return {
    subtotal: round(subtotal),
    totalVat: round(totalVat),
    totalAmount: round(totalAmount),
  };
};

/**
 * Computes cash change due given the payment entries and the total amount.
 *
 * Rules (from functional_requirements.md §4.5):
 * - E-wallet amounts are capped at remaining unpaid balance
 * - Change is computed on the CASH portion only
 * - change = cashAmount - max(0, totalAmount - nonCashTotal)
 */
export const calculateChangeDue = (
  totalAmount: number,
  payments: PaymentInput[]
): number => {
  const cashTotal = payments
    .filter((p) => p.method === 'CASH')
    .reduce((sum, p) => sum + p.amount, 0);

  const nonCashTotal = payments
    .filter((p) => p.method !== 'CASH')
    .reduce((sum, p) => sum + p.amount, 0);

  const remainingAfterNonCash = Math.max(0, totalAmount - nonCashTotal);
  const change = cashTotal - remainingAfterNonCash;

  return round(Math.max(0, change));
};

const round = (value: number): number =>
  Math.round(value * 100) / 100;
```

### 2. Write unit tests

Create `src/utils/__tests__/calculateTransaction.test.ts`:

```typescript
import { calculateTransactionTotals, calculateChangeDue } from '../calculateTransaction';
import type { LineItem } from '../../types';

const makeLineItem = (subtotal: number, vatAmount: number, total: number): LineItem =>
  ({
    subtotal,
    vatAmount,
    total,
    // other fields irrelevant for this test
  } as LineItem);

describe('calculateTransactionTotals', () => {
  it('sums empty line items to zeros', () => {
    const result = calculateTransactionTotals([]);
    expect(result.subtotal).toBe(0);
    expect(result.totalVat).toBe(0);
    expect(result.totalAmount).toBe(0);
  });

  it('sums multiple line items', () => {
    const items = [
      makeLineItem(100, 12, 112),
      makeLineItem(200, 0, 200),
    ];
    const result = calculateTransactionTotals(items);
    expect(result.subtotal).toBe(300);
    expect(result.totalVat).toBe(12);
    expect(result.totalAmount).toBe(312);
  });
});

describe('calculateChangeDue', () => {
  it('cash only payment — change = cash - total', () => {
    const change = calculateChangeDue(500, [{ method: 'CASH', amount: 600 }]);
    expect(change).toBe(100);
  });

  it('split payment — change computed on cash after non-cash covers part', () => {
    // total 500, GCash 200, cash 400 → remaining after GCash = 300 → change = 400 - 300 = 100
    const change = calculateChangeDue(500, [
      { method: 'GCASH', amount: 200 },
      { method: 'CASH', amount: 400 },
    ]);
    expect(change).toBe(100);
  });

  it('no change when exact amount paid', () => {
    const change = calculateChangeDue(500, [{ method: 'CASH', amount: 500 }]);
    expect(change).toBe(0);
  });

  it('change is never negative', () => {
    const change = calculateChangeDue(500, [{ method: 'CASH', amount: 300 }]);
    expect(change).toBe(0);
  });
});
```

---

## Acceptance Criteria

- [ ] `calculateTransactionTotals([])` returns all zeros
- [ ] `calculateTransactionTotals(items)` correctly sums subtotal, totalVat, totalAmount
- [ ] `calculateChangeDue` computes change on the cash portion only
- [ ] Change is never negative
- [ ] All values rounded to 2 decimal places
- [ ] Unit tests pass

## Definition of Done

- All acceptance criteria are met
- Unit tests pass (`npm test`)
- Code committed to `main`
