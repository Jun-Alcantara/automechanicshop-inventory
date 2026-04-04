# AMSPOS-81: `src/screens/admin/SettingsScreen.tsx`

**Sprint**: Sprint 14 — Settings, Hardware Integration & Unit Tests
**Effort**: 2 days
**Dependencies**: AMSPOS-39 (settingsStore), AMSPOS-42 (usePrinter), AMSPOS-43 (auditService)
**Phase**: Settings

---

## Description

The admin settings screen. Allows a user with `MANAGE_SETTINGS` permission to configure the receipt header, default VAT type, inactivity timeout, and Bluetooth printer.

---

## Instructions

### 1. Permission guard

```typescript
const isAuthorized = usePermissionGuard('MANAGE_SETTINGS');
if (!isAuthorized) return null;
```

### 2. Data

```typescript
const { settings, updateSettings } = useSettingsStore();
```

`settings` is `AppSettings | null`. Render `null` or a loading indicator until it's available.

### 3. Layout

Wrap in `ScreenWrapper` > `ScrollView`. Group settings into labelled sections:

---

#### Section 1: Receipt Header

```typescript
<TextInput
  label="Receipt Header"
  value={receiptHeader}
  onChangeText={setReceiptHeader}
  placeholder="Shop name shown on receipts"
/>
```

Save on blur or via the "Save" button (see Step 7).

---

#### Section 2: Default VAT Type

Picker with three options:

| Label | Value |
|---|---|
| No VAT | `NO_VAT` |
| VAT Exclusive | `VAT_EXCLUSIVE` |
| VAT Inclusive | `VAT_INCLUSIVE` |

```typescript
const [defaultVatType, setDefaultVatType] = useState(settings?.defaultVatType ?? 'NO_VAT');
```

---

#### Section 3: Inactivity Timeout

Picker options (in minutes):

| Label | Value (ms) |
|---|---|
| 1 minute | 60000 |
| 2 minutes | 120000 |
| 5 minutes | 300000 |
| 10 minutes | 600000 |
| 15 minutes | 900000 |
| 30 minutes | 1800000 |

```typescript
const [inactivityTimeout, setInactivityTimeout] = useState(settings?.inactivityTimeout ?? 300000);
```

---

#### Section 4: Bluetooth Printer

```typescript
const { scanDevices, connectDevice, connectedDevice, connectionStatus } = usePrinter();
const [scannedDevices, setScannedDevices] = useState<BluetoothDevice[]>([]);
const [scanning, setScanning] = useState(false);
```

**Saved printer row:**
```
Current printer: [device name] or "No printer configured"
```

**Scan button:**
```typescript
const handleScan = async () => {
  setScanning(true);
  const devices = await scanDevices();
  setScannedDevices(devices);
  setScanning(false);
};
```

**Results list:** each device shows its name/address with a "Connect" button:
```typescript
const handleConnect = async (address: string) => {
  await connectDevice(address);
  // settingsStore will be updated inside usePrinter on successful connect
};
```

**Connection status indicator:** show `connectionStatus` (e.g., "Connected", "Connecting…", "Disconnected").

---

### 4. Local state initialisation

Initialise local state from `settings` once it loads:

```typescript
useEffect(() => {
  if (settings) {
    setReceiptHeader(settings.receiptHeader ?? '');
    setDefaultVatType(settings.defaultVatType ?? 'NO_VAT');
    setInactivityTimeout(settings.inactivityTimeout ?? 300000);
  }
}, [settings]);
```

### 5. Save handler

```typescript
const handleSave = async () => {
  await updateSettings({
    receiptHeader,
    defaultVatType,
    inactivityTimeout,
  });
  // Audit log
  await auditService.logEvent({
    action: 'EDIT_SETTINGS',
    userId: actingUser.id,
    timestamp: new Date(),
  });
};
```

Provide a "Save" button in the screen header or at the bottom of the form.

---

## Acceptance Criteria

- [ ] Screen is guarded by `usePermissionGuard('MANAGE_SETTINGS')` — returns `null` if unauthorized
- [ ] Receipt header text input pre-filled from `settings.receiptHeader`
- [ ] Default VAT type picker shows current value, updates on change
- [ ] Inactivity timeout picker shows current value, updates on change
- [ ] "Scan for Printers" button calls `usePrinter().scanDevices()` and lists results
- [ ] Each scanned device has a "Connect" button that calls `usePrinter().connectDevice(address)`
- [ ] Connection status is displayed
- [ ] "Save" calls `settingsStore.updateSettings(patch)` and logs `EDIT_SETTINGS` audit event
- [ ] No TypeScript errors
