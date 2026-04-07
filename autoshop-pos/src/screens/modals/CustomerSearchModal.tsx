import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { AppInput } from '@components/common/AppInput';
import { AppButton } from '@components/common/AppButton';
import { AppBadge } from '@components/common/AppBadge';
import { Colors, Spacing, Typography, BorderRadius } from '@constants/theme';
import { searchCustomers, createCustomer } from '@services/customerService';
import { searchVehiclesByPlate } from '@services/vehicleService';
import { database } from '@services/database';
import { Q } from '@nozbe/watermelondb';
import { VehicleModel } from '@models/VehicleModel';
import { useSessionStore } from '@stores/sessionStore';
import type { Customer, Vehicle } from '@/types';

// ─── Module-level callback ref ────────────────────────────────────────────────

let _pendingOnSelect: ((customerId: string, vehicleId?: string) => void) | null = null;

export const setCustomerSearchCallback = (
  cb: (customerId: string, vehicleId?: string) => void
) => {
  _pendingOnSelect = cb;
};

// ─── List item types ──────────────────────────────────────────────────────────

type ListItem =
  | { kind: 'customer'; customer: Customer }
  | { kind: 'vehicle-sub'; vehicle: Vehicle }
  | { kind: 'vehicle-result'; vehicle: Vehicle; customerName: string };

// ─── Modal ────────────────────────────────────────────────────────────────────

export const CustomerSearchModal: React.FC = () => {
  const navigation = useNavigation();
  const user = useSessionStore((s) => s.user);

  const [query, setQuery] = useState('');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [vehicleResults, setVehicleResults] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedCustomerId, setExpandedCustomerId] = useState<string | null>(null);
  const [expandedVehicles, setExpandedVehicles] = useState<Vehicle[]>([]);
  const [showWalkIn, setShowWalkIn] = useState(false);
  const [walkInNickname, setWalkInNickname] = useState('');
  const [walkInLoading, setWalkInLoading] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ─── Search ────────────────────────────────────────────────────────────────

  const runSearch = useCallback(async (q: string) => {
    setLoading(true);
    try {
      const [foundCustomers, foundVehicles] = await Promise.all([
        searchCustomers(q),
        q.trim().length > 0 ? searchVehiclesByPlate(q) : Promise.resolve([]),
      ]);
      setCustomers(foundCustomers);
      setVehicleResults(foundVehicles);
      // Reset expansion when results change
      setExpandedCustomerId(null);
      setExpandedVehicles([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleQueryChange = (text: string) => {
    setQuery(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => runSearch(text), 300);
  };

  useEffect(() => {
    runSearch('');
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [runSearch]);

  // Re-run search on focus (e.g., returning from CustomerForm)
  useFocusEffect(
    useCallback(() => {
      runSearch(query);
    }, [query, runSearch])
  );

  // ─── Customer tap ──────────────────────────────────────────────────────────

  const handleCustomerTap = useCallback(async (customer: Customer) => {
    if (expandedCustomerId === customer.id) {
      setExpandedCustomerId(null);
      setExpandedVehicles([]);
      return;
    }

    const vehicles = await database
      .get<VehicleModel>('vehicles')
      .query(Q.where('customer_id', customer.id))
      .fetch();

    const mapped: Vehicle[] = vehicles.map((v) => ({
      id: v.id,
      customerId: v.customerId,
      make: v.make,
      model: v.model,
      color: v.color,
      plateNumber: v.plateNumber,
      createdAt: v.createdAt,
      createdBy: v.createdBy,
    }));

    if (mapped.length === 0) {
      _pendingOnSelect?.(customer.id);
      _pendingOnSelect = null;
      navigation.goBack();
    } else {
      setExpandedCustomerId(customer.id);
      setExpandedVehicles(mapped);
    }
  }, [expandedCustomerId, navigation]);

  const handleVehicleSubTap = useCallback((vehicle: Vehicle) => {
    _pendingOnSelect?.(vehicle.customerId, vehicle.id);
    _pendingOnSelect = null;
    navigation.goBack();
  }, [navigation]);

  const handleVehicleResultTap = useCallback((vehicle: Vehicle) => {
    _pendingOnSelect?.(vehicle.customerId, vehicle.id);
    _pendingOnSelect = null;
    navigation.goBack();
  }, [navigation]);

  const handleSkipVehicle = useCallback((customerId: string) => {
    _pendingOnSelect?.(customerId);
    _pendingOnSelect = null;
    navigation.goBack();
  }, [navigation]);

  // ─── New Customer ──────────────────────────────────────────────────────────

  const handleNewCustomer = useCallback(() => {
    // Navigate to CustomerForm; on return useFocusEffect will re-query
    // and the caller can wire auto-select via setCustomerSearchCallback
    (navigation as any).navigate('MainTabs', {
      screen: 'Admin',
      params: {
        screen: 'CustomerForm',
        params: { customerId: undefined },
      },
    });
  }, [navigation]);

  // ─── Walk-in ───────────────────────────────────────────────────────────────

  const handleWalkInConfirm = useCallback(async () => {
    const nickname = walkInNickname.trim();
    if (!nickname || !user) return;

    setWalkInLoading(true);
    try {
      const existing = await searchCustomers(nickname);
      const match = existing.find(
        (c) =>
          c.type === 'WALKIN' &&
          c.name.toLowerCase() === nickname.toLowerCase()
      );

      if (match) {
        Alert.alert('Existing Walk-in', `Link to existing record "${match.name}"?`, [
          {
            text: 'Yes',
            onPress: () => {
              _pendingOnSelect?.(match.id);
              _pendingOnSelect = null;
              navigation.goBack();
            },
          },
          {
            text: 'No, New',
            onPress: async () => {
              const created = await createCustomer(
                { type: 'WALKIN', name: nickname },
                user
              );
              _pendingOnSelect?.(created.id);
              _pendingOnSelect = null;
              navigation.goBack();
            },
          },
        ]);
      } else {
        const created = await createCustomer(
          { type: 'WALKIN', name: nickname },
          user
        );
        _pendingOnSelect?.(created.id);
        _pendingOnSelect = null;
        navigation.goBack();
      }
    } finally {
      setWalkInLoading(false);
    }
  }, [walkInNickname, user, navigation]);

  // ─── List data ─────────────────────────────────────────────────────────────

  const listData: ListItem[] = [];
  for (const c of customers) {
    listData.push({ kind: 'customer', customer: c });
    if (expandedCustomerId === c.id) {
      for (const v of expandedVehicles) {
        listData.push({ kind: 'vehicle-sub', vehicle: v });
      }
    }
  }

  // Deduplicate vehicle results: skip if vehicle's customer already appears
  const customerIds = new Set(customers.map((c) => c.id));
  for (const v of vehicleResults) {
    if (!customerIds.has(v.customerId)) {
      const ownerName = customers.find((c) => c.id === v.customerId)?.name ?? '';
      listData.push({ kind: 'vehicle-result', vehicle: v, customerName: ownerName });
    }
  }

  // ─── Render ────────────────────────────────────────────────────────────────

  const renderItem = ({ item }: { item: ListItem }) => {
    if (item.kind === 'customer') {
      const { customer } = item;
      const isExpanded = expandedCustomerId === customer.id;
      return (
        <TouchableOpacity
          style={styles.customerRow}
          onPress={() => handleCustomerTap(customer)}
          activeOpacity={0.7}
        >
          <View style={styles.customerRowMain}>
            <Text style={styles.customerName} numberOfLines={1}>
              {customer.name}
            </Text>
            <View style={styles.rowRight}>
              <AppBadge
                label={customer.type === 'NAMED' ? 'Named' : 'Walk-in'}
                variant={customer.type === 'NAMED' ? 'primary' : 'neutral'}
              />
              {customer.phone ? (
                <Text style={styles.phone}>{customer.phone}</Text>
              ) : null}
            </View>
          </View>
          {isExpanded && (
            <TouchableOpacity
              style={styles.skipVehicleBtn}
              onPress={() => handleSkipVehicle(customer.id)}
            >
              <Text style={styles.skipVehicleText}>Select without vehicle</Text>
            </TouchableOpacity>
          )}
        </TouchableOpacity>
      );
    }

    if (item.kind === 'vehicle-sub') {
      const { vehicle } = item;
      return (
        <TouchableOpacity
          style={styles.vehicleSubRow}
          onPress={() => handleVehicleSubTap(vehicle)}
          activeOpacity={0.7}
        >
          <Text style={styles.vehicleSubArrow}>↳</Text>
          <Text style={styles.vehicleSubText}>
            {vehicle.plateNumber}
            {vehicle.make ? ` — ${vehicle.make}${vehicle.model ? ` ${vehicle.model}` : ''}` : ''}
          </Text>
        </TouchableOpacity>
      );
    }

    if (item.kind === 'vehicle-result') {
      const { vehicle, customerName } = item;
      return (
        <TouchableOpacity
          style={styles.vehicleResultRow}
          onPress={() => handleVehicleResultTap(vehicle)}
          activeOpacity={0.7}
        >
          <Text style={styles.vehicleResultPlate}>{vehicle.plateNumber}</Text>
          <Text style={styles.vehicleResultDetail}>
            {vehicle.make}
            {vehicle.model ? ` ${vehicle.model}` : ''}
            {customerName ? ` · ${customerName}` : ''}
          </Text>
        </TouchableOpacity>
      );
    }

    return null;
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Select Customer</Text>
      </View>

      {/* Search bar */}
      <View style={styles.searchBar}>
        <AppInput
          placeholder="Search by name, phone, or plate…"
          value={query}
          onChangeText={handleQueryChange}
          autoFocus
          autoCapitalize="none"
        />
      </View>

      {/* Action buttons */}
      <View style={styles.actions}>
        <AppButton
          label="Walk-in"
          variant="secondary"
          onPress={() => {
            setShowWalkIn((v) => !v);
            setWalkInNickname('');
          }}
          style={styles.actionBtn}
        />
        <AppButton
          label="New Customer"
          variant="secondary"
          onPress={handleNewCustomer}
          style={styles.actionBtn}
        />
      </View>

      {/* Walk-in inline input */}
      {showWalkIn && (
        <View style={styles.walkInBox}>
          <AppInput
            placeholder="Nickname / Walk-in label"
            value={walkInNickname}
            onChangeText={setWalkInNickname}
            autoFocus
          />
          <AppButton
            label={walkInLoading ? 'Saving…' : 'Confirm'}
            onPress={handleWalkInConfirm}
            disabled={walkInLoading || walkInNickname.trim().length === 0}
            style={styles.walkInConfirmBtn}
          />
        </View>
      )}

      {/* Results */}
      {loading ? (
        <ActivityIndicator
          style={styles.loader}
          color={Colors.primary}
          size="large"
        />
      ) : (
        <FlatList
          data={listData}
          keyExtractor={(item, idx) =>
            item.kind === 'customer'
              ? `c-${item.customer.id}`
              : item.kind === 'vehicle-sub'
              ? `vs-${item.vehicle.id}`
              : `vr-${item.vehicle.id}-${idx}`
          }
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No results found</Text>
          }
        />
      )}

      {/* Cancel */}
      <View style={styles.footer}>
        <AppButton
          label="Cancel"
          variant="secondary"
          onPress={() => navigation.goBack()}
        />
      </View>
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingTop: Spacing.xl,
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: {
    fontSize: Typography.xl,
    fontWeight: Typography.semiBold,
    color: Colors.black,
  },
  searchBar: {
    padding: Spacing.md,
    backgroundColor: Colors.surface,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  actionBtn: {
    flex: 1,
  },
  walkInBox: {
    padding: Spacing.md,
    gap: Spacing.sm,
    backgroundColor: Colors.primaryLight,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  walkInConfirmBtn: {
    alignSelf: 'flex-end',
  },
  loader: {
    marginTop: Spacing.xxl,
  },
  listContent: {
    paddingBottom: Spacing.xl,
  },
  // Customer row
  customerRow: {
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  customerRowMain: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  customerName: {
    flex: 1,
    fontSize: Typography.base,
    fontWeight: Typography.medium,
    color: Colors.black,
  },
  rowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  phone: {
    fontSize: Typography.sm,
    color: Colors.gray500,
  },
  skipVehicleBtn: {
    marginTop: Spacing.sm,
    alignSelf: 'flex-start',
  },
  skipVehicleText: {
    fontSize: Typography.sm,
    color: Colors.primary,
    fontWeight: Typography.medium,
  },
  // Vehicle sub-row (expanded under customer)
  vehicleSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.gray100,
    paddingVertical: Spacing.sm,
    paddingLeft: Spacing.xl,
    paddingRight: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  vehicleSubArrow: {
    fontSize: Typography.base,
    color: Colors.gray500,
  },
  vehicleSubText: {
    fontSize: Typography.sm,
    color: Colors.gray700,
  },
  // Vehicle result row (from plate search)
  vehicleResultRow: {
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
  },
  vehicleResultPlate: {
    fontSize: Typography.base,
    fontWeight: Typography.semiBold,
    color: Colors.black,
  },
  vehicleResultDetail: {
    fontSize: Typography.sm,
    color: Colors.gray500,
    marginTop: 2,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: Spacing.xxl,
    fontSize: Typography.base,
    color: Colors.gray500,
  },
  footer: {
    padding: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.surface,
  },
});
