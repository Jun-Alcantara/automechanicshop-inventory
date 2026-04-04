# AMSPOS-90: Unit Tests — Utilities & Calculations

**Sprint**: Sprint 14 — Settings, Hardware Integration & Unit Tests
**Effort**: 1 day
**Dependencies**: AMSPOS-46 (calculateLineItem), AMSPOS-47 (calculateTransaction), AMSPOS-48 (formatCurrency), AMSPOS-9 (pinHash), AMSPOS-49 (permissions)
**Phase**: Polish / Quality

---

## Description

Write comprehensive unit tests for all pure utility functions. These functions have no side effects and are fully testable without mocking stores or the database.

---

## Instructions

### 1. Jest configuration

Ensure `package.json` has the following Jest config (add if missing):

```json
{
  "jest": {
    "preset": "jest-expo",
    "transformIgnorePatterns": [
      "node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg)"
    ]
  }
}
```

---

### 2. `src/utils/__tests__/calculateLineItem.test.ts`

Extend from AMSPOS-46. Cover:

```typescript
// Base case
it('computes subtotal, vat, and total for NO_VAT item')
it('computes VAT_EXCLUSIVE: vat added on top of subtotal')
it('computes VAT_INCLUSIVE: vat extracted from subtotal')

// Discounts
it('applies FIXED discount')
it('applies PERCENTAGE discount')
it('caps discount at subtotal — discount cannot exceed item price × qty')
it('discount does not go negative when value exceeds subtotal')

// Add-ons
it('adds add-on amounts to total')
it('handles multiple add-ons')

// Combined
it('combined: VAT_EXCLUSIVE + PERCENTAGE discount + add-ons')
it('combined: VAT_INCLUSIVE + FIXED discount + add-ons')
```

---

### 3. `src/utils/__tests__/calculateTransaction.test.ts`

Extend from AMSPOS-47. Cover:

```typescript
it('sums subtotals of all line items')
it('aggregates VAT amounts by type')
it('handles multiple items with mixed VAT types (NO_VAT + VAT_EXCLUSIVE + VAT_INCLUSIVE)')
it('computes totalAmount = sum of all line item totals')
it('returns zero VAT when all items are NO_VAT')
```

---

### 4. `src/utils/__tests__/calculateChangeDue.test.ts`

New file. Cover:

```typescript
it('returns correct change when cash paid exceeds balance')
it('returns 0 when cash paid equals balance exactly')
it('returns 0 when cash paid is less than balance (no negative change)')
it('handles split payment: change computed on cash portion after e-wallet deductions')
// Note: e-wallet amounts are capped externally before reaching this function
```

---

### 5. `src/utils/__tests__/formatCurrency.test.ts`

From AMSPOS-48. Cover:

```typescript
it('formats a standard amount: 1234.5 → "₱1,234.50"')
it('formats zero: 0 → "₱0.00"')
it('formats very large number: 1000000 → "₱1,000,000.00"')
it('formats very small amount: 0.01 → "₱0.01"')
it('rounds to 2 decimal places: 1.005 → "₱1.01" (or "₱1.00" — document the behaviour)')
it('does not produce negative zero: -0 → "₱0.00"')
```

---

### 6. `src/utils/__tests__/pinHash.test.ts`

From AMSPOS-9. Cover:

```typescript
it('hashPin returns a non-empty string')
it('hashPin is deterministic: same PIN always produces same hash')
it('hashPin: different PINs produce different hashes')
it('verifyPin returns true for correct PIN')
it('verifyPin returns false for wrong PIN')
it('verifyPin returns false for empty string')
// Note: do not assert on timing — just assert consistent boolean result
```

---

### 7. `src/utils/__tests__/permissions.test.ts`

From AMSPOS-49. Cover:

```typescript
it('hasPermission returns true for mainAdmin regardless of permissions array')
it('hasPermission returns true when permission is in user.permissions')
it('hasPermission returns false when permission is not in user.permissions')
it('hasPermission returns false for null/undefined user')
// Test each permission string from the permissions constant file
```

---

## Running tests

```bash
npx jest --watchAll=false
```

All tests must pass with `0 failures`.

---

## Acceptance Criteria

- [ ] Jest config present in `package.json` with correct `transformIgnorePatterns`
- [ ] `calculateLineItem` tests: base cases, discounts (including cap), add-ons, combined cases
- [ ] `calculateTransaction` tests: multiple items, mixed VAT types
- [ ] `calculateChangeDue` tests: standard change, exact payment, underpayment, split payment
- [ ] `formatCurrency` tests: standard, zero, large numbers, small numbers, rounding
- [ ] `pinHash` tests: deterministic hash, correct/wrong PIN verification
- [ ] `permissions` tests: mainAdmin override, permission present/absent, null user
- [ ] `npm test` (or `npx jest`) runs with 0 failures and 0 errors
