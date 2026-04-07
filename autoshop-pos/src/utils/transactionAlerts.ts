import { Alert } from 'react-native';

/**
 * Shows a confirmation dialog when adding an item with zero stock.
 * Resolves to true if the user confirms, false otherwise.
 */
export const showNegativeStockWarning = (): Promise<boolean> =>
  new Promise((resolve) => {
    Alert.alert(
      'Out of Stock',
      'This item has no available stock. Do you still want to add it?',
      [
        { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
        { text: 'Add Anyway', style: 'destructive', onPress: () => resolve(true) },
      ],
      { cancelable: true, onDismiss: () => resolve(false) }
    );
  });

/**
 * Shows an alert when a scanned barcode does not match any product.
 */
export const showUnknownBarcodeAlert = (scannedCode: string): void => {
  Alert.alert(
    'Unknown Barcode',
    `No product found for barcode: ${scannedCode}`,
    [{ text: 'OK' }]
  );
};
