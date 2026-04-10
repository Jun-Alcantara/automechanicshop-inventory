import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';

import { ScreenWrapper } from '@components/layout/ScreenWrapper';
import { EmptyState } from '@components/common/EmptyState';
import { AppBadge } from '@components/common/AppBadge';
import { AppButton } from '@components/common/AppButton';
import { AppInput } from '@components/common/AppInput';
import { LoadingOverlay } from '@components/common/LoadingOverlay';

import { useHasPermission } from '@hooks/useHasPermission';
import { searchCustomers } from '@services/customerService';
import type { Customer } from '@/types';
import type { AdminStackParamList } from '@navigation/types';
import { Colors, Spacing, Typography, BorderRadius } from '@constants/theme';

type NavigationProp = StackNavigationProp<AdminStackParamList, 'CustomerList'>;

export const CustomerListScreen: React.FC = () => {
  const canCreate = useHasPermission('CREATE_TRANSACTIONS');
  const navigation = useNavigation<NavigationProp>();

  const [query, setQuery] = useState('');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [searching, setSearching] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const runSearch = useCallback(async (q: string) => {
    setSearching(true);
    try {
      const results = await searchCustomers(q);
      setCustomers(results);
    } finally {
      setSearching(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    searchCustomers('').then((results) => {
      setCustomers(results);
      setInitialLoading(false);
    });
  }, []);

  // Debounced search on query change
  useEffect(() => {
    if (initialLoading) return;

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      runSearch(query);
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, initialLoading, runSearch]);

  const renderItem = ({ item }: { item: Customer }) => {
    const isWalkin = item.type === 'WALKIN';
    return (
      <TouchableOpacity
        style={styles.row}
        onPress={() => navigation.navigate('CustomerDetail', { customerId: item.id })}
        activeOpacity={0.7}
      >
        <View style={styles.rowContent}>
          <Text style={styles.customerName}>{item.name}</Text>
          {!isWalkin && item.phone ? (
            <Text style={styles.customerPhone}>{item.phone}</Text>
          ) : null}
        </View>
        {isWalkin && <AppBadge label="Walk-in" variant="neutral" />}
      </TouchableOpacity>
    );
  };

  return (
    <ScreenWrapper>
      <LoadingOverlay visible={initialLoading} />

      <View style={styles.searchContainer}>
        <AppInput
          placeholder="Search by name or phone..."
          value={query}
          onChangeText={setQuery}
          autoCapitalize="none"
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

      <FlatList
        data={customers}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          !initialLoading ? (
            <EmptyState
              title="No Customers Found"
              subtitle={query ? 'Try a different search term.' : 'No customers yet.'}
            />
          ) : null
        }
      />

      {canCreate && (
        <View style={styles.fabContainer}>
          <AppButton
            label="New Customer"
            onPress={() => navigation.navigate('CustomerForm', {})}
          />
        </View>
      )}
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  searchContainer: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  searchIndicator: {
    marginTop: Spacing.xs,
    alignSelf: 'flex-end',
  },
  listContainer: {
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
  fabContainer: {
    position: 'absolute',
    bottom: Spacing.xl,
    right: Spacing.md,
    left: Spacing.md,
  },
});
