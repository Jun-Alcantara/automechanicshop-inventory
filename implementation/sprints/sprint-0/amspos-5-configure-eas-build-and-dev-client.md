# AMSPOS-5: Configure EAS Build and Dev Client

**Sprint**: Sprint 0 — Foundation Infrastructure
**Effort**: 0.5 day
**Dependencies**: AMSPOS-1
**Phase**: Foundation

---

## Description

Set up Expo Application Services (EAS) for building the Android APK/AAB. Configure `eas.json` with development, preview, and production build profiles. Install `expo-dev-client` so the team can run a custom development build with native modules (WatermelonDB JSI, Bluetooth).

---

## Instructions

### 1. Install EAS CLI and expo-dev-client

```bash
npm install -g eas-cli
npx expo install expo-dev-client
```

### 2. Log in and configure EAS

```bash
eas login
eas build:configure
```

This generates `eas.json`. Update it:

```json
{
  "cli": {
    "version": ">= 5.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "android": {
        "buildType": "aab"
      }
    }
  },
  "submit": {
    "production": {}
  }
}
```

### 3. Update `app.json` for EAS

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
      "permissions": [
        "CAMERA",
        "BLUETOOTH",
        "BLUETOOTH_ADMIN",
        "BLUETOOTH_CONNECT",
        "BLUETOOTH_SCAN"
      ]
    },
    "plugins": [
      "expo-dev-client",
      ["expo-camera", { "cameraPermission": "Allow AutoShop POS to scan barcodes." }]
    ],
    "extra": {
      "eas": {
        "projectId": "YOUR_EAS_PROJECT_ID"
      }
    }
  }
}
```

Replace `YOUR_EAS_PROJECT_ID` with the project ID from `eas build:configure`.

### 4. Build the dev client APK

```bash
eas build --platform android --profile development
```

Install the resulting APK on the Android device/emulator.

### 5. Start the dev server pointing to the dev client

```bash
npx expo start --dev-client
```

Scan the QR code from the installed dev client APK.

### 6. Add npm scripts

Add to `package.json` scripts:

```json
{
  "scripts": {
    "start": "expo start",
    "start:dev": "expo start --dev-client",
    "android": "expo run:android",
    "build:dev": "eas build --platform android --profile development",
    "build:preview": "eas build --platform android --profile preview",
    "build:prod": "eas build --platform android --profile production",
    "type-check": "tsc --noEmit",
    "test": "jest"
  }
}
```

---

## Acceptance Criteria

- [ ] `eas.json` exists with `development`, `preview`, and `production` build profiles
- [ ] `expo-dev-client` is installed and listed in `app.json` plugins
- [ ] `eas build:configure` has been run and the project is linked to an EAS project
- [ ] All required Android permissions are declared in `app.json`
- [ ] `npm run type-check` script works

## Definition of Done

- All acceptance criteria are met
- `eas.json` committed to `main`
- Dev client APK can be built successfully (or build initiated and link shared)
