import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useOpenTransactionsStore } from '@stores/openTransactionsStore';
import { listTransactions } from '@services/transactionService';
import { useHasPermission } from '@hooks/useHasPermission';
import { PERMISSIONS } from '@constants/permissions';
import { ScreenWrapper } from '@components/layout/ScreenWrapper';
import { TransactionCard } from '@components/transaction/TransactionCard';
import { Colors, Spacing, Typography, BorderRadius } from '@constants/theme';
import { formatPHP } from '@utils/formatCurrency';
import { database } from '@services/database';
import { CustomerModel } from '../../models/CustomerModel';
import { VehicleModel } from '../../models/VehicleModel';
import type { Transaction } from '../../types';
import type { TransactionsStackScreenProps } from '@navigation/types';

type Props = TransactionsStackScreenProps<'TransactionList'>;

const HISTORY_STATUSES = ['FINALIZED', 'VOIDED', 'RETURNED'] as const;

export const TransactionListScreen: React.FC<Props> = ({ navigation }) => {
  const transactions = useOpenTransactionsStore((s) => s.transactions);
  const loadingInProgress = useOpenTransactionsStore((s) => s.loading);

  const [history, setHistory] = useState<Transaction[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // customer id → name, vehicle id → plate number
  const [customerNames, setCustomerNames] = useState<Record<string, string>>({});
  const [vehiclePlates, setVehiclePlates] = useState<Record<string, string>>({});

  const canCreate = useHasPermission(PERMISSIONS.CREATE_TRANSACTIONS);

  // Subscribe to live IN_PROGRESS transactions on focus, unsubscribe on blur
  useFocusEffect(
    useCallback(() => {
      useOpenTransactionsStore.getState().subscribe();
      return () => useOpenTransactionsStore.getState().unsubscribe();
    }, [])
  );

  // Load history on mount
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoadingHistory(true);
      try {
        const data = await listTransactions({ statuses: [...HISTORY_STATUSES] });
        if (!cancelled) setHistory(data);
      } finally {
        if (!cancelled) setLoadingHistory(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, []);

  // Resolve customer names and vehicle plates for all displayed transactions
  useEffect(() => {
    const all = [...transactions, ...history];
    if (all.length === 0) return;

    const customerIds = [...new Set(all.map((t) => t.customerId).filter(Boolean))];
    const vehicleIds = [...new Set(all.map((t) => t.vehicleId).filter(Boolean))];

    const resolve = async () => {
      const nameMap: Record<string, string> = {};
      const plateMap: Record<string, string> = {};

      await Promise.all([
        ...customerIds.map(async (id) => {
          try {
            const c = await database.get<CustomerModel>('customers').find(id);
            nameMap[id] = c.name;
          } catch {
            // customer may not exist; leave blank
          }
        }),
        ...vehicleIds.map(async (id) => {
          try {
            const v = await database.get<VehicleModel>('vehicles').find(id);
            plateMap[id] = v.plateNumber;
          } catch {
            // vehicle may not exist; leave blank
          }
        }),
      ]);

      setCustomerNames((prev) => ({ ...prev, ...nameMap }));
      setVehiclePlates((prev) => ({ ...prev, ...plateMap }));
    };

    resolve();
  }, [transactions, history]);

  const renderInProgressItem = ({ item }: { item: Transaction }) => (
    <TouchableOpacity
      style={styles.row}
      activeOpacity={0.7}
      onPress={() => navigation.navigate('TransactionDetail', { transactionId: item.id })}
    >
      <View style={styles.rowMain}>
        <Text style={styles.rowId}>#{item.id.slice(-8).toUpperCase()}</Text>
        <Text style={styles.rowTotal}>{formatPHP(item.totalAmount)}</Text>
      </View>
      {customerNames[item.customerId] ? (
        <Text style={styles.rowSub}>{customerNames[item.customerId]}</Text>
      ) : null}
      {vehiclePlates[item.vehicleId] ? (
        <Text style={styles.rowPlate}>{vehiclePlates[item.vehicleId]}</Text>
      ) : null}
    </TouchableOpacity>
  );

  const renderHistoryItem = ({ item }: { item: Transaction }) => (
    <TransactionCard
      transaction={item}
      {...(customerNames[item.customerId] ? { customerName: customerNames[item.customerId] } : {})}
      onPress={() => navigation.navigate('TransactionDetail', { transactionId: item.id })}
    />
  );

  return (
    <ScreenWrapper noHeader>
      {/* In Progress section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>In Progress</Text>
        {loadingInProgress ? (
          <ActivityIndicator style={styles.loader} color={Colors.primary} />
        ) : (
          <FlatList
            data={transactions}
            keyExtractor={(item) => item.id}
            renderItem={renderInProgressItem}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <Text style={styles.empty}>No active transactions</Text>
            }
            scrollEnabled={false}
          />
        )}
      </View>

      {/* History section */}
      <View style={[styles.section, styles.historySectionFlex]}>
        <Text style={styles.sectionTitle}>History</Text>
        {loadingHistory ? (
          <ActivityIndicator style={styles.loader} color={Colors.primary} />
        ) : (
          <FlatList
            data={history}
            keyExtractor={(item) => item.id}
            renderItem={renderHistoryItem}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <Text style={styles.empty}>No history found</Text>
            }
          />
        )}
      </View>

      {/* FAB */}
      {canCreate && (
        <TouchableOpacity
          style={styles.fab}
          activeOpacity={0.8}
          onPress={() => navigation.navigate('NewTransaction')}
        >
          <Text style={styles.fabLabel}>+ New Transaction</Text>
        </TouchableOpacity>
      )}
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  section: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
  },
  historySectionFlex: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: Typography.lg,
    fontWeight: Typography.semiBold,
    color: Colors.gray900,
    marginBottom: Spacing.sm,
  },
  listContent: {
    paddingBottom: Spacing.sm,
  },
  loader: {
    marginTop: Spacing.md,
  },
  empty: {
    fontSize: Typography.base,
    color: Colors.gray500,
    textAlign: 'center',
    marginTop: Spacing.md,
  },
  row: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  rowMain: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rowId: {
    fontSize: Typography.sm,
    color: Colors.gray500,
    fontWeight: Typography.medium,
  },
  rowTotal: {
    fontSize: Typography.lg,
    fontWeight: Typography.bold,
    color: Colors.black,
  },
  rowSub: {
    fontSize: Typography.base,
    color: Colors.gray900,
    marginTop: Spacing.xs,
  },
  rowPlate: {
    fontSize: Typography.sm,
    color: Colors.gray500,
    marginTop: 2,
  },
  fab: {
    position: 'absolute',
    bottom: Spacing.xl,
    right: Spacing.xl,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.sm + 2,
    paddingHorizontal: Spacing.lg,
    elevation: 4,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  fabLabel: {
    color: Colors.white,
    fontSize: Typography.base,
    fontWeight: Typography.semiBold,
  },
});
