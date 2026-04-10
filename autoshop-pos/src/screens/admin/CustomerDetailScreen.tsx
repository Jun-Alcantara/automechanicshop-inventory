import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { ScreenWrapper } from '@components/layout/ScreenWrapper';
import { SectionHeader } from '@components/layout/SectionHeader';
import { AppBadge } from '@components/common/AppBadge';
import { AppButton } from '@components/common/AppButton';
import { EmptyState } from '@components/common/EmptyState';
import { observeVehiclesForCustomer } from '@services/vehicleService';
import { observeTransactionsForCustomer } from '@services/transactionService';
import { database } from '@services/database';
import { CustomerModel } from '../../models/CustomerModel';
import { formatPHP } from '@utils/formatCurrency';
import { Colors, Spacing, Typography } from '@constants/theme';
import type { Customer, Vehicle, Transaction, TransactionStatus } from '../../types';
import type { AdminStackScreenProps } from '@navigation/types';

type Props = AdminStackScreenProps<'CustomerDetail'>;

type BadgeVariant = 'success' | 'warning' | 'danger' | 'neutral' | 'primary';

const STATUS_LABEL: Record<TransactionStatus, string> = {
  IN_PROGRESS: 'In Progress',
  FINALIZED: 'Finalized',
  VOIDED: 'Voided',
  CANCELLED: 'Cancelled',
  RETURNED: 'Returned',
};

const STATUS_BADGE_VARIANT: Record<TransactionStatus, BadgeVariant> = {
  IN_PROGRESS: 'primary',
  FINALIZED: 'success',
  VOIDED: 'danger',
  CANCELLED: 'neutral',
  RETURNED: 'warning',
};

const HISTORY_STATUSES: TransactionStatus[] = ['FINALIZED', 'VOIDED', 'RETURNED'];

const formatDate = (date: Date | number): string => {
  const d = typeof date === 'number' ? new Date(date) : date;
  return d.toLocaleDateString('en-PH', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

export const CustomerDetailScreen: React.FC<Props> = ({ route, navigation }) => {
  const { customerId } = route.params;

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  const loadCustomer = useCallback(async (id: string) => {
    try {
      const model = await database.get<CustomerModel>('customers').find(id);
      setCustomer({
        id: model.id,
        type: model.type,
        name: model.name,
        phone: model.phone,
        email: model.email,
        isActive: model.isActive,
        createdAt: model.createdAt,
        createdBy: model.createdBy,
      });
    } catch {
      setCustomer(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadCustomer(customerId);

      const vehicleSub = observeVehiclesForCustomer(customerId).subscribe((models) => {
        setVehicles(
          models.map((v) => ({
            id: v.id,
            customerId: v.customerId,
            make: v.make,
            model: v.model,
            color: v.color,
            plateNumber: v.plateNumber,
            createdAt: v.createdAt,
            createdBy: v.createdBy,
          }))
        );
      });

      const txSub = observeTransactionsForCustomer(customerId).subscribe((models) => {
        const history = models
          .filter((t) => (HISTORY_STATUSES as string[]).includes(t.status))
          .map((t) => ({
            id: t.id,
            status: t.status as TransactionStatus,
            customerId: t.customerId,
            vehicleId: t.vehicleId,
            cashierId: t.cashierId,
            subtotal: t.subtotal,
            totalVat: t.totalVat,
            totalAmount: t.totalAmount,
            changeDue: t.changeDue,
            hasReturn: t.hasReturn,
            originalTransactionId: t.originalTransactionId,
            voidReason: t.voidReason,
            voidedBy: t.voidedBy,
            voidedAt: t.voidedAt,
            returnReason: t.returnReason,
            returnedBy: t.returnedBy,
            returnedAt: t.returnedAt,
            createdAt: t.createdAt,
            createdBy: t.createdBy,
            finalizedAt: t.finalizedAt,
            finalizedBy: t.finalizedBy,
            lineItems: [],
            payments: [],
          }));
        setTransactions(history);
      });

      return () => {
        vehicleSub.unsubscribe();
        txSub.unsubscribe();
      };
    }, [customerId, loadCustomer])
  );

  if (loading) {
    return (
      <ScreenWrapper>
        <ActivityIndicator testID="loading-indicator" style={styles.loader} color={Colors.primary} />
      </ScreenWrapper>
    );
  }

  if (!customer) {
    return (
      <ScreenWrapper>
        <Text style={styles.errorText}>Customer not found.</Text>
      </ScreenWrapper>
    );
  }

  const displayName = customer.type === 'WALKIN' ? customer.name || 'Walk-in' : customer.name;

  return (
    <ScreenWrapper>
      <ScrollView contentContainerStyle={styles.scrollContent}>

        {/* ─── Section 1: Customer Info ───────────────────────────────────── */}
        <SectionHeader
          title="Customer Info"
          rightElement={
            <AppButton
              label="Edit"
              variant="ghost"
              size="sm"
              onPress={() => navigation.navigate('CustomerForm', { customerId })}
            />
          }
        />
        <View style={styles.section}>
          <View style={styles.nameRow}>
            <Text style={styles.customerName}>{displayName}</Text>
            <AppBadge
              label={customer.type === 'WALKIN' ? 'Walk-in' : 'Named'}
              variant={customer.type === 'WALKIN' ? 'neutral' : 'primary'}
            />
          </View>
          {customer.phone ? (
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Phone</Text>
              <Text style={styles.metaValue}>{customer.phone}</Text>
            </View>
          ) : null}
          {customer.email ? (
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Email</Text>
              <Text style={styles.metaValue}>{customer.email}</Text>
            </View>
          ) : null}
        </View>

        {/* ─── Section 2: Vehicles ────────────────────────────────────────── */}
        <SectionHeader
          title="Vehicles"
          rightElement={
            <AppButton
              label="Add Vehicle"
              variant="ghost"
              size="sm"
              onPress={() => navigation.navigate('VehicleForm', { customerId })}
            />
          }
        />
        {vehicles.length === 0 ? (
          <View style={styles.emptyWrapper}>
            <EmptyState title="No Vehicles" subtitle="No vehicles linked to this customer." />
          </View>
        ) : (
          <View style={styles.listSection}>
            {vehicles.map((vehicle) => (
              <TouchableOpacity
                key={vehicle.id}
                testID={`vehicle-row-${vehicle.id}`}
                style={styles.listRow}
                activeOpacity={0.7}
                onPress={() => navigation.navigate('VehicleDetail', { vehicleId: vehicle.id })}
              >
                <Text style={styles.vehicleText}>
                  {vehicle.make} {vehicle.model}
                  {vehicle.color ? ` (${vehicle.color})` : ''}
                  {vehicle.plateNumber ? ` — ${vehicle.plateNumber}` : ''}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* ─── Section 3: Transaction History ────────────────────────────── */}
        <SectionHeader title="Transaction History" />
        {transactions.length === 0 ? (
          <View style={styles.emptyWrapper}>
            <EmptyState title="No Transactions" subtitle="No transaction history for this customer." />
          </View>
        ) : (
          <View style={styles.listSection}>
            {transactions.map((txn) => (
              <TouchableOpacity
                key={txn.id}
                testID={`txn-row-${txn.id}`}
                style={styles.listRow}
                activeOpacity={0.7}
                onPress={() =>
                  navigation.navigate('Transactions', {
                    screen: 'TransactionHistoryDetail',
                    params: { transactionId: txn.id },
                  })
                }
              >
                <View style={styles.txnRow}>
                  <View style={styles.txnLeft}>
                    <Text style={styles.txnDate}>
                      {formatDate(txn.finalizedAt ?? txn.createdAt)}
                    </Text>
                    <Text style={styles.txnTotal}>{formatPHP(txn.totalAmount)}</Text>
                  </View>
                  <AppBadge
                    label={STATUS_LABEL[txn.status]}
                    variant={STATUS_BADGE_VARIANT[txn.status]}
                  />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

      </ScrollView>
    </ScreenWrapper>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  loader: { marginTop: Spacing.xxl },
  errorText: {
    fontSize: Typography.base,
    color: Colors.gray500,
    textAlign: 'center',
    marginTop: Spacing.xxl,
  },
  scrollContent: {
    paddingBottom: Spacing.xl,
  },

  // Customer info section
  section: {
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  customerName: {
    fontSize: Typography.xl,
    fontWeight: Typography.bold,
    color: Colors.black,
    flex: 1,
    marginRight: Spacing.sm,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metaLabel: {
    fontSize: Typography.sm,
    color: Colors.gray500,
  },
  metaValue: {
    fontSize: Typography.sm,
    color: Colors.gray900,
    fontWeight: Typography.medium,
  },

  // List sections
  listSection: {
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  listRow: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },

  // Vehicle row
  vehicleText: {
    fontSize: Typography.base,
    color: Colors.gray900,
  },

  // Transaction row
  txnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  txnLeft: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  txnDate: {
    fontSize: Typography.sm,
    color: Colors.gray500,
  },
  txnTotal: {
    fontSize: Typography.base,
    fontWeight: Typography.semiBold,
    color: Colors.black,
    marginTop: 2,
  },

  // Empty state wrapper
  emptyWrapper: {
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingVertical: Spacing.xl,
  },
});
