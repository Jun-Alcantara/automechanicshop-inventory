import React, { useState, useCallback, useEffect } from 'react';
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
import { AppInput } from '@components/common/AppInput';

import { usePermissionGuard } from '@hooks/usePermissionGuard';
import { getAuditLogs } from '@services/auditService';

import { Colors, Spacing, Typography, BorderRadius } from '@constants/theme';
import type { AuditLog } from '@/types';

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

const formatDateTime = (ts: Date): string => new Date(ts).toLocaleString();

// ─── Row ──────────────────────────────────────────────────────────────────────

const AuditLogRow: React.FC<{ item: AuditLog }> = ({ item }) => (
  <View style={styles.card}>
    <Text style={styles.timestamp}>{formatDateTime(item.timestamp)}</Text>
    <View style={styles.row}>
      <Text style={styles.label}>User</Text>
      <Text style={styles.value}>{item.userName}</Text>
    </View>
    <View style={styles.row}>
      <Text style={styles.label}>Action</Text>
      <Text style={[styles.value, styles.badge]}>{item.actionType}</Text>
    </View>
    <View style={styles.row}>
      <Text style={styles.label}>Entity</Text>
      <Text style={styles.value}>{item.entityType}</Text>
    </View>
    {item.note ? (
      <View style={styles.row}>
        <Text style={styles.label}>Note</Text>
        <Text style={[styles.value, styles.noteText]}>{item.note}</Text>
      </View>
    ) : null}
  </View>
);

// ─── Screen ───────────────────────────────────────────────────────────────────

export const AuditLogScreen: React.FC = () => {
  const isAuthorized = usePermissionGuard('VIEW_REPORTS');

  const [startStr, setStartStr] = useState(toDateString(todayStart()));
  const [endStr, setEndStr] = useState(toDateString(new Date()));
  const [entries, setEntries] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const fetchEntries = useCallback(async (from: Date, to: Date) => {
    setLoading(true);
    setError(undefined);
    try {
      const toEndOfDay = new Date(to);
      toEndOfDay.setHours(23, 59, 59, 999);
      const results = await getAuditLogs(from, toEndOfDay);
      setEntries(results);
    } catch {
      setError('Failed to load audit logs.');
    } finally {
      setLoading(false);
      setFetched(true);
    }
  }, []);

  useEffect(() => {
    fetchEntries(todayStart(), new Date());
  }, [fetchEntries]);

  const handleApply = useCallback(() => {
    const from = parseDate(startStr);
    const to = parseDate(endStr);

    if (!from) {
      setError('Invalid start date. Use YYYY-MM-DD.');
      return;
    }
    if (!to) {
      setError('Invalid end date. Use YYYY-MM-DD.');
      return;
    }

    fetchEntries(from, to);
  }, [startStr, endStr, fetchEntries]);

  if (!isAuthorized) return null;

  return (
    <ScreenWrapper>
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
          data={entries}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <AuditLogRow item={item} />}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            fetched ? (
              <EmptyState
                title="No Audit Logs"
                subtitle="No entries found for the selected date range."
              />
            ) : null
          }
        />
      )}
    </ScreenWrapper>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
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
  timestamp: {
    fontSize: Typography.sm,
    color: Colors.gray500,
    marginBottom: Spacing.sm,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  label: {
    fontSize: Typography.sm,
    color: Colors.gray500,
  },
  value: {
    fontSize: Typography.sm,
    color: Colors.gray900,
    fontWeight: Typography.medium,
    flexShrink: 1,
    textAlign: 'right',
  },
  badge: {
    color: Colors.primary,
    fontWeight: Typography.semiBold,
  },
  noteText: {
    color: Colors.gray700,
    fontWeight: Typography.regular,
    flex: 1,
    textAlign: 'right',
  },
});
