import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { AppInput } from '@components/common/AppInput';
import { AppBadge } from '@components/common/AppBadge';
import { AppButton } from '@components/common/AppButton';
import { EmptyState } from '@components/common/EmptyState';
import { searchCustomers } from '@services/customerService';
import { useHasPermission } from '@hooks/useHasPermission';
import { Colors, Spacing, Typography, BorderRadius } from '@constants/theme';
import type { Customer } from '@/types';

interface Props {
  onSelectCustomer: (customer: Customer) => void;
  /** Load all customers immediately on mount (e.g. CustomerListScreen). Default: false */
  loadOnMount?: boolean;
  /** If provided, a button with this callback is shown when there are no results */
  onNewCustomer?: () => void;
  newCustomerLabel?: string;
}

export const CustomerSearchList: React.FC<Props> = ({
  onSelectCustomer,
  loadOnMount = false,
  onNewCustomer,
  newCustomerLabel = 'Create New Customer',
}) => {
  const canCreate = useHasPermission('CREATE_TRANSACTIONS');
  const [query, setQuery] = useState('');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [initialLoading, setInitialLoading] = useState(loadOnMount);
  const [searching, setSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(loadOnMount);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const runSearch = useCallback(async (q: string) => {
    setSearching(true);
    try {
      const results = await searchCustomers(q);
      setCustomers(results);
      setHasSearched(true);
    } finally {
      setSearching(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    if (!loadOnMount) return;
    searchCustomers('').then((results) => {
      setCustomers(results);
      setInitialLoading(false);
    });
  }, [loadOnMount]);

  // Debounced search
  useEffect(() => {
    if (initialLoading) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!query.trim() && !loadOnMount) {
      setCustomers([]);
      setHasSearched(false);
      return;
    }

    debounceRef.current = setTimeout(() => {
      runSearch(query.trim());
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, initialLoading, loadOnMount, runSearch]);

  const renderItem = ({ item }: { item: Customer }) => (
    <TouchableOpacity
      style={styles.row}
      onPress={() => onSelectCustomer(item)}
      activeOpacity={0.7}
    >
      <View style={styles.rowContent}>
        <Text style={styles.customerName}>{item.name}</Text>
        {item.type !== 'WALKIN' && item.phone ? (
          <Text style={styles.customerPhone}>{item.phone}</Text>
        ) : null}
      </View>
      {item.type === 'WALKIN' && <AppBadge label="Walk-in" variant="neutral" />}
      {item.type === 'NAMED' && <AppBadge label="Named" variant="primary" />}
    </TouchableOpacity>
  );

  const showHint = !loadOnMount && !hasSearched;
  const showNoResults = hasSearched && !searching && customers.length === 0;

  return (
    <View style={styles.container}>
      {/* Search input */}
      <View style={styles.searchContainer}>
        <AppInput
          placeholder="Search by name or phone..."
          value={query}
          onChangeText={setQuery}
          autoCapitalize="words"
          autoCorrect={false}
        />
        {searching && (
          <ActivityIndicator
            style={styles.searchIndicator}
            size="small"
            color={Colors.primary}
          />
        )}
      </View>

      {/* States */}
      {showHint ? (
        <Text style={styles.hint}>Start typing to search customers</Text>
      ) : showNoResults ? (
        <View style={styles.noResults}>
          <EmptyState
            title="No Customers Found"
            subtitle={query ? 'Try a different search term.' : 'No customers yet.'}
          />
          {onNewCustomer && (
            <AppButton
              label={newCustomerLabel}
              onPress={onNewCustomer}
              variant="secondary"
              style={styles.newCustomerBtn}
            />
          )}
        </View>
      ) : (
        <FlatList
          data={customers}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
        />
      )}

      {canCreate && onNewCustomer && (
        <View style={styles.footer}>
          <AppButton
            label="New Customer"
            variant="secondary"
            onPress={onNewCustomer}
            fullWidth
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  searchContainer: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  searchIndicator: {
    marginTop: Spacing.xs,
    alignSelf: 'flex-end',
  },
  hint: {
    textAlign: 'center',
    marginTop: Spacing.xxl,
    fontSize: Typography.sm,
    color: Colors.warning,
    fontWeight: Typography.medium,
  },
  noResults: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  newCustomerBtn: {
    alignSelf: 'stretch',
    marginTop: Spacing.md,
  },
  listContent: {
    marginTop: 10,
    paddingHorizontal: Spacing.md,
    paddingBottom: 100,
    flexGrow: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  rowContent: {
    flex: 1,
    marginRight: Spacing.md,
  },
  customerName: {
    fontSize: Typography.base,
    fontWeight: Typography.semiBold,
    color: Colors.gray900,
  },
  customerPhone: {
    fontSize: Typography.sm,
    color: Colors.gray500,
    marginTop: Spacing.xs,
  },
  footer: {
    padding: Spacing.md,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
});
