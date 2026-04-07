import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
  FlatList,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';

import { ScreenWrapper } from '@components/layout/ScreenWrapper';
import { AppInput } from '@components/common/AppInput';
import { AppButton } from '@components/common/AppButton';
import { usePermissionGuard } from '@hooks/usePermissionGuard';
import { useSessionStore } from '@stores/sessionStore';
import { useCatalogStore } from '@stores/catalogStore';
import {
  getProductById,
  getProductByBarcode,
  createProduct,
  updateProduct,
  deactivateProduct,
} from '@services/productService';
import { VAT_TYPES, VAT_LABELS } from '@constants/vatTypes';
import type { VatType } from '@constants/vatTypes';
import { Colors, Spacing, Typography, BorderRadius } from '@constants/theme';
import { setBarcodeCallback } from '@screens/modals/BarcodeScannerModal';
import type { InventoryStackParamList } from '@navigation/types';
import type { Category, Supplier } from '@/types';

type ProductFormRouteProp = RouteProp<InventoryStackParamList, 'ProductForm'>;
type ProductFormNavigationProp = StackNavigationProp<InventoryStackParamList, 'ProductForm'>;

// ─── Inline Picker ────────────────────────────────────────────────────────────

type PickerOption = { label: string; value: string };

interface InlinePickerProps {
  label: string;
  value: string;
  placeholder: string;
  options: PickerOption[];
  onSelect: (value: string) => void;
}

const InlinePicker: React.FC<InlinePickerProps> = ({
  label,
  value,
  placeholder,
  options,
  onSelect,
}) => {
  const [visible, setVisible] = useState(false);
  const selectedLabel = options.find((o) => o.value === value)?.label ?? '';

  return (
    <View>
      {label ? <Text style={pickerStyles.label}>{label}</Text> : null}
      <TouchableOpacity
        style={pickerStyles.trigger}
        onPress={() => setVisible(true)}
        activeOpacity={0.7}
      >
        <Text style={[pickerStyles.triggerText, !selectedLabel && pickerStyles.placeholder]}>
          {selectedLabel || placeholder}
        </Text>
        <Text style={pickerStyles.chevron}>▾</Text>
      </TouchableOpacity>
      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={() => setVisible(false)}
      >
        <TouchableOpacity
          style={pickerStyles.backdrop}
          onPress={() => setVisible(false)}
          activeOpacity={1}
        >
          <View style={pickerStyles.sheet}>
            <Text style={pickerStyles.sheetTitle}>{label}</Text>
            <FlatList
              data={[{ label: '— None —', value: '' }, ...options]}
              keyExtractor={(item) => item.value || '__none__'}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    pickerStyles.option,
                    item.value === value && pickerStyles.optionSelected,
                  ]}
                  onPress={() => {
                    onSelect(item.value);
                    setVisible(false);
                  }}
                >
                  <Text
                    style={[
                      pickerStyles.optionText,
                      item.value === value && pickerStyles.optionTextSelected,
                    ]}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const pickerStyles = StyleSheet.create({
  label: {
    fontSize: Typography.sm,
    fontWeight: Typography.medium,
    color: Colors.gray700,
    marginBottom: Spacing.xs,
  },
  trigger: {
    height: 44,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  triggerText: {
    fontSize: Typography.base,
    color: Colors.black,
    flex: 1,
  },
  placeholder: {
    color: Colors.gray300,
  },
  chevron: {
    fontSize: Typography.base,
    color: Colors.gray500,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  sheet: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    width: '100%',
    maxHeight: 360,
    paddingVertical: Spacing.sm,
  },
  sheetTitle: {
    fontSize: Typography.base,
    fontWeight: Typography.semiBold,
    color: Colors.gray900,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    marginBottom: Spacing.xs,
  },
  option: {
    paddingVertical: Spacing.sm + 2,
    paddingHorizontal: Spacing.md,
  },
  optionSelected: {
    backgroundColor: Colors.primaryLight,
  },
  optionText: {
    fontSize: Typography.base,
    color: Colors.gray900,
  },
  optionTextSelected: {
    color: Colors.primary,
    fontWeight: Typography.semiBold,
  },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────

type Errors = {
  name?: string;
  sellingPrice?: string;
  costPrice?: string;
  unitOfMeasure?: string;
  stockAvailable?: string;
};

const VAT_OPTIONS: PickerOption[] = [
  { label: VAT_LABELS[VAT_TYPES.NO_VAT], value: VAT_TYPES.NO_VAT },
  { label: VAT_LABELS[VAT_TYPES.VAT_EXCLUSIVE], value: VAT_TYPES.VAT_EXCLUSIVE },
  { label: VAT_LABELS[VAT_TYPES.VAT_INCLUSIVE], value: VAT_TYPES.VAT_INCLUSIVE },
];

export const ProductFormScreen: React.FC = () => {
  const isAuthorized = usePermissionGuard('MANAGE_INVENTORY');
  const route = useRoute<ProductFormRouteProp>();
  const navigation = useNavigation<ProductFormNavigationProp>();
  const { productId } = route.params || {};
  const isEditMode = !!productId;

  const currentUser = useSessionStore((s) => s.user);
  const { categories, suppliers } = useCatalogStore();

  const [isLoading, setIsLoading] = useState(isEditMode);
  const [isSaving, setIsSaving] = useState(false);

  // Form fields
  const [name, setName] = useState('');
  const [barcode, setBarcode] = useState('');
  const [sellingPrice, setSellingPrice] = useState('');
  const [costPrice, setCostPrice] = useState('');
  const [unitOfMeasure, setUnitOfMeasure] = useState('');
  const [stockAvailable, setStockAvailable] = useState('');
  const [lowStockThreshold, setLowStockThreshold] = useState('0');
  const [categoryId, setCategoryId] = useState('');
  const [supplierId, setSupplierId] = useState('');
  const [vatType, setVatType] = useState<VatType>(VAT_TYPES.NO_VAT);

  const [errors, setErrors] = useState<Errors>({});

  useEffect(() => {
    if (isEditMode && productId) {
      loadProduct(productId);
    }
  }, [isEditMode, productId]);

  const loadProduct = async (id: string) => {
    try {
      setIsLoading(true);
      const product = await getProductById(id);
      if (!product) {
        Alert.alert('Error', 'Product not found.');
        navigation.goBack();
        return;
      }
      setName(product.name);
      setBarcode(product.barcode ?? '');
      setSellingPrice(String(product.sellingPrice));
      setCostPrice(String(product.costPrice));
      setUnitOfMeasure(product.unitOfMeasure);
      setStockAvailable(String(product.stockAvailable));
      setLowStockThreshold(String(product.lowStockThreshold));
      setCategoryId(product.categoryId ?? '');
      setSupplierId(product.supplierId ?? '');
      setVatType((product as any).vatType ?? VAT_TYPES.NO_VAT);
    } catch {
      Alert.alert('Error', 'Failed to load product.');
      navigation.goBack();
    } finally {
      setIsLoading(false);
    }
  };

  const handleScanBarcode = () => {
    setBarcodeCallback((scannedBarcode) => setBarcode(scannedBarcode));
    (navigation as any).navigate('BarcodeScanner');
  };

  const checkDuplicateBarcode = async (value: string): Promise<boolean> => {
    if (!value.trim()) return false;
    const existing = await getProductByBarcode(value.trim());
    if (existing && existing.id !== productId) {
      Alert.alert('Duplicate Barcode', 'A product with this barcode already exists.');
      return true;
    }
    return false;
  };

  const validate = (): boolean => {
    const newErrors: Errors = {};

    if (!name.trim()) newErrors.name = 'Name is required.';

    const sp = parseFloat(sellingPrice);
    if (!sellingPrice.trim() || isNaN(sp)) {
      newErrors.sellingPrice = 'Selling price is required.';
    }

    const cp = parseFloat(costPrice);
    if (!costPrice.trim() || isNaN(cp)) {
      newErrors.costPrice = 'Cost price is required.';
    }

    if (!unitOfMeasure.trim()) newErrors.unitOfMeasure = 'Unit of measure is required.';

    if (!isEditMode) {
      const sa = parseFloat(stockAvailable);
      if (!stockAvailable.trim() || isNaN(sa) || sa < 0) {
        newErrors.stockAvailable = 'Stock available is required and must be 0 or more.';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate() || !currentUser) return;

    const isDuplicate = await checkDuplicateBarcode(barcode);
    if (isDuplicate) return;

    try {
      setIsSaving(true);

      const payload = {
        name: name.trim(),
        barcode: barcode.trim(),
        sellingPrice: parseFloat(sellingPrice),
        costPrice: parseFloat(costPrice),
        unitOfMeasure: unitOfMeasure.trim(),
        stockAvailable: parseFloat(stockAvailable) || 0,
        lowStockThreshold: parseFloat(lowStockThreshold) || 0,
        categoryId: categoryId,
        supplierId: supplierId,
        vatType,
      };

      if (isEditMode && productId) {
        await updateProduct(productId, payload, currentUser);
      } else {
        await createProduct(payload, currentUser);
      }

      navigation.goBack();
    } catch {
      Alert.alert('Error', 'Failed to save product. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeactivate = () => {
    if (!currentUser || !productId) return;

    Alert.alert(
      'Deactivate Product',
      `Deactivate "${name}"? It will no longer appear in the catalog.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Deactivate',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsSaving(true);
              await deactivateProduct(productId, currentUser);
              navigation.goBack();
            } catch {
              Alert.alert('Error', 'Failed to deactivate product.');
            } finally {
              setIsSaving(false);
            }
          },
        },
      ]
    );
  };

  if (!isAuthorized) return null;

  if (isLoading) {
    return (
      <ScreenWrapper>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </ScreenWrapper>
    );
  }

  const categoryOptions: PickerOption[] = categories.map((c: Category) => ({
    label: c.name,
    value: c.id,
  }));

  const supplierOptions: PickerOption[] = suppliers.map((s: Supplier) => ({
    label: s.name,
    value: s.id,
  }));

  return (
    <ScreenWrapper>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Product Details</Text>

          <AppInput
            label="Name"
            placeholder="e.g. Engine Oil 10W40"
            value={name}
            onChangeText={setName}
            error={errors.name}
          />

          <View>
            <Text style={styles.barcodeLabel}>Barcode</Text>
            <View style={styles.barcodeRow}>
              <AppInput
                placeholder="Scan or enter barcode"
                value={barcode}
                onChangeText={setBarcode}
                containerStyle={styles.barcodeInput}
              />
              <TouchableOpacity style={styles.scanButton} onPress={handleScanBarcode}>
                <Text style={styles.scanButtonText}>Scan</Text>
              </TouchableOpacity>
            </View>
          </View>

          <AppInput
            label="Unit of Measure"
            placeholder="e.g. piece, liter, kg"
            value={unitOfMeasure}
            onChangeText={setUnitOfMeasure}
            error={errors.unitOfMeasure}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pricing</Text>

          <AppInput
            label="Selling Price"
            placeholder="0.00"
            value={sellingPrice}
            onChangeText={setSellingPrice}
            keyboardType="decimal-pad"
            error={errors.sellingPrice}
          />

          <AppInput
            label="Cost Price"
            placeholder="0.00"
            value={costPrice}
            onChangeText={setCostPrice}
            keyboardType="decimal-pad"
            error={errors.costPrice}
          />

          <InlinePicker
            label="VAT Type"
            value={vatType}
            placeholder="Select VAT type"
            options={VAT_OPTIONS}
            onSelect={(v) => setVatType((v || VAT_TYPES.NO_VAT) as VatType)}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Stock</Text>

          {!isEditMode && (
            <AppInput
              label="Stock Available"
              placeholder="0"
              value={stockAvailable}
              onChangeText={setStockAvailable}
              keyboardType="number-pad"
              error={errors.stockAvailable}
            />
          )}

          <AppInput
            label="Low Stock Threshold"
            placeholder="0"
            value={lowStockThreshold}
            onChangeText={setLowStockThreshold}
            keyboardType="number-pad"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Classification</Text>

          <InlinePicker
            label="Category"
            value={categoryId}
            placeholder="Select category"
            options={categoryOptions}
            onSelect={setCategoryId}
          />

          <InlinePicker
            label="Supplier"
            value={supplierId}
            placeholder="Select supplier"
            options={supplierOptions}
            onSelect={setSupplierId}
          />
        </View>

        <AppButton
          label={isEditMode ? 'Save Changes' : 'Create Product'}
          onPress={handleSubmit}
          loading={isSaving}
          fullWidth
          style={styles.submitButton}
        />

        {isEditMode && (
          <AppButton
            label="Deactivate Product"
            onPress={handleDeactivate}
            variant="danger"
            loading={isSaving}
            fullWidth
            style={styles.deactivateButton}
          />
        )}
      </ScrollView>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    backgroundColor: Colors.white,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
    gap: Spacing.md,
  },
  sectionTitle: {
    fontSize: Typography.lg,
    fontWeight: Typography.semiBold,
    color: Colors.gray900,
    marginBottom: Spacing.xs,
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
    fontWeight: Typography.semiBold,
  },
  barcodeLabel: {
    fontSize: Typography.sm,
    fontWeight: Typography.medium,
    color: Colors.gray700,
    marginBottom: Spacing.xs,
  },
  barcodeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  barcodeInput: {
    flex: 1,
  },
  submitButton: {
    marginTop: Spacing.xs,
  },
  deactivateButton: {
    marginTop: Spacing.md,
  },
});
