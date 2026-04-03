# Tech Stack - AutoShop POS

This document outlines the technical stack for the AutoShop POS mobile application, built with **React Native** and **Expo**. The stack is chosen to satisfy requirements for offline-first functionality, hardware integration, and a seamless user experience. The target platform is **Android only**.

## 1. Core Framework & Language
*   **Framework**: [Expo](https://expo.dev/) (**SDK 54**) using the **CNG (Continuous Native Generation) / prebuild workflow** with [EAS Build](https://expo.dev/eas).
    *   *Rationale*: Both the Bluetooth printer integration and the WatermelonDB SQLite native module require native code via config plugins, which necessitates EAS Build and a Dev Client rather than a pure Managed Workflow. EAS Build targets Android (APK/AAB) only.
    *   **Note**: SDK 54 enables the New Architecture (Fabric + Turbo Modules) by default. Both `react-native-bluetooth-escpos-printer` and `@nozbe/watermelondb` must be validated against the New Architecture via a PoC EAS Build before any app code is written. If either library is incompatible, enable the legacy interop layer in `app.config.ts` or switch to an alternative.
*   **Language**: [TypeScript](https://www.typescriptlang.org/)
    *   *Rationale*: Ensures type safety across complex transaction logic, permission matrices, and WatermelonDB model definitions.

## 2. Backend & Data Persistence (Offline-First)
*   **Local Database**: [`@nozbe/watermelondb`](https://watermelondb.dev/)
    *   *Rationale*: WatermelonDB is a high-performance, SQLite-backed database built specifically for React Native. It stores all data locally on the device, provides reactive Observable queries for real-time UI updates, and wraps all writes in SQLite transactions — making it an ideal fit for a single-device, offline-first POS. There is no network dependency for any database operation.
    *   **Expo integration**: WatermelonDB ships a first-party Expo config plugin (`@nozbe/watermelondb/expo-plugin`) that handles the native SQLite build configuration automatically during `expo prebuild`. No manual `android/` file editing is required.
    *   **Reactive queries**: WatermelonDB exposes `.observe()` on every query, returning an RxJS Observable. Components subscribe via `@nozbe/with-observables` HOC or by calling `.subscribe()` directly. This replaces the role that Firestore `onSnapshot` listeners would have played.
    *   **Atomic writes**: All database mutations are wrapped in `database.write(async () => { ... })`. Every operation within a single write block executes inside a single SQLite transaction — if any step throws, all changes are rolled back automatically. This makes stock reservation and audit logging fully atomic with no network dependency.
    *   **No cloud sync**: Data lives only on the device. This is intentional — the app operates on a single terminal with no multi-device or cloud-sync requirement.
    *   **Note**: `@nozbe/watermelondb` must be validated against the New Architecture (Fabric + Turbo Modules) via a PoC EAS Dev Build before Sprint 1. If the installed version does not support the New Architecture, enable the legacy interop layer in `app.config.ts`.
*   **Local Secure Storage**: [`expo-secure-store`](https://docs.expo.dev/versions/latest/sdk/secure-store/)
    *   *Rationale*: Used for storing sensitive small data items that must survive app restarts — specifically the active session token and the per-user PBKDF2 salt. PIN hashes themselves are stored in the WatermelonDB `users` table.

## 3. State Management
*   **Global State**: [Zustand](https://github.com/pmndrs/zustand)
    *   *Rationale*: A lightweight, high-performance state management library ideal for handling "In Progress" transactions and UI state without the boilerplate of Redux. WatermelonDB Observable queries feed directly into Zustand stores via `.subscribe()`, keeping the UI reactive to local database changes without a separate server-state caching layer.
*   **Reactive subscriptions**: [`@nozbe/with-observables`](https://github.com/nozbe/with-observables)
    *   *Rationale*: A Higher-Order Component (HOC) that connects WatermelonDB Observable queries directly to React components, triggering re-renders only when the underlying data changes. Used for list screens (product list, transaction list) where the component should stay live with minimal boilerplate.

## 4. UI & Styling
*   **Styling**: React Native `StyleSheet` (Standard)
    *   *Rationale*: Adheres to the "Vanilla CSS" preference for React Native. Provides full control over the look and feel without external library overhead.
*   **Navigation**: [React Navigation](https://reactnavigation.org/) (Native Stack)
    *   *Rationale*: The industry standard for React Native navigation, offering native performance and familiar patterns.
*   **Icons**: `@expo/vector-icons` (Material Design / Ionicons)
*   **Component Library**: [React Native Paper](https://reactnativepaper.com/) (Optional/Partial)
    *   *Rationale*: Useful for standard MD3 components like Modals, Pickers, and Data Tables to speed up development while maintaining a clean aesthetic.

## 5. Hardware & Native Integration
*   **Barcode Scanning**: [`expo-camera`](https://docs.expo.dev/versions/latest/sdk/camera/) (built-in barcode scanning)
    *   *Rationale*: Leverages the device camera as required. `expo-barcode-scanner` is deprecated as of SDK 50+ and should not be used.
*   **Receipt Printing (Bluetooth)**: [`react-native-bluetooth-escpos-printer`](https://github.com/januslo/react-native-bluetooth-escpos-printer) (via Expo Development Client)
    *   *Rationale*: Specifically designed for ESC/POS thermal printers. Requires a custom Expo config plugin to work with the CNG workflow.
*   **PDF Generation (Fallback)**: [`expo-print`](https://docs.expo.dev/versions/latest/sdk/print/) & [`expo-sharing`](https://docs.expo.dev/versions/latest/sdk/sharing/)
    *   *Rationale*: Generates the digital receipt PDF and opens the native share/save sheet.

## 6. Authentication & Security
*   **PIN Hashing**: `expo-crypto` using **PBKDF2 with a per-user salt**.
    *   *Rationale*: A 6-digit numeric PIN has only 1,000,000 possible values — trivially brute-forceable with plain SHA-256. PBKDF2 with a per-user salt and ≥10,000 iterations is the minimum acceptable approach. Implementation: `PBKDF2(pin, userId + randomSalt, { iterations: 10000, keySize: 256/32 })`. The salt is stored alongside `pinHash` in the WatermelonDB `users` table.
    *   **Note**: `expo-crypto`'s `digestStringAsync` does not support PBKDF2. Use a pure-JS PBKDF2 implementation (e.g., `pbkdf2` npm package) or use `expo-crypto`'s `getRandomBytes` for salt generation combined with a PBKDF2 implementation. `crypto-js` includes a PBKDF2 implementation but add `crypto-js` only if no lighter alternative exists.
*   **Inactivity Timer**: Custom React Hook (`useInactivityTimer`) using `AppState` as the **primary trigger**.
    *   *Implementation rule*: On every `AppState → active` transition, compare `Date.now()` against `lastActivityAt + timeoutMs` and lock immediately if expired. `setTimeout` is used only as a secondary fallback for in-foreground idle detection. Never rely solely on `setTimeout` to detect background time — the JS thread is suspended while backgrounded and the timer will not fire.

## 7. Development Tools
*   **Linting/Formatting**: ESLint & Prettier.
*   **Environment Variables**: `app.config.ts` (dynamic config) with `expo-constants`. Environment-specific values (e.g., build environment label, update channel) are injected via **EAS Environment Variables** — never committed to version control. No external credentials file (such as `google-services.json`) is required; WatermelonDB is fully local with no cloud service dependencies.
*   **Build System**: [EAS Build](https://expo.dev/eas) for generating Android (APK/AAB) binaries. Three build profiles defined in `eas.json`:
    *   `development` — debug build with dev client, local SQLite database on device
    *   `preview` — release build (APK), internal distribution, local SQLite database on device
    *   `production` — release build (AAB), local SQLite database on device, OTA updates enabled via `expo-updates`
*   **OTA Updates**: [`expo-updates`](https://docs.expo.dev/versions/latest/sdk/updates/) for pushing critical bug fixes (e.g., VAT calculation, payment flow) to the device without a full APK install. `runtimeVersion` policy must be defined in `app.config.ts`. Note: OTA updates apply to the JavaScript bundle only — schema migrations that require native changes (e.g., adding a WatermelonDB table column) will require a new APK build.
