# AMSPOS-72: `src/screens/modals/BarcodeScannerModal.tsx`

**Sprint**: Sprint 9 — Product/Service Forms, Customer List & Barcode Scanner
**Effort**: 1.5 days
**Dependencies**: `expo-camera`
**Phase**: Transactions / Inventory

---

## Description

Full-screen modal for scanning barcodes using the device camera. Used on three screens: Transaction AddItems, Inventory List, and ProductForm. One-shot: fires the callback once then closes.

---

## Instructions

### 1. Callback pattern — `src/screens/modals/BarcodeScannerModal.tsx`

Passing functions through React Navigation params is not safe. Use a module-level ref instead:

```typescript
let _pendingCallback: ((barcode: string) => void) | null = null;

export const setBarcodeCallback = (cb: (barcode: string) => void) => {
  _pendingCallback = cb;
};
```

**Callers** (ProductForm, InventoryList, Transaction AddItems) must:

1. Call `setBarcodeCallback((barcode) => { /* handle result */ })`
2. Then navigate to the `BarcodeScanner` modal screen

### 2. Modal implementation

```typescript
export const BarcodeScannerModal: React.FC = () => {
  const navigation = useNavigation();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);

  const handleBarCodeScanned = ({ data }: { data: string }) => {
    if (scanned) return;          // one-shot guard
    setScanned(true);
    _pendingCallback?.(data);
    _pendingCallback = null;
    navigation.goBack();
  };

  // Permission not granted yet:
  if (!permission?.granted) {
    return (
      <View style={styles.container}>
        <Text>Camera permission required.</Text>
        <AppButton label="Grant Permission" onPress={requestPermission} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Camera
        style={StyleSheet.absoluteFillObject}
        onBarCodeScanned={handleBarCodeScanned}
        barCodeScannerSettings={{
          barCodeTypes: [BarCodeScanner.Constants.BarCodeType.ean13, 'qr'],
        }}
      />
      <AppButton
        label="Cancel"
        onPress={() => navigation.goBack()}
        style={styles.cancelBtn}
        variant="secondary"
      />
    </View>
  );
};
```

**Supported barcode types:** EAN-13, QR code (per FRD §6).

**Styles:** Camera fills the entire screen. Cancel button is positioned at the bottom center.

### 3. Register in navigator

Register `BarcodeScanner` as a modal stack screen in the root/modal navigator so it overlays any tab.

---

## Definition of Done (extra)

- Tested on a **physical device** with real barcodes — the emulator camera cannot scan.

---

## Acceptance Criteria

- [ ] Camera permission is requested on mount; shows a grant-permission screen if denied
- [ ] Camera view fills the screen and actively scans EAN-13 and QR codes
- [ ] On first successful scan: callback is called with the barcode string, modal closes
- [ ] Scanner is one-shot — subsequent scans before close are ignored
- [ ] "Cancel" button closes the modal without calling the callback
- [ ] `setBarcodeCallback` export is used by callers before navigating to the modal
- [ ] Modal is registered as a modal stack screen in the navigator
- [ ] No TypeScript errors
