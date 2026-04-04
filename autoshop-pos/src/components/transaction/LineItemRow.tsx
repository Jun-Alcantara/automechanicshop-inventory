import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Spacing, Typography } from '@constants/theme';
import { formatPHP } from '@utils/formatCurrency';
import type { LineItem } from '../../types';

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
