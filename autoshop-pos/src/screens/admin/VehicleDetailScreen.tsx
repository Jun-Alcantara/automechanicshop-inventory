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
import { observeTransactionsForVehicle } from '@services/transactionService';
import { database } from '@services/database';
import { VehicleModel } from '../../models/VehicleModel';
import { formatPHP } from '@utils/formatCurrency';
import { Colors, Spacing, Typography } from '@constants/theme';
import type { Vehicle, Transaction, TransactionStatus } from '../../types';
import type { AdminStackScreenProps } from '@navigation/types';

type Props = AdminStackScreenProps<'VehicleDetail'>;

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

export const VehicleDetailScreen: React.FC<Props> = ({ route, navigation }) => {
  const { vehicleId } = route.params;

  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  const loadVehicle = useCallback(async (id: string) => {
    try {
      const model = await database.get<VehicleModel>('vehicles').find(id);
      setVehicle({
        id: model.id,
        customerId: model.customerId,
        make: model.make,
        model: model.model,
        color: model.color,
        plateNumber: model.plateNumber,
        createdAt: model.createdAt,
        createdBy: model.createdBy,
      });
    } catch {
      setVehicle(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadVehicle(vehicleId);

      const txSub = observeTransactionsForVehicle(vehicleId).subscribe((models) => {
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
        txSub.unsubscribe();
      };
    }, [vehicleId, loadVehicle])
  );

  if (loading) {
    return (
      <ScreenWrapper>
        <ActivityIndicator testID="loading-indicator" style={styles.loader} color={Colors.primary} />
      </ScreenWrapper>
    );
  }

  if (!vehicle) {
    return (
      <ScreenWrapper>
        <Text style={styles.errorText}>Vehicle not found.</Text>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper>
      <ScrollView contentContainerStyle={styles.scrollContent}>

        {/* ─── Section 1: Vehicle Info ─────────────────────────────────────── */}
        <SectionHeader
          title="Vehicle Info"
          rightElement={
            <AppButton
              label="Edit"
              variant="ghost"
              size="sm"
              onPress={() => navigation.navigate('VehicleForm', { vehicleId, customerId: vehicle.customerId })}
            />
          }
        />
        <View style={styles.section}>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Make</Text>
            <Text style={styles.metaValue}>{vehicle.make}</Text>
          </View>
          {vehicle.model ? (
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Model</Text>
              <Text style={styles.metaValue}>{vehicle.model}</Text>
            </View>
          ) : null}
          {vehicle.color ? (
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Color</Text>
              <Text style={styles.metaValue}>{vehicle.color}</Text>
            </View>
          ) : null}
          {vehicle.plateNumber ? (
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Plate Number</Text>
              <Text style={styles.metaValue}>{vehicle.plateNumber}</Text>
            </View>
          ) : null}
        </View>

        {/* ─── Section 2: Service History ──────────────────────────────────── */}
        <SectionHeader title="Service History" />
        {transactions.length === 0 ? (
          <View style={styles.emptyWrapper}>
            <EmptyState title="No Service History" subtitle="No transactions linked to this vehicle." />
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

  // Vehicle info section
  section: {
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
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

  // List section
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
