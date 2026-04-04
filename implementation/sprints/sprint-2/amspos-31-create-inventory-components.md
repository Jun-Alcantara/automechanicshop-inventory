# AMSPOS-31: Create Inventory Components — ProductCard, StockBadge

**Sprint**: Sprint 2 — Auth Screens & Components
**Effort**: 0.5 day
**Dependencies**: None
**Phase**: Foundation

---

## Description

Build `ProductCard` and `StockBadge` — inventory-specific UI components used in `InventoryListScreen` and `ProductFormScreen`. These live in `src/components/inventory/`.

---

## Instructions

### 1. `src/components/inventory/StockBadge.tsx`

Displays available stock with visual alert for low stock.

```typescript
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Spacing, Typography, BorderRadius } from '@constants/theme';

interface StockBadgeProps {
  stockAvailable: number;
  lowStockThreshold: number;
}

export const StockBadge: React.FC<StockBadgeProps> = ({ stockAvailable, lowStockThreshold }) => {
  const isLow = stockAvailable <= lowStockThreshold && stockAvailable > 0;
  const isOut = stockAvailable <= 0;

  const bg = isOut ? Colors.dangerLight : isLow ? Colors.warningLight : Colors.successLight;
  const textColor = isOut ? Colors.danger : isLow ? Colors.warning : Colors.success;
  const label = isOut ? `Out (${stockAvailable})` : `${stockAvailable} in stock`;

  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text style={[styles.label, { color: textColor }]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingVertical: 2,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.full,
    alignSelf: 'flex-start',
  },
  label: { fontSize: Typography.xs, fontWeight: '600' },
});
```

### 2. `src/components/inventory/ProductCard.tsx`

```typescript
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { StockBadge } from './StockBadge';
import { Colors, Spacing, Typography, BorderRadius } from '@constants/theme';
import { formatPHP } from '@utils/formatCurrency';
import type { Product } from '@types/index';

interface ProductCardProps {
  product: Product;
  onPress: () => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onPress }) => (
  <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
    <View style={styles.row}>
      <Text style={styles.name} numberOfLines={2}>{product.name}</Text>
      <Text style={styles.price}>{formatPHP(product.sellingPrice)}</Text>
    </View>
    <View style={styles.footer}>
      <StockBadge
        stockAvailable={product.stockAvailable}
        lowStockThreshold={product.lowStockThreshold}
      />
      {product.barcode ? (
        <Text style={styles.barcode} numberOfLines={1}>{product.barcode}</Text>
      ) : null}
    </View>
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
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.xs },
  name: { flex: 1, fontSize: Typography.base, color: Colors.black, marginRight: Spacing.sm },
  price: { fontSize: Typography.base, fontWeight: '600', color: Colors.primary },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  barcode: { fontSize: Typography.xs, color: Colors.gray500, maxWidth: 120 },
});
```

### 3. `src/components/inventory/index.ts`

```typescript
export { ProductCard } from './ProductCard';
export { StockBadge } from './StockBadge';
```

---

## Acceptance Criteria

- [ ] `StockBadge` shows green for normal stock, yellow for low stock, red for out-of-stock (≤ 0)
- [ ] `ProductCard` shows product name, selling price, stock badge, and barcode (if set)
- [ ] Both use `StyleSheet.create` only
- [ ] No TypeScript errors

## Definition of Done

- All acceptance criteria are met
- Code committed to `main`
