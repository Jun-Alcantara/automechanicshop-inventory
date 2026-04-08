import React, { useState, useCallback } from 'react';
import { ScrollView, View, Text, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { ScreenWrapper } from '@components/layout/ScreenWrapper';
import { SectionHeader } from '@components/layout/SectionHeader';
import { EmptyState } from '@components/common/EmptyState';
import { StockBadge } from '@components/inventory/StockBadge';
import { useInventoryStore } from '@stores/inventoryStore';
import { fetchTodayStats } from '@services/transactionService';
import type { TodayStats } from '@services/transactionService';
import { Colors, Spacing, Typography, BorderRadius } from '@constants/theme';

const formatCurrency = (amount: number): string =>
  `₱${amount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const DashboardScreen: React.FC = () => {
  const [todayStats, setTodayStats] = useState<TodayStats | null>(null);
  const { products } = useInventoryStore();
  const lowStockItems = products.filter(p => p.stockAvailable <= p.lowStockThreshold);

  useFocusEffect(
    useCallback(() => {
      fetchTodayStats().then(setTodayStats);
    }, [])
  );

  return (
    <ScreenWrapper noHeader>
      <ScrollView contentContainerStyle={styles.container}>
        {/* KPI Cards */}
        <View style={styles.kpiRow}>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Total Sales Today</Text>
            <Text style={styles.kpiValue} testID="kpi-total-sales">
              {todayStats ? formatCurrency(todayStats.totalSales) : '—'}
            </Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Orders Today</Text>
            <Text style={styles.kpiValue} testID="kpi-order-count">
              {todayStats !== null ? String(todayStats.orderCount) : '—'}
            </Text>
          </View>
        </View>

        {/* Top Selling Parts */}
        <SectionHeader title="Top Selling Parts" />
        {!todayStats || todayStats.topSellingParts.length === 0 ? (
          <EmptyState title="No sales today" />
        ) : (
          todayStats.topSellingParts.map((part, index) => (
            <View key={part.refId} style={styles.row} testID={`top-part-${part.refId}`}>
              <Text style={styles.rank}>#{index + 1}</Text>
              <Text style={styles.itemName}>{part.name}</Text>
              <Text style={styles.itemDetail}>{part.quantity} sold</Text>
            </View>
          ))
        )}

        {/* Low Stock Alerts */}
        <SectionHeader title="Low Stock Alerts" style={styles.sectionTop} />
        {lowStockItems.length === 0 ? (
          <EmptyState title="No low stock items" />
        ) : (
          lowStockItems.map(product => (
            <View key={product.id} style={styles.row} testID={`low-stock-${product.id}`}>
              <Text style={styles.itemName}>{product.name}</Text>
              <StockBadge
                stockAvailable={product.stockAvailable}
                lowStockThreshold={product.lowStockThreshold}
              />
            </View>
          ))
        )}
      </ScrollView>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingBottom: Spacing.xl,
  },
  kpiRow: {
    flexDirection: 'row',
    padding: Spacing.md,
    gap: Spacing.md,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  kpiLabel: {
    fontSize: Typography.xs,
    color: Colors.gray500,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Spacing.xs,
  },
  kpiValue: {
    fontSize: Typography.xl,
    fontWeight: Typography.bold,
    color: Colors.black,
  },
  sectionTop: {
    marginTop: Spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  rank: {
    fontSize: Typography.sm,
    fontWeight: '700',
    color: Colors.primary,
    width: 32,
  },
  itemName: {
    flex: 1,
    fontSize: Typography.sm,
    color: Colors.gray900,
  },
  itemDetail: {
    fontSize: Typography.sm,
    color: Colors.gray500,
  },
});
