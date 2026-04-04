# AMSPOS-6: Setup App Constants and Theme

**Sprint**: Sprint 0 — Foundation Infrastructure
**Effort**: 0.5 day
**Dependencies**: AMSPOS-1
**Phase**: Foundation

---

## Description

Create all constant files under `src/constants/`: permissions, transaction statuses, VAT types, and the theme (colors, spacing, typography). These are referenced across the entire codebase.

---

## Instructions

### 1. `src/constants/permissions.ts`

```typescript
export const PERMISSIONS = {
  MANAGE_USERS: 'MANAGE_USERS',
  MANAGE_INVENTORY: 'MANAGE_INVENTORY',
  CREATE_TRANSACTIONS: 'CREATE_TRANSACTIONS',
  APPLY_DISCOUNTS: 'APPLY_DISCOUNTS',
  VOID_TRANSACTIONS: 'VOID_TRANSACTIONS',
  CANCEL_TRANSACTIONS: 'CANCEL_TRANSACTIONS',
  VIEW_REPORTS: 'VIEW_REPORTS',
  MANAGE_SETTINGS: 'MANAGE_SETTINGS',
} as const;

export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS];
```

### 2. `src/constants/transactionStatus.ts`

```typescript
export const TRANSACTION_STATUS = {
  IN_PROGRESS: 'IN_PROGRESS',
  FINALIZED: 'FINALIZED',
  VOIDED: 'VOIDED',
  CANCELLED: 'CANCELLED',
  RETURNED: 'RETURNED',
} as const;

export type TransactionStatus = typeof TRANSACTION_STATUS[keyof typeof TRANSACTION_STATUS];
```

### 3. `src/constants/vatTypes.ts`

```typescript
export const VAT_TYPES = {
  NO_VAT: 'NO_VAT',
  VAT_EXCLUSIVE: 'VAT_EXCLUSIVE',
  VAT_INCLUSIVE: 'VAT_INCLUSIVE',
} as const;

export type VatType = typeof VAT_TYPES[keyof typeof VAT_TYPES];

export const VAT_LABELS: Record<VatType, string> = {
  NO_VAT: 'No VAT',
  VAT_EXCLUSIVE: 'VAT Exclusive (+ 12%)',
  VAT_INCLUSIVE: 'VAT Inclusive (incl. 12%)',
};

export const VAT_RATE = 0.12;
export const DEFAULT_VAT_TYPE: VatType = VAT_TYPES.VAT_INCLUSIVE;
```

### 4. `src/constants/theme.ts`

```typescript
export const Colors = {
  // Primary brand
  primary: '#1A56DB',
  primaryDark: '#1345B8',
  primaryLight: '#E8EFFD',

  // Status colors
  success: '#0E9F6E',
  successLight: '#DEF7EC',
  warning: '#C27803',
  warningLight: '#FDF6B2',
  danger: '#E02424',
  dangerLight: '#FDE8E8',

  // Neutrals
  black: '#111928',
  gray900: '#1F2A37',
  gray700: '#374151',
  gray500: '#6B7280',
  gray300: '#D1D5DB',
  gray100: '#F3F4F6',
  white: '#FFFFFF',

  // Background
  background: '#F9FAFB',
  surface: '#FFFFFF',
  border: '#E5E7EB',
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const Typography = {
  // Font sizes
  xs: 11,
  sm: 13,
  base: 15,
  lg: 17,
  xl: 20,
  xxl: 24,
  xxxl: 30,

  // Font weights (React Native uses string literals)
  regular: '400' as const,
  medium: '500' as const,
  semiBold: '600' as const,
  bold: '700' as const,
} as const;

export const BorderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
} as const;
```

### 5. `src/constants/index.ts`

Re-export all constants:

```typescript
export * from './permissions';
export * from './transactionStatus';
export * from './vatTypes';
export * from './theme';
```

---

## Acceptance Criteria

- [ ] `permissions.ts` exports `PERMISSIONS` const object and `Permission` type
- [ ] `transactionStatus.ts` exports `TRANSACTION_STATUS` const object and `TransactionStatus` type
- [ ] `vatTypes.ts` exports `VAT_TYPES`, `VatType`, `VAT_LABELS`, `VAT_RATE`, and `DEFAULT_VAT_TYPE`
- [ ] `theme.ts` exports `Colors`, `Spacing`, `Typography`, and `BorderRadius`
- [ ] `src/constants/index.ts` re-exports all constants
- [ ] No `enum` keyword used — only `const` objects with `typeof` unions
- [ ] No TypeScript errors

## Definition of Done

- All acceptance criteria are met
- Constants are importable via `@constants` path alias
- Code committed to `main`
