# AMSPOS-102: Create Deployment Guide

**Sprint**: Sprint 16 — Final QA & Documentation
**Effort**: 0.5 day
**Dependencies**: EAS build config, expo-updates config, app.json version
**Phase**: Polish

---

## Overview

Create `implementation/deployment-guide.md` with build, OTA update, and first-time setup instructions.

---

## Content

```markdown
# Deployment Guide

## Building for Production
1. Update version in app.json
2. `eas build --platform android --profile production`
3. Download the .aab from EAS dashboard
4. Upload to Google Play Store internal testing

## OTA Updates (expo-updates)
- Configure expo-updates in app.json for EAS Update
- `eas update --branch production --message "description"`
- OTA updates apply on next app launch

## First-Time Device Setup
1. Install the APK/AAB on the Android device
2. Launch the app → InitSetupScreen appears
3. Create the Main Admin account
4. Configure printer in Settings
5. Add inventory in Inventory tab

## Troubleshooting
- "Database setup error": wipe app data and reinstall
- Bluetooth printer not found: ensure printer is paired in Android Bluetooth settings
- Camera permission: grant in Android Settings → Apps → AutoShop POS → Permissions
```

---

## Acceptance Criteria

- [ ] `implementation/deployment-guide.md` exists
- [ ] Production build steps are accurate
- [ ] OTA update instructions are correct
- [ ] First-time setup steps match the actual InitSetupScreen flow
- [ ] Troubleshooting covers the three known issues

## Definition of Done

- All acceptance criteria are met
- Deployment guide committed to `main`
