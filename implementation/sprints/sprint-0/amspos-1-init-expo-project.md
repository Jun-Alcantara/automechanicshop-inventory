# AMSPOS-1: Init Expo Project

**Sprint**: Sprint 0 — Foundation Infrastructure
**Effort**: 0.5 day
**Dependencies**: None
**Phase**: Foundation

---

## Description

Bootstrap the AutoShop POS Expo project using the managed workflow with TypeScript. Set up the root folder structure, install all required dependencies, and verify the app runs on an Android emulator or device.

---

## Instructions

### 1. Create the Expo project

```bash
npx create-expo-app@latest autoshop-pos --template expo-template-blank-typescript
cd autoshop-pos
```

### 2. Install all project dependencies

```bash
npx expo install \
  @nozbe/watermelondb \
  @nozbe/with-observables \
  rxjs \
  zustand \
  @react-navigation/native \
  @react-navigation/stack \
  @react-navigation/bottom-tabs \
  react-native-screens \
  react-native-safe-area-context \
  react-native-gesture-handler \
  expo-camera \
  expo-print \
  expo-sharing \
  expo-file-system \
  expo-crypto \
  react-native-bluetooth-escpos-printer \
  @react-native-community/netinfo
```

Install dev dependencies:

```bash
npm install --save-dev \
  @babel/plugin-proposal-decorators \
  @babel/plugin-proposal-class-properties \
  babel-plugin-transform-remove-console \
  jest \
  @types/jest \
  jest-expo \
  @testing-library/react-native
```

### 3. Configure babel.config.js

WatermelonDB requires decorator support. Replace the default babel config:

```js
// babel.config.js
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      ['@babel/plugin-proposal-decorators', { legacy: true }],
      ['@babel/plugin-proposal-class-properties', { loose: true }],
    ],
  };
};
```

### 4. Create the folder structure

```
src/
├── navigation/
├── screens/
│   ├── auth/
│   ├── dashboard/
│   ├── transactions/
│   ├── inventory/
│   ├── admin/
│   └── modals/
├── components/
│   ├── common/
│   ├── layout/
│   ├── transaction/
│   └── inventory/
├── stores/
├── services/
├── hooks/
├── constants/
├── types/
└── utils/
```

Create placeholder `index.ts` or `.gitkeep` files in each folder so the structure is committed.

### 5. Update app.json

```json
{
  "expo": {
    "name": "AutoShop POS",
    "slug": "autoshop-pos",
    "version": "1.0.0",
    "orientation": "portrait",
    "platforms": ["android"],
    "android": {
      "package": "com.autoshop.pos",
      "permissions": ["CAMERA", "BLUETOOTH", "BLUETOOTH_ADMIN", "BLUETOOTH_CONNECT", "BLUETOOTH_SCAN"]
    },
    "plugins": [
      ["expo-camera", { "cameraPermission": "Allow AutoShop POS to scan barcodes." }]
    ]
  }
}
```

### 6. Verify the app runs

```bash
npx expo start
```

Press `a` to open on Android emulator. Confirm the default screen renders without errors.

---

## Acceptance Criteria

- [ ] `npx expo start` runs without errors
- [ ] App launches on Android emulator/device showing the default blank screen
- [ ] All required packages are listed in `package.json`
- [ ] Babel config includes decorator plugins
- [ ] `src/` folder structure exists with all subdirectories
- [ ] `app.json` targets Android with correct package name and camera permission

## Definition of Done

- All acceptance criteria are met
- No TypeScript errors (`npx tsc --noEmit` passes)
- Code is committed to the `main` branch
