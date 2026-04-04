# AMSPOS-82: Implement usePrinter Hook — Bluetooth Setup

**Sprint**: Sprint 4 — Admin Stack & Settings Infrastructure
**Effort**: 1.5 days
**Dependencies**: None
**Phase**: Settings/Hardware

---

## Description

Create `src/hooks/usePrinter.ts`. Wraps the `react-native-bluetooth-escpos-printer` library. Provides: list available Bluetooth devices, connect to a saved printer, print ESC/POS data, and handle connection errors. The selected printer device ID is persisted in `settingsStore`.

---

## Instructions

### 1. `src/hooks/usePrinter.ts`

```typescript
import { useState, useCallback } from 'react';
import BluetoothEscposPrinter, { BluetoothManager } from 'react-native-bluetooth-escpos-printer';
import { useSettingsStore } from '@stores/settingsStore';

export interface BluetoothDevice {
  name: string;
  address: string;
}

interface PrinterState {
  isConnected: boolean;
  isConnecting: boolean;
  isPrinting: boolean;
  error: string | null;
  availableDevices: BluetoothDevice[];
  isScanning: boolean;
}

interface UsePrinterReturn extends PrinterState {
  scanDevices: () => Promise<void>;
  connectDevice: (address: string) => Promise<boolean>;
  printData: (escposCommands: string) => Promise<boolean>;
  disconnect: () => Promise<void>;
}

export const usePrinter = (): UsePrinterReturn => {
  const { settings, updateSettings } = useSettingsStore();
  const [state, setState] = useState<PrinterState>({
    isConnected: false,
    isConnecting: false,
    isPrinting: false,
    error: null,
    availableDevices: [],
    isScanning: false,
  });

  const scanDevices = useCallback(async () => {
    setState((s) => ({ ...s, isScanning: true, error: null }));
    try {
      const paired = await BluetoothManager.enableBluetooth();
      const devices: BluetoothDevice[] = (paired as any[]).map((d) => ({
        name: d.name ?? d.address,
        address: d.address,
      }));
      setState((s) => ({ ...s, availableDevices: devices, isScanning: false }));
    } catch (e) {
      setState((s) => ({
        ...s,
        isScanning: false,
        error: 'Failed to scan for devices. Check Bluetooth permissions.',
      }));
    }
  }, []);

  const connectDevice = useCallback(
    async (address: string): Promise<boolean> => {
      setState((s) => ({ ...s, isConnecting: true, error: null }));
      try {
        await BluetoothManager.connect(address);
        await updateSettings({ printerDeviceId: address });
        setState((s) => ({ ...s, isConnected: true, isConnecting: false }));
        return true;
      } catch (e) {
        setState((s) => ({
          ...s,
          isConnected: false,
          isConnecting: false,
          error: 'Could not connect to printer.',
        }));
        return false;
      }
    },
    [updateSettings]
  );

  const printData = useCallback(async (escposCommands: string): Promise<boolean> => {
    setState((s) => ({ ...s, isPrinting: true, error: null }));
    try {
      // Re-connect to saved printer if not connected
      const savedAddress = settings?.printerDeviceId;
      if (!state.isConnected && savedAddress) {
        await BluetoothManager.connect(savedAddress);
      }
      await BluetoothEscposPrinter.printText(escposCommands, {});
      setState((s) => ({ ...s, isPrinting: false }));
      return true;
    } catch (e) {
      setState((s) => ({
        ...s,
        isPrinting: false,
        isConnected: false,
        error: 'Printer unavailable. Retry or skip?',
      }));
      return false;
    }
  }, [settings?.printerDeviceId, state.isConnected]);

  const disconnect = useCallback(async () => {
    try {
      await BluetoothManager.disconnect();
    } catch { /* ignore */ }
    setState((s) => ({ ...s, isConnected: false }));
  }, []);

  return { ...state, scanDevices, connectDevice, printData, disconnect };
};
```

### 2. Android Bluetooth permissions

Ensure `app.json` has all required permissions (already set in AMSPOS-5):
- `BLUETOOTH`, `BLUETOOTH_ADMIN`, `BLUETOOTH_CONNECT`, `BLUETOOTH_SCAN`

### 3. Error surfacing

When `printData` returns `false`, the calling screen (`ReceiptScreen`) shows:
> "Printer unavailable. Retry or skip?"

With Retry (calls `printData` again) and Skip (dismisses without printing) options. The hook provides `error` string for this.

---

## Acceptance Criteria

- [ ] `scanDevices()` lists paired Bluetooth devices
- [ ] `connectDevice(address)` connects and persists address to `settingsStore`
- [ ] `printData(commands)` auto-reconnects to saved printer if disconnected
- [ ] `printData` returns `false` and sets `error` on failure (never throws)
- [ ] `isConnecting`, `isPrinting`, `isScanning` state fields reflect async operation state
- [ ] No TypeScript errors

## Definition of Done

- All acceptance criteria are met
- Tested on Android device with a real or mock Bluetooth printer
- Code committed to `main`
