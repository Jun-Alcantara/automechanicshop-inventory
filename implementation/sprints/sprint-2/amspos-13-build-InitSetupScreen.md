# AMSPOS-13: Build InitSetupScreen — Main Admin Creation

**Sprint**: Sprint 2 — Auth Screens & Components
**Effort**: 1.5 days
**Dependencies**: AMSPOS-11, AMSPOS-12
**Phase**: Auth

---

## Description

Build `src/screens/auth/InitSetupScreen.tsx`. This screen is shown only once: the very first time the app launches when no users exist in the database. It collects a display name and PIN (entered twice for confirmation) to create the Main Admin account.

After successful creation, navigate to `PinLock` screen.

---

## Instructions

### 1. First-launch detection

In `RootNavigator` (AMSPOS-21), the app checks whether any users exist in the database. If `users` count is 0, the navigator renders `InitSetup` as the initial route. This screen handles its own creation and navigation.

### 2. `src/screens/auth/InitSetupScreen.tsx`

```typescript
import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { AppInput } from '@components/common/AppInput';
import { AppButton } from '@components/common/AppButton';
import { Colors, Spacing, Typography } from '@constants/theme';
import { createMainAdmin } from '@services/userService';
import { isValidPin } from '@utils/pinHash';
import { logEvent } from '@services/auditService';
import type { RootStackParamList } from '@navigation/types';

type Nav = StackNavigationProp<RootStackParamList, 'InitSetup'>;

export const InitSetupScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const [displayName, setDisplayName] = useState('');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!displayName.trim()) newErrors.displayName = 'Name is required.';
    if (!isValidPin(pin)) newErrors.pin = 'PIN must be exactly 6 digits.';
    if (pin !== confirmPin) newErrors.confirmPin = 'PINs do not match.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreate = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const admin = await createMainAdmin(displayName.trim(), pin);
      await logEvent({
        userId: admin.id,
        userName: admin.displayName,
        actionType: 'LOGIN',
        entityType: 'SESSION',
        entityId: admin.id,
        note: 'Initial setup — Main Admin created',
      });
      navigation.replace('PinLock');
    } catch (e) {
      Alert.alert('Setup Failed', e instanceof Error ? e.message : 'An error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>Welcome to AutoShop POS</Text>
      <Text style={styles.subtitle}>
        Set up the Main Admin account to get started. This can only be done once.
      </Text>

      <AppInput
        label="Your Name"
        value={displayName}
        onChangeText={setDisplayName}
        placeholder="e.g. Juan dela Cruz"
        autoCapitalize="words"
        error={errors.displayName}
        containerStyle={styles.field}
      />
      <AppInput
        label="Set PIN (6 digits)"
        value={pin}
        onChangeText={setPin}
        keyboardType="numeric"
        maxLength={6}
        secureTextEntry
        error={errors.pin}
        containerStyle={styles.field}
      />
      <AppInput
        label="Confirm PIN"
        value={confirmPin}
        onChangeText={setConfirmPin}
        keyboardType="numeric"
        maxLength={6}
        secureTextEntry
        error={errors.confirmPin}
        containerStyle={styles.field}
      />

      <AppButton
        label="Create Account"
        onPress={handleCreate}
        loading={loading}
        fullWidth
        style={styles.button}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: Spacing.xl,
    justifyContent: 'center',
    backgroundColor: Colors.background,
  },
  title: {
    fontSize: Typography.xxl,
    fontWeight: Typography.bold,
    color: Colors.black,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: Typography.base,
    color: Colors.gray500,
    marginBottom: Spacing.xl,
  },
  field: { marginBottom: Spacing.md },
  button: { marginTop: Spacing.lg },
});
```

---

## Acceptance Criteria

- [ ] Screen shows name input + PIN + confirm PIN fields
- [ ] Validation: name required, PIN must be 6 digits, PINs must match
- [ ] Calls `createMainAdmin` with display name and PIN on submit
- [ ] Shows loading state during creation
- [ ] On success, navigates to `PinLock` route via `navigation.replace`
- [ ] On error, shows `Alert.alert` with the error message
- [ ] No TypeScript errors

## Definition of Done

- All acceptance criteria are met
- Screen visually tested on Android emulator
- Code committed to `main`
