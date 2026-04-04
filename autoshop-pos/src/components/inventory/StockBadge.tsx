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
