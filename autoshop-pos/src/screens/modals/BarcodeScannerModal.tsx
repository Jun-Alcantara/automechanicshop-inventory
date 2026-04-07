import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { AppButton } from '@components/common/AppButton';
import { Colors, Spacing, Typography } from '@constants/theme';

// ─── Module-level callback ref ────────────────────────────────────────────────
// Passing functions through React Navigation params is not safe; use a
// module-level ref so callers can register before navigating.

let _pendingCallback: ((barcode: string) => void) | null = null;

export const setBarcodeCallback = (cb: (barcode: string) => void) => {
  _pendingCallback = cb;
};

// ─── Modal ────────────────────────────────────────────────────────────────────

export const BarcodeScannerModal: React.FC = () => {
  const navigation = useNavigation();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);

  const handleBarCodeScanned = ({ data }: { data: string }) => {
    if (scanned) return; // one-shot guard
    setScanned(true);
    _pendingCallback?.(data);
    _pendingCallback = null;
    navigation.goBack();
  };

  if (!permission?.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionText}>Camera permission is required to scan barcodes.</Text>
        <AppButton label="Grant Permission" onPress={requestPermission} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFillObject}
        onBarcodeScanned={handleBarCodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ['ean13', 'qr'],
        }}
      />
      <View style={styles.overlay}>
        <View style={styles.scanFrame} />
        <Text style={styles.hint}>Point camera at an EAN-13 or QR barcode</Text>
      </View>
      <AppButton
        label="Cancel"
        onPress={() => navigation.goBack()}
        variant="secondary"
        style={styles.cancelBtn}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.black,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
    gap: Spacing.lg,
    backgroundColor: Colors.surface,
  },
  permissionText: {
    fontSize: Typography.base,
    color: Colors.gray700,
    textAlign: 'center',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanFrame: {
    width: 240,
    height: 240,
    borderWidth: 2,
    borderColor: Colors.white,
    borderRadius: 12,
    backgroundColor: 'transparent',
  },
  hint: {
    marginTop: Spacing.md,
    fontSize: Typography.sm,
    color: Colors.white,
    textAlign: 'center',
    paddingHorizontal: Spacing.lg,
  },
  cancelBtn: {
    position: 'absolute',
    bottom: Spacing.xxl,
    alignSelf: 'center',
    minWidth: 160,
  },
});
