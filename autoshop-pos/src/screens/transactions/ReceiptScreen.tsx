import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { ScreenWrapper } from '@components/layout/ScreenWrapper';
import { AppButton } from '@components/common/AppButton';
import { getTransactionById } from '@services/transactionService';
import { useSettingsStore } from '@stores/settingsStore';
import { calculateTransactionTotals } from '@utils/calculateTransaction';
import { formatPHP } from '@utils/formatCurrency';
import { Colors, Spacing, Typography, BorderRadius } from '@constants/theme';
import { database } from '@services/database';
import { CustomerModel } from '../../models/CustomerModel';
import { VehicleModel } from '../../models/VehicleModel';
import { UserModel } from '../../models/UserModel';
import type { Transaction, LineItem, Payment } from '../../types';
import type { TransactionsStackScreenProps } from '@navigation/types';

type Props = TransactionsStackScreenProps<'Receipt'>;

const PAYMENT_METHOD_LABEL: Record<string, string> = {
  CASH: 'Cash',
  GCASH: 'GCash',
  MAYA: 'Maya',
};

const formatDateTime = (ts: number): string => {
  const d = new Date(ts);
  return d.toLocaleString('en-PH', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
};

export const ReceiptScreen: React.FC<Props> = ({ route, navigation }) => {
  const { transactionId } = route.params;

  const receiptHeader = useSettingsStore((s) => s.settings?.receiptHeader ?? '');

  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);
  const [cashierName, setCashierName] = useState<string | null>(null);
  const [customerName, setCustomerName] = useState<string | null>(null);
  const [vehiclePlate, setVehiclePlate] = useState<string | null>(null);

  // ─── Load transaction ───────────────────────────────────────────────────────

  useEffect(() => {
    getTransactionById(transactionId)
      .then(setTransaction)
      .finally(() => setLoading(false));
  }, [transactionId]);

  // ─── Resolve related entities ───────────────────────────────────────────────

  useEffect(() => {
    if (!transaction) return;

    const resolve = async () => {
      if (transaction.finalizedBy) {
        try {
          const u = await database.get<UserModel>('users').find(transaction.finalizedBy);
          setCashierName(u.displayName);
        } catch {
          // not found
        }
      }
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
    };

    resolve();
  }, [transaction?.finalizedBy, transaction?.customerId, transaction?.vehicleId]);

  // ─── Handlers ───────────────────────────────────────────────────────────────

  const handleDone = () => {
    navigation.replace('TransactionList');
  };

  // ─── Loading / error states ─────────────────────────────────────────────────

  if (loading) {
    return (
      <ScreenWrapper>
        <ActivityIndicator style={styles.loader} color={Colors.primary} />
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

  // ─── Derived display values ─────────────────────────────────────────────────

  const totals = calculateTransactionTotals(transaction.lineItems);
  const displayId = `TXN-${transaction.id.slice(-5).toUpperCase()}`;
  const dateTime = transaction.finalizedAt ? formatDateTime(transaction.finalizedAt) : '—';

  const isVoid = transaction.status === 'VOIDED';
  const isReturn = transaction.status === 'RETURNED';
  const originalId = transaction.originalTransactionId
    ? `#TXN-${transaction.originalTransactionId.slice(-5).toUpperCase()}`
    : '';

  const customerLine = customerName
    ? vehiclePlate
      ? `${customerName} — ${vehiclePlate}`
      : customerName
    : 'Walk-in';

  const cashPaid = transaction.payments
    .filter((p: Payment) => p.method === 'CASH')
    .reduce((s: number, p: Payment) => s + p.amount, 0);

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <ScreenWrapper>
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Void / Return notice */}
        {(isVoid || isReturn) && (
          <View style={styles.noticeBar}>
            <Text style={styles.noticeText}>
              {isVoid ? '── VOID ──' : '── RETURN ──'} Original {originalId}
            </Text>
          </View>
        )}

        {/* Receipt card */}
        <View style={styles.receiptCard}>
          {/* Header */}
          {receiptHeader ? (
            <Text style={styles.shopHeader}>{receiptHeader}</Text>
          ) : null}

          <Text style={styles.dateTime}>{dateTime}</Text>
          <Text style={styles.metaLine}>Transaction ID: {displayId}</Text>
          <Text style={styles.metaLine}>Cashier: {cashierName ?? '—'}</Text>
          <Text style={styles.metaLine}>Customer: {customerLine}</Text>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Line items */}
          <View style={styles.itemsHeader}>
            <Text style={[styles.itemCol, styles.itemName]}>Item</Text>
            <Text style={styles.itemQty}>Qty</Text>
            <Text style={styles.itemPrice}>Price</Text>
            <Text style={styles.itemTotal}>Total</Text>
          </View>

          {transaction.lineItems.map((item: LineItem) => (
            <View key={item.id} style={styles.itemRow}>
              <Text style={[styles.itemCol, styles.itemName]} numberOfLines={2}>
                {item.name}
              </Text>
              <Text style={styles.itemQty}>{item.quantity}</Text>
              <Text style={styles.itemPrice}>{formatPHP(item.unitPrice)}</Text>
              <Text style={styles.itemTotal}>{formatPHP(item.total)}</Text>
            </View>
          ))}

          {/* Divider */}
          <View style={styles.divider} />

          {/* Subtotals */}
          <View style={styles.totalsRow}>
            <Text style={styles.totalsLabel}>Subtotal</Text>
            <Text style={styles.totalsValue}>{formatPHP(totals.subtotal)}</Text>
          </View>
          <View style={styles.totalsRow}>
            <Text style={styles.totalsLabel}>VAT (12%)</Text>
            <Text style={styles.totalsValue}>{formatPHP(totals.totalVat)}</Text>
          </View>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Grand total */}
          <View style={styles.totalsRow}>
            <Text style={styles.grandTotalLabel}>TOTAL</Text>
            <Text style={styles.grandTotalValue}>{formatPHP(totals.totalAmount)}</Text>
          </View>

          {/* Payments */}
          {transaction.payments.length > 0 && (
            <>
              <View style={styles.divider} />
              <Text style={styles.paymentHeader}>Payment</Text>
              {transaction.payments.map((p: Payment) => (
                <View key={p.id} style={styles.totalsRow}>
                  <Text style={styles.totalsLabel}>
                    {PAYMENT_METHOD_LABEL[p.method] ?? p.method}
                    {p.referenceNumber ? ` (ref: ${p.referenceNumber})` : ''}
                  </Text>
                  <Text style={styles.totalsValue}>{formatPHP(p.amount)}</Text>
                </View>
              ))}
              {cashPaid > 0 && (
                <View style={styles.totalsRow}>
                  <Text style={styles.totalsLabel}>Change Due</Text>
                  <Text style={styles.totalsValue}>{formatPHP(transaction.changeDue)}</Text>
                </View>
              )}
            </>
          )}
        </View>

        {/* Action button */}
        <View style={styles.actions}>
          <AppButton label="Done" onPress={handleDone} />
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  flex: { flex: 1 },
  loader: { marginTop: Spacing.xxl },
  errorText: {
    fontSize: Typography.base,
    color: Colors.gray500,
    textAlign: 'center',
    marginTop: Spacing.xxl,
  },
  scrollContent: {
    padding: Spacing.md,
    gap: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  noticeBar: {
    backgroundColor: Colors.danger,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    alignItems: 'center',
  },
  noticeText: {
    color: Colors.white,
    fontSize: Typography.sm,
    fontWeight: Typography.bold,
    letterSpacing: 0.5,
  },
  receiptCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  shopHeader: {
    fontSize: Typography.lg,
    fontWeight: Typography.bold,
    color: Colors.gray900,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  dateTime: {
    fontSize: Typography.sm,
    color: Colors.gray500,
    textAlign: 'center',
  },
  metaLine: {
    fontSize: Typography.sm,
    color: Colors.gray700,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.xs,
  },
  itemsHeader: {
    flexDirection: 'row',
    marginBottom: 2,
  },
  itemRow: {
    flexDirection: 'row',
    marginBottom: 2,
  },
  itemCol: {
    fontSize: Typography.sm,
    color: Colors.gray700,
  },
  itemName: {
    flex: 1,
    fontWeight: Typography.medium,
    color: Colors.gray900,
    paddingRight: Spacing.xs,
  },
  itemQty: {
    width: 32,
    fontSize: Typography.sm,
    color: Colors.gray700,
    textAlign: 'center',
  },
  itemPrice: {
    width: 72,
    fontSize: Typography.sm,
    color: Colors.gray700,
    textAlign: 'right',
  },
  itemTotal: {
    width: 72,
    fontSize: Typography.sm,
    color: Colors.gray900,
    textAlign: 'right',
    fontWeight: Typography.medium,
  },
  totalsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalsLabel: {
    fontSize: Typography.sm,
    color: Colors.gray700,
    flex: 1,
  },
  totalsValue: {
    fontSize: Typography.sm,
    color: Colors.gray900,
    fontWeight: Typography.medium,
  },
  grandTotalLabel: {
    fontSize: Typography.base,
    fontWeight: Typography.bold,
    color: Colors.gray900,
    flex: 1,
  },
  grandTotalValue: {
    fontSize: Typography.lg,
    fontWeight: Typography.bold,
    color: Colors.primary,
  },
  paymentHeader: {
    fontSize: Typography.sm,
    fontWeight: Typography.semiBold,
    color: Colors.gray700,
  },
  actions: {
    gap: Spacing.sm,
  },
});
