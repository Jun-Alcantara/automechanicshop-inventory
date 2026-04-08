import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Modal,
  Pressable,
  StyleSheet,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { ScreenWrapper } from '@components/layout/ScreenWrapper';
import { AppInput } from '@components/common/AppInput';
import { EmptyState } from '@components/common/EmptyState';
import { LoadingOverlay } from '@components/common/LoadingOverlay';
import { ProductCard } from '@components/inventory/ProductCard';
import { useInventoryStore } from '@stores/inventoryStore';
import { useHasPermission } from '@hooks/useHasPermission';
import { formatPHP } from '@utils/formatCurrency';
import { setBarcodeCallback } from '@screens/modals/BarcodeScannerModal';
import { Colors, Spacing, Typography, BorderRadius } from '@constants/theme';
import type { InventoryStackScreenProps } from '@navigation/types';
import type { Product, ServiceItem } from '@/types';

type Props = InventoryStackScreenProps<'InventoryList'>;

type Tab = 'products' | 'services';

export const InventoryListScreen: React.FC<Props> = ({ navigation }) => {
  const { products, serviceItems, loading, subscribe, unsubscribe } = useInventoryStore();
  const canManage = useHasPermission('MANAGE_INVENTORY');
  const [activeTab, setActiveTab] = useState<Tab>('products');
  const [query, setQuery] = useState('');
  const [showManageMenu, setShowManageMenu] = useState(false);

  const handleScanBarcode = () => {
    setBarcodeCallback((barcode) => setQuery(barcode));
    (navigation as any).navigate('BarcodeScanner');
  };

  useFocusEffect(
    useCallback(() => {
      subscribe();
      return () => {
        // keep subscription alive across tab switches; unsubscribe on unmount
      };
    }, [subscribe])
  );

  useEffect(() => {
    return () => {
      unsubscribe();
    };
  }, [unsubscribe]);

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(query.toLowerCase()) ||
      p.barcode?.includes(query)
  );

  const filteredServices = serviceItems.filter((s) =>
    s.name.toLowerCase().includes(query.toLowerCase())
  );

  const renderProduct = ({ item }: { item: Product }) => (
    <ProductCard
      product={item}
      onPress={() => {
        if (canManage) {
          navigation.navigate('ProductForm', { productId: item.id });
        }
      }}
    />
  );

  const renderServiceItem = ({ item }: { item: ServiceItem }) => (
    <TouchableOpacity
      style={styles.serviceRow}
      onPress={() => {
        if (canManage) {
          navigation.navigate('ServiceForm', { serviceId: item.id });
        }
      }}
      activeOpacity={canManage ? 0.7 : 1}
    >
      <Text style={styles.serviceName}>{item.name}</Text>
      <Text style={styles.servicePrice}>{formatPHP(item.basePrice)}</Text>
    </TouchableOpacity>
  );

  return (
    <ScreenWrapper noHeader>
      {/* Tab Bar */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'products' && styles.tabActive]}
          onPress={() => {
            setActiveTab('products');
            setQuery('');
          }}
        >
          <Text style={[styles.tabLabel, activeTab === 'products' && styles.tabLabelActive]}>
            Products
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'services' && styles.tabActive]}
          onPress={() => {
            setActiveTab('services');
            setQuery('');
          }}
        >
          <Text style={[styles.tabLabel, activeTab === 'services' && styles.tabLabelActive]}>
            Services
          </Text>
        </TouchableOpacity>
        {canManage && (
          <TouchableOpacity
            style={styles.manageButton}
            onPress={() => setShowManageMenu(true)}
            activeOpacity={0.7}
          >
            <Text style={styles.manageButtonLabel}>⚙</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Manage Menu */}
      <Modal
        visible={showManageMenu}
        transparent
        animationType="fade"
        onRequestClose={() => setShowManageMenu(false)}
      >
        <Pressable style={styles.menuOverlay} onPress={() => setShowManageMenu(false)}>
          <View style={styles.menuCard}>
            <Text style={styles.menuTitle}>Manage</Text>
            {[
              { label: 'Categories', route: 'CategoryList' as const },
              { label: 'Suppliers', route: 'SupplierList' as const },
              { label: 'Add-on Catalog', route: 'AddOnCatalog' as const },
            ].map(({ label, route }, index, arr) => (
              <TouchableOpacity
                key={route}
                style={[styles.menuItem, index < arr.length - 1 && styles.menuItemBorder]}
                onPress={() => {
                  setShowManageMenu(false);
                  navigation.navigate(route);
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.menuItemLabel}>{label}</Text>
                <Text style={styles.menuItemArrow}>›</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Pressable>
      </Modal>

      {/* Products Tab */}
      {activeTab === 'products' && (
        <View style={styles.content}>
          <View style={styles.searchRow}>
            <AppInput
              placeholder="Search by name or barcode…"
              value={query}
              onChangeText={setQuery}
              containerStyle={styles.searchInput}
            />
            <TouchableOpacity style={styles.scanButton} onPress={handleScanBarcode} activeOpacity={0.7}>
              <Text style={styles.scanButtonText}>Scan</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={filteredProducts}
            keyExtractor={(item) => item.id}
            renderItem={renderProduct}
            contentContainerStyle={[
              styles.list,
              filteredProducts.length === 0 && styles.listEmpty,
            ]}
            ListEmptyComponent={
              query
                ? <EmptyState title="No products found" subtitle="Try a different name or barcode." />
                : <EmptyState title="No products found" />
            }
          />
        </View>
      )}

      {/* Services Tab */}
      {activeTab === 'services' && (
        <View style={styles.content}>
          <AppInput
            placeholder="Search by name…"
            value={query}
            onChangeText={setQuery}
            containerStyle={styles.serviceSearch}
          />
          <FlatList
            data={filteredServices}
            keyExtractor={(item) => item.id}
            renderItem={renderServiceItem}
            contentContainerStyle={[
              styles.list,
              filteredServices.length === 0 && styles.listEmpty,
            ]}
            ListEmptyComponent={
              query
                ? <EmptyState title="No services found" subtitle="Try a different name." />
                : <EmptyState title="No service items found" />
            }
          />
        </View>
      )}

      {/* FAB */}
      {canManage && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => {
            if (activeTab === 'products') {
              navigation.navigate('ProductForm', {});
            } else {
              navigation.navigate('ServiceForm', {});
            }
          }}
          activeOpacity={0.8}
        >
          <Text style={styles.fabLabel}>
            {activeTab === 'products' ? '+ New Product' : '+ New Service'}
          </Text>
        </TouchableOpacity>
      )}

      <LoadingOverlay visible={loading} />
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing.sm + 2,
    alignItems: 'center',
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: Colors.primary,
  },
  tabLabel: {
    fontSize: Typography.base,
    color: Colors.gray500,
    fontWeight: '500',
  },
  tabLabelActive: {
    color: Colors.primary,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: Spacing.md,
    gap: Spacing.sm,
  },
  searchInput: {
    flex: 1,
  },
  scanButton: {
    height: 44,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanButtonText: {
    color: Colors.white,
    fontSize: Typography.sm,
    fontWeight: '600',
  },
  serviceSearch: {
    margin: Spacing.md,
  },
  list: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.xl * 4,
  },
  listEmpty: {
    flex: 1,
  },
  serviceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  serviceName: {
    flex: 1,
    fontSize: Typography.base,
    color: Colors.black,
    marginRight: Spacing.sm,
  },
  servicePrice: {
    fontSize: Typography.base,
    fontWeight: '600',
    color: Colors.primary,
  },
  fab: {
    position: 'absolute',
    bottom: Spacing.xl,
    right: Spacing.xl,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.sm + 2,
    paddingHorizontal: Spacing.lg,
    elevation: 4,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  fabLabel: {
    color: Colors.white,
    fontSize: Typography.base,
    fontWeight: '600',
  },
  manageButton: {
    paddingHorizontal: Spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  manageButtonLabel: {
    fontSize: Typography.lg,
    color: Colors.gray500,
  },
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: 8,
    paddingRight: Spacing.md,
  },
  menuCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    minWidth: 180,
    elevation: 6,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    overflow: 'hidden',
  },
  menuTitle: {
    fontSize: Typography.sm,
    fontWeight: '700',
    color: Colors.gray500,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
  },
  menuItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  menuItemLabel: {
    fontSize: Typography.base,
    color: Colors.black,
  },
  menuItemArrow: {
    fontSize: Typography.lg,
    color: Colors.gray500,
    marginLeft: Spacing.sm,
  },
});
