# AMSPOS-48: Create formatCurrency Utility

**Sprint**: Sprint 1 — Auth Services & Utilities
**Effort**: 0.5 day
**Dependencies**: None
**Phase**: Foundation

---

## Description

Create `src/utils/formatCurrency.ts` — a pure function that formats a number as Philippine Peso currency. Used on every screen that displays monetary values.

---

## Instructions

### 1. `src/utils/formatCurrency.ts`

```typescript
/**
 * Formats a number as Philippine Peso.
 * Examples:
 *   formatPHP(1234.5)  → "₱1,234.50"
 *   formatPHP(0)       → "₱0.00"
 *   formatPHP(-50)     → "-₱50.00"
 */
export const formatPHP = (amount: number): string => {
  const isNegative = amount < 0;
  const abs = Math.abs(amount);

  const formatted = abs.toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return isNegative ? `-₱${formatted}` : `₱${formatted}`;
};

/**
 * Parses a formatted PHP string back to a number.
 * Returns NaN if the string cannot be parsed.
 * Example: parsePHP("₱1,234.50") → 1234.5
 */
export const parsePHP = (value: string): number => {
  const cleaned = value.replace(/[₱,\s]/g, '');
  return parseFloat(cleaned);
};
```

### 2. Unit tests

Create `src/utils/__tests__/formatCurrency.test.ts`:

```typescript
import { formatPHP, parsePHP } from '../formatCurrency';

describe('formatPHP', () => {
  it('formats whole number', () => {
    expect(formatPHP(1000)).toBe('₱1,000.00');
  });

  it('formats decimal', () => {
    expect(formatPHP(1234.5)).toBe('₱1,234.50');
  });

  it('formats zero', () => {
    expect(formatPHP(0)).toBe('₱0.00');
  });

  it('formats negative', () => {
    expect(formatPHP(-50)).toBe('-₱50.00');
  });
});

describe('parsePHP', () => {
  it('parses formatted string back to number', () => {
    expect(parsePHP('₱1,234.50')).toBe(1234.5);
  });

  it('returns NaN for invalid string', () => {
    expect(parsePHP('abc')).toBeNaN();
  });
});
```

---

## Acceptance Criteria

- [ ] `formatPHP(1234.5)` returns `"₱1,234.50"` with thousands separator
- [ ] `formatPHP(0)` returns `"₱0.00"`
- [ ] `formatPHP(-50)` returns `"-₱50.00"`
- [ ] `parsePHP` reverses `formatPHP`
- [ ] Unit tests pass

## Definition of Done

- All acceptance criteria are met
- Unit tests pass
- Code committed to `main`
