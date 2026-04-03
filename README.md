# AutoShop POS

A mobile point-of-sale application for auto repair shops, built with React Native and Expo. Designed for a single Android device with full offline-first operation — no internet connection is required for any POS function.

## Features

- **Transaction Management** — Create, manage, and finalize transactions for multiple vehicles simultaneously. Supports cash and e-wallet (GCash, Maya) payments, including split payment.
- **Inventory & Services** — Manage products, services, categories, and suppliers. Stock is reserved atomically when items are added to a transaction.
- **Customer & Vehicle Records** — Link transactions to customer profiles and vehicle service history. Walk-in customers are supported.
- **Role-Based Access Control** — 6-digit PIN authentication with granular, per-user permissions. All actions are audit-logged.
- **Receipt Printing** — Bluetooth thermal printer (80mm ESC/POS). Falls back to PDF download if no printer is available.
- **Barcode Scanning** — Device camera scanning for product lookup and quick add-to-transaction.
- **Reporting** — Dashboard with daily sales metrics and low-stock alerts. Admin reports with date-range filtering.
- **Offline-First** — All data lives on-device in a WatermelonDB (SQLite) database. No server, no sync, no connectivity requirement.

## Tech Stack

| Layer | Library |
|---|---|
| Framework | Expo SDK 54 (CNG / prebuild), EAS Build |
| Language | TypeScript |
| Database | WatermelonDB (`@nozbe/watermelondb`) |
| State | Zustand |
| Navigation | React Navigation (Native Stack) |
| UI | React Native StyleSheet, React Native Paper (partial) |
| Barcode | `expo-camera` |
| Printing | `react-native-bluetooth-escpos-printer` |
| PDF | `expo-print` + `expo-sharing` |
| PIN Security | PBKDF2 via `pbkdf2` npm package + `expo-crypto` (salt) |
| Secure Storage | `expo-secure-store` |
| OTA Updates | `expo-updates` |

**Target platform**: Android only.

## Project Structure

```
autoshop-pos/
├── src/
│   ├── navigation/      # React Navigation setup and route param types
│   ├── screens/         # One file per screen, grouped by feature
│   ├── components/      # Reusable UI components
│   ├── stores/          # Zustand store slices
│   ├── services/        # WatermelonDB reads/writes (single layer that touches the DB)
│   ├── hooks/           # Custom React hooks (permission guards, inactivity timer, etc.)
│   ├── constants/       # Enums and app-wide literals
│   ├── types/           # TypeScript interfaces
│   └── utils/           # Pure functions (currency formatting, VAT calculation, PIN hashing)
├── assets/
├── app.json
├── eas.json
├── package.json
└── tsconfig.json
```

See [documents/architecture.md](documents/architecture.md) for the full folder structure, store interfaces, and service layer patterns.

## Getting Started

### Prerequisites

- Node.js 18+
- EAS CLI: `npm install -g eas-cli`
- An Android device or emulator

### Install dependencies

```bash
npm install
```

### Run on device (development build)

A development build is required because WatermelonDB and the Bluetooth printer library use native modules.

```bash
# Build a dev client (first time or after native dependency changes)
eas build --profile development --platform android

# Start the Metro bundler
npx expo start --dev-client
```

### Build for distribution

```bash
# Internal preview APK
eas build --profile preview --platform android

# Production AAB (Play Store)
eas build --profile production --platform android
```

> **New Architecture note**: Expo SDK 54 enables the New Architecture (Fabric + Turbo Modules) by default. Validate `react-native-bluetooth-escpos-printer` and `@nozbe/watermelondb` compatibility with a PoC dev build before starting feature development. If either library is incompatible, enable the legacy interop layer in `app.config.ts`.

## User Roles & Permissions

Authentication uses a unique 6-digit PIN per user. Sessions lock after 5 minutes of inactivity (configurable).

| Permission | Description |
|---|---|
| Manage Users | Create/deactivate users, reset PINs |
| Manage Inventory | Add/edit products, services, categories, suppliers |
| Create Transactions | Open transactions, add items, create customer/vehicle records |
| Apply Discounts | Apply fixed or percentage discounts to line items |
| Void Transactions | Void finalized transactions or process returns |
| Cancel Transactions | Cancel in-progress transactions; remove individual items |
| View Reports | Access sales reports and audit logs |
| Manage Settings | Configure VAT defaults, timeout, receipt header, printer |

A **Main Admin** account (created during first-time setup) permanently holds all permissions and cannot be deleted or deactivated.

## Documents

- [Functional Requirements](documents/functional_requirements.md)
- [Tech Stack](documents/tech_stack.md)
- [Architecture & Folder Structure](documents/architecture.md)
- [Data Model](documents/data_model.md)
- [Screen Map](documents/screen_map.md)
