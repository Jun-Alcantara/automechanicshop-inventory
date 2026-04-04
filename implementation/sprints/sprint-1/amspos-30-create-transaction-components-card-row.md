# AMSPOS-30: Create Transaction Components — TransactionCard, LineItemRow

**Sprint**: Sprint 1 — Auth Services & Utilities
**Effort**: 0.5 day
**Dependencies**: None (uses theme constants only)
**Phase**: Foundation

---

## Description

Build the two core transaction UI components: `TransactionCard` (used in `TransactionListScreen`) and `LineItemRow` (used in `TransactionDetailScreen`). Also create `PaymentMethodInput` and `RefundBreakdown` stubs. All live in `src/components/transaction/`.

---

## Instructions

### 1. `src/components/transaction/TransactionCard.tsx`

Displays a summary of a transaction in a list. Shows transaction ID, customer name, status badge, and total amount.

```typescript
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { AppBadge } from '@components/common/AppBadge';
import { Colors, Spacing, Typography, BorderRadius } from '@constants/theme';
import { formatPHP } from '@utils/formatCurrency';
import type { Transaction } from '@types/index';

interface TransactionCardProps {
  transaction: Transaction;
  customerName?: string;
  onPress: () => void;
}

const STATUS_VARIANT: Record<string, 'success' | 'warning' | 'danger' | 'neutral'> = {
  IN_PROGRESS: 'warning',
  FINALIZED: 'success',
  VOIDED: 'danger',
  CANCELLED: 'neutral',
  RETURNED: 'neutral',
};

export const TransactionCard: React.FC<TransactionCardProps> = ({
  transaction,
  customerName,
  onPress,
}) => (
  <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
    <View style={styles.header}>
      <Text style={styles.id} numberOfLines={1}>
        #{transaction.id.slice(-8).toUpperCase()}
      </Text>
      <AppBadge
        label={transaction.status.replace('_', ' ')}
        variant={STATUS_VARIANT[transaction.status] ?? 'neutral'}
      />
    </View>
    {customerName ? (
      <Text style={styles.customer} numberOfLines={1}>{customerName}</Text>
    ) : null}
    <Text style={styles.amount}>{formatPHP(transaction.totalAmount)}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  id: {
    fontSize: Typography.sm,
    color: Colors.gray500,
    fontWeight: Typography.medium,
  },
  customer: {
    fontSize: Typography.base,
    color: Colors.gray900,
    marginBottom: Spacing.xs,
  },
  amount: {
    fontSize: Typography.lg,
    fontWeight: Typography.bold,
    color: Colors.black,
  },
});
```

### 2. `src/components/transaction/LineItemRow.tsx`

Displays one line item in `TransactionDetailScreen`. Shows name, quantity, unit price, discount badge (if any), and total.

```typescript
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Spacing, Typography } from '@constants/theme';
import { formatPHP } from '@utils/formatCurrency';
import type { LineItem } from '@types/index';

interface LineItemRowProps {
  item: LineItem;
}

export const LineItemRow: React.FC<LineItemRowProps> = ({ item }) => (
  <View style={styles.row}>
    <View style={styles.left}>
      <Text style={styles.name} numberOfLines={2}>{item.name}</Text>
      <Text style={styles.meta}>
        {formatPHP(item.unitPrice)} × {item.quantity}
        {item.discountType ? `  −${item.discountType === 'PERCENTAGE' ? `${item.discountValue}%` : formatPHP(item.discountValue)}` : ''}
      </Text>
    </View>
    <Text style={styles.total}>{formatPHP(item.total)}</Text>
  </View>
);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: Spacing.sm,
  },
  left: { flex: 1, marginRight: Spacing.md },
  name: { fontSize: Typography.base, color: Colors.black, marginBottom: 2 },
  meta: { fontSize: Typography.sm, color: Colors.gray500 },
  total: { fontSize: Typography.base, fontWeight: Typography.semiBold, color: Colors.black },
});
```

### 3. Stub files

Create minimal stubs for `PaymentMethodInput` and `RefundBreakdown` (to be fully implemented in Sprint 13):

```typescript
// src/components/transaction/PaymentMethodInput.tsx
export const PaymentMethodInput = () => null;

// src/components/transaction/RefundBreakdown.tsx
export const RefundBreakdown = () => null;
```

### 4. `src/components/transaction/index.ts`

```typescript
export { TransactionCard } from './TransactionCard';
export { LineItemRow } from './LineItemRow';
export { PaymentMethodInput } from './PaymentMethodInput';
export { RefundBreakdown } from './RefundBreakdown';
```

---

## Acceptance Criteria

- [ ] `TransactionCard` renders ID, status badge with correct color variant, customer name, and formatted total
- [ ] `LineItemRow` renders item name, qty × price, discount info, and formatted total
- [ ] Status badge uses `warning` for IN_PROGRESS, `success` for FINALIZED, `danger` for VOIDED
- [ ] All styles use `StyleSheet.create`
- [ ] All monetary values use `formatPHP`
- [ ] No TypeScript errors

## Definition of Done

- All acceptance criteria are met
- Code committed to `main`
