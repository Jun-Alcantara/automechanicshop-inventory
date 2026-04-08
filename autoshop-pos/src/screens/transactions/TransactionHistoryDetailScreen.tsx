import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { ScreenWrapper } from '@components/layout/ScreenWrapper';
import { AppBadge } from '@components/common/AppBadge';
import { AppButton } from '@components/common/AppButton';
import { LineItemRow } from '@components/transaction/LineItemRow';
import { getTransactionById } from '@services/transactionService';
import { useHasPermission } from '@hooks/useHasPermission';
import { calculateTransactionTotals } from '@utils/calculateTransaction';
import { formatPHP } from '@utils/formatCurrency';
import { PERMISSIONS } from '@constants/permissions';
import { Colors, Spacing, Typography, BorderRadius } from '@constants/theme';
import { database } from '@services/database';
import { CustomerModel } from '../../models/CustomerModel';
import { VehicleModel } from '../../models/VehicleModel';
import { UserModel } from '../../models/UserModel';
import type { Transaction, TransactionStatus } from '../../types';
import type { TransactionsStackScreenProps } from '@navigation/types';

type Props = TransactionsStackScreenProps<'TransactionHistoryDetail'>;

const STATUS_LABEL: Record<TransactionStatus, string> = {
  IN_PROGRESS: 'In Progress',
  FINALIZED: 'Finalized',
  VOIDED: 'Voided',
  CANCELLED: 'Cancelled',
  RETURNED: 'Returned',
};

type BadgeVariant = 'success' | 'warning' | 'danger' | 'neutral' | 'primary';

const STATUS_BADGE_VARIANT: Record<TransactionStatus, BadgeVariant> = {
  IN_PROGRESS: 'primary',
  FINALIZED: 'success',
  VOIDED: 'danger',
  CANCELLED: 'neutral',
  RETURNED: 'warning',
};

const PAYMENT_METHOD_LABEL: Record<string, string> = {
  CASH: 'Cash',
  GCASH: 'GCash',
  MAYA: 'Maya',
};

const formatDateTime = (date: Date | number): string => {
  const d = typeof date === 'number' ? new Date(date) : date;
  return d.toLocaleString('en-PH', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
};

export const TransactionHistoryDetailScreen: React.FC<Props> = ({ route, navigation }) => {
  const { transactionId } = route.params;

  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);
  const [customerName, setCustomerName] = useState<string | null>(null);
  const [vehiclePlate, setVehiclePlate] = useState<string | null>(null);
  const [cashierName, setCashierName] = useState<string | null>(null);

  const canVoid = useHasPermission(PERMISSIONS.VOID_TRANSACTIONS);

  useEffect(() => {
    getTransactionById(transactionId)
      .then(setTransaction)
      .finally(() => setLoading(false));
  }, [transactionId]);

  useEffect(() => {
    if (!transaction) return;

    const resolve = async () => {
      if (transaction.customerId) {
        try {
          const c = await database.get<CustomerModel>('customers').find(transaction.customerId);
          setCustomerName(c.name);
        } catch {
          // not found
        }
      }
      if (transaction.vehicleId) {
        try {
          const v = await database.get<VehicleModel>('vehicles').find(transaction.vehicleId);
          setVehiclePlate(v.plateNumber);
        } catch {
          // not found
        }
      }
      if (transaction.cashierId) {
        try {
          const u = await database.get<UserModel>('users').find(transaction.cashierId);
          setCashierName(u.displayName);
        } catch {
          // not found
        }
      }
    };

    resolve();
  }, [transaction?.customerId, transaction?.vehicleId, transaction?.cashierId]);

  if (loading) {
    return (
      <ScreenWrapper>
        <ActivityIndicator testID="loading-indicator" style={styles.loader} color={Colors.primary} />
      </ScreenWrapper>
    );
  }

  if (!transaction) {
    return (
      <ScreenWrapper>
        <Text style={styles.errorText}>Transaction not found.</Text>
      </ScreenWrapper>
    );
  }

  const totals = calculateTransactionTotals(transaction.lineItems);
  const displayId = `#TXN-${transaction.id.slice(-5).toUpperCase()}`;
  const dateTime = transaction.finalizedAt
    ? formatDateTime(transaction.finalizedAt)
    : formatDateTime(transaction.createdAt);

  return (
    <ScreenWrapper>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* ─── Section 1: Transaction Header ─────────────────────────────── */}
        <View style={styles.section}>
          <View style={styles.headerRow}>
            <Text style={styles.transactionId}>{displayId}</Text>
            <AppBadge
              label={STATUS_LABEL[transaction.status]}
              variant={STATUS_BADGE_VARIANT[transaction.status]}
            />
          </View>
          <Text style={styles.dateTime}>{dateTime}</Text>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Cashier</Text>
            <Text style={styles.metaValue}>{cashierName ?? '—'}</Text>
          </View>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Customer</Text>
            <Text style={styles.metaValue}>{customerName ?? 'Walk-in'}</Text>
          </View>
          {vehiclePlate ? (
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Vehicle</Text>
              <Text style={styles.metaValue}>{vehiclePlate}</Text>
            </View>
          ) : null}
        </View>

        {/* ─── Section 2: Line Items ──────────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Items</Text>
          {transaction.lineItems.map((item) => (
            <View key={item.id} style={styles.lineItemWrapper}>
              <LineItemRow item={item} />
            </View>
          ))}
        </View>

        {/* ─── Section 3: Totals ──────────────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Totals</Text>
          <View style={styles.totalsRow}>
            <Text style={styles.totalsLabel}>Subtotal</Text>
            <Text style={styles.totalsValue}>{formatPHP(totals.subtotal)}</Text>
          </View>
          <View style={styles.totalsRow}>
            <Text style={styles.totalsLabel}>VAT (12%)</Text>
            <Text style={styles.totalsValue}>{formatPHP(totals.totalVat)}</Text>
          </View>
          <View style={[styles.totalsRow, styles.totalsDivider]}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>{formatPHP(totals.totalAmount)}</Text>
          </View>
        </View>

        {/* ─── Section 4: Payments ────────────────────────────────────────── */}
        {transaction.payments.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Payments</Text>
            {transaction.payments.map((payment) => (
              <View key={payment.id} style={styles.paymentRow}>
                <View style={styles.paymentLeft}>
                  <Text style={styles.paymentMethod}>
                    {PAYMENT_METHOD_LABEL[payment.method] ?? payment.method}
                  </Text>
                  {payment.referenceNumber ? (
                    <Text style={styles.paymentRef}>Ref: {payment.referenceNumber}</Text>
                  ) : null}
                </View>
                <Text style={styles.paymentAmount}>{formatPHP(payment.amount)}</Text>
              </View>
            ))}
          </View>
        ) : null}

        {/* ─── Action Buttons ─────────────────────────────────────────────── */}
        {canVoid && (
          <View style={styles.section}>
            <AppButton
              label="Void Transaction"
              variant="danger"
              onPress={() => navigation.navigate('VoidTransaction', { transactionId })}
              disabled={transaction.hasReturn}
              fullWidth
            />
            {transaction.hasReturn && (
              <Text style={styles.disabledNote}>
                Cannot void: a return has already been processed for this transaction.
              </Text>
            )}
            <AppButton
              label="Process Return"
              onPress={() => navigation.navigate('ReturnTransaction', { transactionId })}
              fullWidth
            />
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

  // Section wrapper
  section: {
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
  },
  sectionTitle: {
    fontSize: Typography.sm,
    fontWeight: Typography.semiBold,
    color: Colors.gray500,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },

  // Header
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  transactionId: {
    fontSize: Typography.xl,
    fontWeight: Typography.bold,
    color: Colors.black,
  },
  dateTime: {
    fontSize: Typography.sm,
    color: Colors.gray500,
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

  // Line items
  lineItemWrapper: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },

  // Totals
  totalsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  totalsLabel: {
    fontSize: Typography.sm,
    color: Colors.gray500,
  },
  totalsValue: {
    fontSize: Typography.sm,
    color: Colors.gray700,
  },
  totalsDivider: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    marginTop: Spacing.xs,
    paddingTop: Spacing.xs,
  },
  totalLabel: {
    fontSize: Typography.base,
    fontWeight: Typography.bold,
    color: Colors.black,
  },
  totalValue: {
    fontSize: Typography.base,
    fontWeight: Typography.bold,
    color: Colors.black,
  },

  // Payments
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: Spacing.xs,
  },
  paymentLeft: { flex: 1 },
  paymentMethod: {
    fontSize: Typography.base,
    color: Colors.black,
  },
  paymentRef: {
    fontSize: Typography.sm,
    color: Colors.gray500,
    marginTop: 2,
  },
  paymentAmount: {
    fontSize: Typography.base,
    fontWeight: Typography.semiBold,
    color: Colors.black,
  },

  // Action note
  disabledNote: {
    fontSize: Typography.sm,
    color: Colors.gray500,
    fontStyle: 'italic',
    marginTop: -Spacing.xs,
  },
});
