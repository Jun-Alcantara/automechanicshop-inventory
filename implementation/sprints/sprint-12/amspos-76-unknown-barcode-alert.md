# AMSPOS-76: UnknownBarcodeAlert + `prefillBarcode` Route Param

**Sprint**: Sprint 12 — TransactionDetailScreen (Complex)
**Effort**: 0.5 day
**Dependencies**: AMSPOS-72 (BarcodeScanner), AMSPOS-54 (ProductFormScreen)
**Phase**: Transactions

---

## Description

Shows a native alert when a barcode scan returns no matching product. Gives the user the option to navigate to `ProductFormScreen` with the scanned barcode pre-filled. Also requires updating `ProductFormScreen` and the navigation param list to accept `prefillBarcode`.

---

## Instructions

### 1. `src/screens/transactions/utils/unknownBarcodeAlert.ts`

```typescript
import { Alert } from 'react-native';
import { NavigationProp } from '@react-navigation/native';
import { InventoryStackParamList } from '@/navigation/types';

export const showUnknownBarcodeAlert = (
  scannedBarcode: string,
  navigation: NavigationProp<any>
) => {
  Alert.alert(
    'Unknown Barcode',
    `No product found for barcode "${scannedBarcode}".`,
    [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Create Product',
        onPress: () =>
          navigation.navigate('InventoryStack', {
            screen: 'ProductForm',
            params: { productId: undefined, prefillBarcode: scannedBarcode },
          }),
      },
    ]
  );
};
```

### 2. Update `InventoryStackParamList` in `src/navigation/types.ts`

Add `prefillBarcode` as an optional param to `ProductForm`:

```typescript
ProductForm: { productId?: string; prefillBarcode?: string };
```

### 3. Update `src/screens/inventory/ProductFormScreen.tsx`

Read `prefillBarcode` from route params and pre-populate the barcode field on mount:

```typescript
const { productId, prefillBarcode } = route.params ?? {};

// Inside useState / useEffect initialisation:
const [barcode, setBarcode] = useState(prefillBarcode ?? '');
```

If the form already initialises state from a `useEffect` that loads an existing product, ensure `prefillBarcode` is applied only when `productId` is `undefined` (i.e., new product creation).

---

## Acceptance Criteria

- [ ] Alert title: `'Unknown Barcode'`
- [ ] Alert body includes the scanned barcode value
- [ ] "Cancel" dismisses the alert
- [ ] "Create Product" navigates to `ProductFormScreen` with `prefillBarcode` set to the scanned barcode
- [ ] `InventoryStackParamList.ProductForm` updated with optional `prefillBarcode?: string`
- [ ] `ProductFormScreen` reads `prefillBarcode` and pre-populates the barcode field
- [ ] `prefillBarcode` only applies when creating a new product (`productId` is undefined)
- [ ] No TypeScript errors

## Definition of Done

- Acceptance criteria met
- Code committed to `main`
