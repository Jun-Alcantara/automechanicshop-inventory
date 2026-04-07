import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useTransactionDraftStore } from '@stores/transactionDraftStore';
import { useInventoryStore } from '@stores/inventoryStore';
import { useSessionStore } from '@stores/sessionStore';
import { useHasPermission } from '@hooks/useHasPermission';
import { ScreenWrapper } from '@components/layout/ScreenWrapper';
import { AppButton } from '@components/common/AppButton';
import { EmptyState } from '@components/common/EmptyState';
import { LineItemRow } from '@components/transaction/LineItemRow';
import { setBarcodeCallback } from '@screens/modals/BarcodeScannerModal';
import { setDiscountCallback, DiscountPayload } from '@screens/modals/DiscountPickerModal';
import { setAddOnCallback, AddOnPayload } from '@screens/modals/AddOnPickerModal';
import { cancelTransaction } from '@services/transactionService';
import { database } from '@services/database';
import { CustomerModel } from '../../models/CustomerModel';
import { VehicleModel } from '../../models/VehicleModel';
import { calculateTransactionTotals } from '@utils/calculateTransaction';
import { formatPHP } from '@utils/formatCurrency';
import { showNegativeStockWarning, showUnknownBarcodeAlert } from '@utils/transactionAlerts';
import { PERMISSIONS } from '@constants/permissions';
import { Colors, Spacing, Typography, BorderRadius } from '@constants/theme';
import type { Product, ServiceItem, LineItem } from '../../types';
import type { TransactionsStackScreenProps } from '@navigation/types';

type Props = TransactionsStackScreenProps<'TransactionDetail'>;

export const TransactionDetailScreen: React.FC<Props> = ({ route, navigation }) => {
  const { transactionId } = route.params;

  const { draft, lineItems, loading, openDraft, clearDraft } = useTransactionDraftStore();
  const { products, serviceItems } = useInventoryStore();
  const user = useSessionStore((s) => s.user);

  const canCreate = useHasPermission(PERMISSIONS.CREATE_TRANSACTIONS);
  const canDiscount = useHasPermission(PERMISSIONS.APPLY_DISCOUNTS);
  const canCancel = useHasPermission(PERMISSIONS.CANCEL_TRANSACTIONS);

  // ─── Customer / vehicle header ───────────────────────────────────────────

  const [customerName, setCustomerName] = useState<string | null>(null);
  const [customerType, setCustomerType] = useState<'NAMED' | 'WALKIN' | null>(null);
  const [vehiclePlate, setVehiclePlate] = useState<string | null>(null);

  // ─── Item search ─────────────────────────────────────────────────────────

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<(Product | ServiceItem)[]>([]);
  const [showResults, setShowResults] = useState(false);

  // ─── Draft lifecycle ──────────────────────────────────────────────────────

  useEffect(() => {
    openDraft(transactionId);
    return () => clearDraft();
  }, [transactionId]);

  // ─── Resolve customer + vehicle ───────────────────────────────────────────

  useEffect(() => {
    if (!draft) return;

    const resolve = async () => {
      if (draft.customerId) {
        try {
          const c = await database.get<CustomerModel>('customers').find(draft.customerId);
          setCustomerName(c.name);
          setCustomerType(c.type);
        } catch {
          // customer not found
        }
      }
      if (draft.vehicleId) {
        try {
          const v = await database.get<VehicleModel>('vehicles').find(draft.vehicleId);
          setVehiclePlate(v.plateNumber);
        } catch {
          // vehicle not found
        }
      }
    };

    resolve();
  }, [draft?.customerId, draft?.vehicleId]);

  // ─── Search filter ────────────────────────────────────────────────────────

  useEffect(() => {
    if (searchQuery.trim().length === 0) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }
    const q = searchQuery.toLowerCase();
    const matched: (Product | ServiceItem)[] = [
      ...products.filter(
        (p) => p.name.toLowerCase().includes(q) || p.barcode?.includes(q)
      ),
      ...serviceItems.filter((s) => s.name.toLowerCase().includes(q)),
    ];
    setSearchResults(matched);
    setShowResults(true);
  }, [searchQuery, products, serviceItems]);

  // ─── Handlers ─────────────────────────────────────────────────────────────

  const handleAddItem = async (item: Product | ServiceItem) => {
    if (!user) return;
    if ('stockAvailable' in item && item.stockAvailable === 0) {
      const confirmed = await showNegativeStockWarning();
      if (!confirmed) return;
    }
    await useTransactionDraftStore
      .getState()
      .addLineItem(transactionId, item, 1, user);
    setSearchQuery('');
    setShowResults(false);
  };

  const handleBarcodeScan = () => {
    setBarcodeCallback((scannedCode: string) => {
      const found = products.find((p) => p.barcode === scannedCode);
      if (!found) {
        showUnknownBarcodeAlert(scannedCode);
        return;
      }
      handleAddItem(found);
    });
    navigation.navigate('BarcodeScanner');
  };

  const handleQtyChange = (lineItem: LineItem, newQty: number) => {
    if (!user) return;
    if (newQty <= 0) {
      handleRemoveItem(lineItem.id);
    } else {
      useTransactionDraftStore
        .getState()
        .updateLineItemQty(lineItem.id, transactionId, newQty, user);
    }
  };

  const handleDiscount = (lineItem: LineItem) => {
    if (!user) return;
    setDiscountCallback((payload: DiscountPayload) => {
      if (!payload) {
        useTransactionDraftStore
          .getState()
          .removeDiscount(lineItem.id, transactionId, user);
      } else {
        useTransactionDraftStore
          .getState()
          .applyDiscount(lineItem.id, transactionId, payload.type, payload.value, user);
      }
    });
    navigation.navigate('DiscountPicker', {
      currentDiscountType: (lineItem.discountType as 'FIXED' | 'PERCENTAGE') || undefined,
      currentDiscountValue: lineItem.discountValue || undefined,
    });
  };

  const handleAddOn = (lineItem: LineItem) => {
    if (!user) return;
    setAddOnCallback((payload: AddOnPayload) => {
      useTransactionDraftStore.getState().applyAddOn(
        lineItem.id,
        transactionId,
        {
          addOnId: payload.addOnId ?? '',
          name: payload.name,
          amount: payload.amount,
          isOnTheFly: payload.isOnTheFly,
        },
        user
      );
    });
    navigation.navigate('AddOnPicker');
  };

  const handleRemoveItem = (lineItemId: string) => {
    if (!user) return;
    Alert.alert(
      'Remove Item',
      'Remove this item from the transaction?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () =>
            useTransactionDraftStore
              .getState()
              .removeLineItem(lineItemId, transactionId, user),
        },
      ]
    );
  };

  const handleCancelTransaction = () => {
    if (!user) return;
    Alert.alert(
      'Cancel Transaction',
      'Are you sure you want to cancel this transaction? This cannot be undone.',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            await cancelTransaction(transactionId, user);
            navigation.goBack();
          },
        },
      ]
    );
  };

  // ─── Derived data ─────────────────────────────────────────────────────────

  const totals = calculateTransactionTotals(lineItems);

  const headerLabel = (() => {
    if (customerName && customerType === 'NAMED') {
      return vehiclePlate ? `${customerName} — ${vehiclePlate}` : customerName;
    }
    if (customerName && customerType === 'WALKIN') {
      return `Walk-in: ${customerName}`;
    }
    return 'Walk-in';
  })();

  // ─── Render line item ──────────────────────────────────────────────────────

  const renderLineItem = ({ item }: { item: LineItem }) => (
    <View style={styles.lineItemWrapper}>
      <LineItemRow item={item} />

      <View style={styles.lineItemControls}>
        {/* Qty stepper */}
        <View style={styles.qtyStepper}>
          <TouchableOpacity
            style={styles.stepperBtn}
            onPress={() => handleQtyChange(item, item.quantity - 1)}
          >
            <Text style={styles.stepperBtnText}>−</Text>
          </TouchableOpacity>
          <TextInput
            style={styles.qtyInput}
            value={String(item.quantity)}
            keyboardType="numeric"
            onChangeText={(val) => {
              const n = parseInt(val, 10);
              if (!isNaN(n)) handleQtyChange(item, n);
            }}
          />
          <TouchableOpacity
            style={styles.stepperBtn}
            onPress={() => handleQtyChange(item, item.quantity + 1)}
          >
            <Text style={styles.stepperBtnText}>+</Text>
          </TouchableOpacity>
        </View>

        {/* Action chips */}
        <View style={styles.lineItemActions}>
          {canDiscount && (
            <TouchableOpacity
              style={styles.actionChip}
              onPress={() => handleDiscount(item)}
            >
              <Text style={styles.actionChipText}>
                {item.discountType ? 'Edit Discount' : 'Discount'}
              </Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.actionChip}
            onPress={() => handleAddOn(item)}
          >
            <Text style={styles.actionChipText}>Add-On</Text>
          </TouchableOpacity>
          {canCancel && (
            <TouchableOpacity
              style={[styles.actionChip, styles.actionChipDanger]}
              onPress={() => handleRemoveItem(item.id)}
            >
              <Text style={[styles.actionChipText, styles.actionChipTextDanger]}>
                Remove
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );

  // ─── Loading state ────────────────────────────────────────────────────────

  if (loading) {
    return (
      <ScreenWrapper>
        <ActivityIndicator style={styles.loader} color={Colors.primary} />
      </ScreenWrapper>
    );
  }

  // ─── Main render ──────────────────────────────────────────────────────────

  return (
    <ScreenWrapper>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Section 1: Header */}
        <View style={styles.header}>
          <Text style={styles.headerLabel} numberOfLines={1}>
            {headerLabel}
          </Text>
          <Text style={styles.transactionId}>
            #{transactionId.slice(-8).toUpperCase()}
          </Text>
        </View>

        {/* Section 2: Item search bar */}
        {canCreate && (
          <View style={styles.searchSection}>
            <View style={styles.searchRow}>
              <TextInput
                style={styles.searchInput}
                placeholder="Search products or services…"
                placeholderTextColor={Colors.gray500}
                value={searchQuery}
                onChangeText={setSearchQuery}
                onBlur={() => {
                  setTimeout(() => setShowResults(false), 150);
                }}
              />
              <TouchableOpacity
                style={styles.barcodeBtn}
                onPress={handleBarcodeScan}
              >
                <Text style={styles.barcodeBtnText}>⬛</Text>
              </TouchableOpacity>
            </View>

            {showResults && searchResults.length > 0 && (
              <View style={styles.resultsDropdown}>
                <FlatList
                  data={searchResults}
                  keyExtractor={(item) => item.id}
                  keyboardShouldPersistTaps="handled"
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={styles.resultRow}
                      onPress={() => handleAddItem(item)}
                    >
                      <Text style={styles.resultName}>{item.name}</Text>
                      <Text style={styles.resultPrice}>
                        {formatPHP(
                          'sellingPrice' in item ? item.sellingPrice : item.basePrice
                        )}
                      </Text>
                    </TouchableOpacity>
                  )}
                  ItemSeparatorComponent={() => (
                    <View style={styles.resultSeparator} />
                  )}
                />
              </View>
            )}
          </View>
        )}

        {/* Section 3: Line items */}
        <FlatList
          data={lineItems}
          keyExtractor={(item) => item.id}
          renderItem={renderLineItem}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <EmptyState
              title="No Items Added"
              subtitle="No items added yet. Search for products or services above."
            />
          }
          style={styles.flex}
          keyboardShouldPersistTaps="handled"
        />

        {/* Section 4: Totals + action bar */}
        <View style={styles.footer}>
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

          <View style={styles.actionButtons}>
            {canCancel && (
              <AppButton
                label="Cancel Transaction"
                variant="danger"
                onPress={handleCancelTransaction}
                fullWidth
              />
            )}
            <AppButton
              label="Proceed to Payment"
              onPress={() => navigation.navigate('Payment', { transactionId })}
              disabled={lineItems.length === 0}
              fullWidth
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </ScreenWrapper>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  flex: { flex: 1 },
  loader: { marginTop: Spacing.xxl },

  // Header
  header: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerLabel: {
    fontSize: Typography.lg,
    fontWeight: Typography.semiBold,
    color: Colors.black,
  },
  transactionId: {
    fontSize: Typography.sm,
    color: Colors.gray500,
    marginTop: 2,
  },

  // Search
  searchSection: {
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    zIndex: 10,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.sm,
    fontSize: Typography.base,
    color: Colors.black,
    backgroundColor: Colors.background,
  },
  barcodeBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
  },
  barcodeBtnText: {
    fontSize: Typography.lg,
    color: Colors.white,
  },

  // Search results dropdown
  resultsDropdown: {
    position: 'absolute',
    top: 56,
    left: Spacing.md,
    right: Spacing.md,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    maxHeight: 240,
    zIndex: 20,
    elevation: 4,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  resultName: {
    flex: 1,
    fontSize: Typography.base,
    color: Colors.black,
    marginRight: Spacing.sm,
  },
  resultPrice: {
    fontSize: Typography.base,
    fontWeight: Typography.medium,
    color: Colors.gray700,
  },
  resultSeparator: {
    height: 1,
    backgroundColor: Colors.border,
  },

  // Line items list
  listContent: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.sm,
  },
  lineItemWrapper: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xs,
  },
  lineItemControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.xs,
    paddingTop: Spacing.xs,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },

  // Qty stepper
  qtyStepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  stepperBtn: {
    width: 30,
    height: 30,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.gray100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepperBtnText: {
    fontSize: Typography.lg,
    color: Colors.black,
    lineHeight: 22,
  },
  qtyInput: {
    width: 44,
    height: 30,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.sm,
    textAlign: 'center',
    fontSize: Typography.base,
    color: Colors.black,
    paddingVertical: 0,
  },

  // Action chips
  lineItemActions: {
    flexDirection: 'row',
    gap: Spacing.xs,
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
  },
  actionChip: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    backgroundColor: Colors.primaryLight,
    borderRadius: BorderRadius.full,
  },
  actionChipText: {
    fontSize: Typography.xs,
    color: Colors.primary,
    fontWeight: Typography.medium,
  },
  actionChipDanger: {
    backgroundColor: Colors.dangerLight,
  },
  actionChipTextDanger: {
    color: Colors.danger,
  },

  // Footer totals + actions
  footer: {
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.md,
  },
  totalsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
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
    marginBottom: Spacing.sm,
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
  actionButtons: {
    gap: Spacing.sm,
  },
});
