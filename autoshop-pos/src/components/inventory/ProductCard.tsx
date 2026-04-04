import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { StockBadge } from './StockBadge';
import { Colors, Spacing, Typography, BorderRadius } from '@constants/theme';
import { formatPHP } from '@utils/formatCurrency';
import type { Product } from '@/types';

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
