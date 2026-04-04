import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { AppBadge } from '@components/common/AppBadge';
import { Colors, Spacing, Typography, BorderRadius } from '@constants/theme';
import { formatPHP } from '@utils/formatCurrency';
import type { Transaction } from '../../types';

interface TransactionCardProps {
  transaction: Transaction;
  customerName?: string;
  onPress: () => void;
}

const STATUS_VARIANT: Record<string, 'success' | 'warning' | 'danger' | 'neutral'> = {
  IN_PROGRESS: 'warning',
  FINALIZED: 'success',
  VOIDED: 'danger',
  CANCELLED: 'neutral',
  RETURNED: 'neutral',
};

export const TransactionCard: React.FC<TransactionCardProps> = ({
  transaction,
  customerName,
  onPress,
}) => (
  <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
    <View style={styles.header}>
      <Text style={styles.id} numberOfLines={1}>
        #{transaction.id.slice(-8).toUpperCase()}
      </Text>
      <AppBadge
        label={transaction.status.replace('_', ' ')}
        variant={STATUS_VARIANT[transaction.status] ?? 'neutral'}
      />
    </View>
    {customerName ? (
      <Text style={styles.customer} numberOfLines={1}>{customerName}</Text>
    ) : null}
    <Text style={styles.amount}>{formatPHP(transaction.totalAmount)}</Text>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  id: {
    fontSize: Typography.sm,
    color: Colors.gray500,
    fontWeight: Typography.medium,
  },
  customer: {
    fontSize: Typography.base,
    color: Colors.gray900,
    marginBottom: Spacing.xs,
  },
  amount: {
    fontSize: Typography.lg,
    fontWeight: Typography.bold,
    color: Colors.black,
  },
});
