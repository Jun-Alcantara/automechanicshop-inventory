import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';

import { ScreenWrapper } from '@components/layout/ScreenWrapper';
import { EmptyState } from '@components/common/EmptyState';
import { StockBadge } from '@components/inventory/StockBadge';
import { AppInput } from '@components/common/AppInput';

import { usePermissionGuard } from '@hooks/usePermissionGuard';
import { useInventoryStore } from '@stores/inventoryStore';
import { fetchTransactionsByDateRange } from '@services/transactionService';

import { Colors, Spacing, Typography, BorderRadius } from '@constants/theme';
import type { Transaction, Product } from '@/types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const todayStart = (): Date => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

const toDateString = (d: Date): string => d.toISOString().slice(0, 10);

const parseDate = (str: string): Date | null => {
  const match = str.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  const d = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  if (isNaN(d.getTime())) return null;
  return d;
};

const formatDateTime = (ts: number): string => {
  const d = new Date(ts);
  return d.toLocaleString();
};

const formatCurrency = (amount: number): string =>
  `₱${amount.toFixed(2)}`;

// ─── Sub-components ───────────────────────────────────────────────────────────

type Tab = 'sales' | 'inventory';

interface TabBarProps {
  active: Tab;
  onSelect: (tab: Tab) => void;
}

const TabBar: React.FC<TabBarProps> = ({ active, onSelect }) => (
  <View style={styles.tabBar}>
    <TouchableOpacity
      style={[styles.tab, active === 'sales' && styles.tabActive]}
      onPress={() => onSelect('sales')}
      activeOpacity={0.7}
    >
      <Text style={[styles.tabLabel, active === 'sales' && styles.tabLabelActive]}>
        Sales
      </Text>
    </TouchableOpacity>
    <TouchableOpacity
      style={[styles.tab, active === 'inventory' && styles.tabActive]}
      onPress={() => onSelect('inventory')}
      activeOpacity={0.7}
    >
      <Text style={[styles.tabLabel, active === 'inventory' && styles.tabLabelActive]}>
        Inventory
      </Text>
    </TouchableOpacity>
  </View>
);

// ─── Sales Tab ────────────────────────────────────────────────────────────────

const SalesTab: React.FC = () => {
  const [startStr, setStartStr] = useState(toDateString(todayStart()));
  const [endStr, setEndStr] = useState(toDateString(new Date()));
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const handleApply = useCallback(async () => {
    const start = parseDate(startStr);
    const end = parseDate(endStr);

    if (!start) {
      setError('Invalid start date. Use YYYY-MM-DD.');
      return;
    }
    if (!end) {
      setError('Invalid end date. Use YYYY-MM-DD.');
      return;
    }

    // end of the selected end day
    const endOfDay = new Date(end);
    endOfDay.setHours(23, 59, 59, 999);

    setError(undefined);
    setLoading(true);
    try {
      const results = await fetchTransactionsByDateRange(
        start.getTime(),
        endOfDay.getTime()
      );
      setTransactions(results);
    } catch {
      setError('Failed to load transactions.');
    } finally {
      setLoading(false);
      setFetched(true);
    }
  }, [startStr, endStr]);

  const totalSubtotal = transactions.reduce((s, t) => s + t.subtotal, 0);
  const totalVat = transactions.reduce((s, t) => s + t.totalVat, 0);
  const grandTotal = transactions.reduce((s, t) => s + t.totalAmount, 0);

  const renderTransaction = ({ item }: { item: Transaction }) => (
    <View style={styles.card}>
      <Text style={styles.cardDate}>{formatDateTime(item.finalizedAt)}</Text>
      <View style={styles.cardRow}>
        <Text style={styles.cardLabel}>Subtotal</Text>
        <Text style={styles.cardValue}>{formatCurrency(item.subtotal)}</Text>
      </View>
      <View style={styles.cardRow}>
        <Text style={styles.cardLabel}>VAT</Text>
        <Text style={styles.cardValue}>{formatCurrency(item.totalVat)}</Text>
      </View>
      <View style={styles.cardRow}>
        <Text style={[styles.cardLabel, styles.bold]}>Total</Text>
        <Text style={[styles.cardValue, styles.bold]}>{formatCurrency(item.totalAmount)}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.tabContent}>
      <View style={styles.filterRow}>
        <AppInput
          label="Start Date"
          value={startStr}
          onChangeText={setStartStr}
          placeholder="YYYY-MM-DD"
          containerStyle={styles.dateInput}
          error={undefined}
        />
        <AppInput
          label="End Date"
          value={endStr}
          onChangeText={setEndStr}
          placeholder="YYYY-MM-DD"
          containerStyle={styles.dateInput}
          error={undefined}
        />
        <TouchableOpacity style={styles.applyButton} onPress={handleApply} activeOpacity={0.8}>
          <Text style={styles.applyButtonLabel}>Apply</Text>
        </TouchableOpacity>
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          data={transactions}
          keyExtractor={(item) => item.id}
          renderItem={renderTransaction}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            fetched ? (
              <EmptyState
                title="No Transactions"
                subtitle="No finalized transactions found for the selected date range."
              />
            ) : null
          }
          ListFooterComponent={
            transactions.length > 0 ? (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Total Subtotal</Text>
                <Text style={styles.summaryValue}>{formatCurrency(totalSubtotal)}</Text>
                <Text style={styles.summaryLabel}>Total VAT</Text>
                <Text style={styles.summaryValue}>{formatCurrency(totalVat)}</Text>
                <Text style={[styles.summaryLabel, styles.bold]}>Grand Total</Text>
                <Text style={[styles.summaryValue, styles.bold]}>{formatCurrency(grandTotal)}</Text>
              </View>
            ) : null
          }
        />
      )}
    </View>
  );
};

// ─── Inventory Tab ────────────────────────────────────────────────────────────

const InventoryTab: React.FC = () => {
  const products = useInventoryStore((s) => s.products);

  const renderProduct = ({ item }: { item: Product }) => {
    const isLow = item.stockAvailable <= item.lowStockThreshold;
    return (
      <View style={styles.card}>
        <View style={styles.inventoryRow}>
          <Text style={[styles.productName, isLow && styles.lowStockText]}>{item.name}</Text>
          <View style={styles.inventoryRight}>
            <Text style={styles.unitText}>{item.unitOfMeasure}</Text>
            <StockBadge
              stockAvailable={item.stockAvailable}
              lowStockThreshold={item.lowStockThreshold}
            />
          </View>
        </View>
      </View>
    );
  };

  return (
    <FlatList
      data={products}
      keyExtractor={(item) => item.id}
      renderItem={renderProduct}
      contentContainerStyle={styles.listContent}
      ListEmptyComponent={
        <EmptyState
          title="No Products"
          subtitle="No inventory products found."
        />
      }
    />
  );
};

// ─── Screen ───────────────────────────────────────────────────────────────────

export const ReportsScreen: React.FC = () => {
  const isAuthorized = usePermissionGuard('VIEW_REPORTS');
  const [activeTab, setActiveTab] = useState<Tab>('sales');

  if (!isAuthorized) return null;

  return (
    <ScreenWrapper>
      <TabBar active={activeTab} onSelect={setActiveTab} />
      {activeTab === 'sales' ? <SalesTab /> : <InventoryTab />}
    </ScreenWrapper>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: Colors.primary,
  },
  tabLabel: {
    fontSize: Typography.base,
    color: Colors.gray500,
    fontWeight: Typography.medium,
  },
  tabLabelActive: {
    color: Colors.primary,
    fontWeight: Typography.semiBold,
  },
  tabContent: {
    flex: 1,
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: Spacing.md,
    gap: Spacing.sm,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  dateInput: {
    flex: 1,
  },
  applyButton: {
    height: 44,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  applyButtonLabel: {
    color: Colors.white,
    fontSize: Typography.sm,
    fontWeight: Typography.semiBold,
  },
  errorText: {
    fontSize: Typography.sm,
    color: Colors.danger,
    marginHorizontal: Spacing.md,
    marginTop: Spacing.xs,
  },
  listContent: {
    padding: Spacing.md,
    flexGrow: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  cardDate: {
    fontSize: Typography.sm,
    color: Colors.gray500,
    marginBottom: Spacing.sm,
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  cardLabel: {
    fontSize: Typography.sm,
    color: Colors.gray700,
  },
  cardValue: {
    fontSize: Typography.sm,
    color: Colors.gray900,
  },
  bold: {
    fontWeight: Typography.semiBold,
  },
  summaryRow: {
    backgroundColor: Colors.primaryLight,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginTop: Spacing.sm,
    gap: Spacing.xs,
  },
  summaryLabel: {
    fontSize: Typography.sm,
    color: Colors.gray700,
  },
  summaryValue: {
    fontSize: Typography.base,
    color: Colors.primary,
    marginBottom: Spacing.xs,
  },
  inventoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  productName: {
    flex: 1,
    fontSize: Typography.base,
    fontWeight: Typography.medium,
    color: Colors.gray900,
    marginRight: Spacing.sm,
  },
  lowStockText: {
    color: Colors.danger,
  },
  inventoryRight: {
    alignItems: 'flex-end',
    gap: Spacing.xs,
  },
  unitText: {
    fontSize: Typography.xs,
    color: Colors.gray500,
  },
});
