import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { AppInput } from '@components/common/AppInput';
import { AppButton } from '@components/common/AppButton';
import { Colors, Spacing, Typography } from '@constants/theme';
import { useSessionStore } from '@stores/sessionStore';
import { logEvent } from '@services/auditService';
import { authenticateByPin } from '@services/authService';
import type { RootStackParamList } from '@navigation/types';

type Nav = StackNavigationProp<RootStackParamList, 'PinLock'>;

export const PinLockScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const { status, user, login, unlock } = useSessionStore();
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isLocked = status === 'LOCKED';

  const handleSubmit = async () => {
    if (pin.length !== 6) {
      setError('Enter your 6-digit PIN.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      if (isLocked) {
        const success = await unlock(pin);
        if (!success) {
          setError('Incorrect PIN. Try again.');
          setPin('');
          return;
        }
        const currentUser = useSessionStore.getState().user;
        if (currentUser) {
          await logEvent({
            userId: currentUser.id,
            userName: currentUser.displayName,
            actionType: 'LOGIN',
            entityType: 'SESSION',
            entityId: currentUser.id,
            note: 'Unlocked after inactivity',
          });
        }
      } else {
        const matchedUser = await authenticateByPin(pin);
        if (!matchedUser) {
          setError('Incorrect PIN. Try again.');
          setPin('');
          return;
        }
        await login(matchedUser.id);
        await logEvent({
          userId: matchedUser.id,
          userName: matchedUser.displayName,
          actionType: 'LOGIN',
          entityType: 'SESSION',
          entityId: matchedUser.id,
        });
      }

      navigation.replace('MainTabs');
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'An error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.appName}>AutoShop POS</Text>

      {isLocked && user ? (
        <Text style={styles.lockedLabel}>
          {'Session locked.\n'}
          <Text style={styles.lockedUser}>{user.displayName}</Text>
        </Text>
      ) : (
        <Text style={styles.subtitle}>Enter your PIN to continue</Text>
      )}

      <AppInput
        value={pin}
        onChangeText={v => { setPin(v); setError(''); }}
        keyboardType="numeric"
        maxLength={6}
        secureTextEntry
        placeholder="••••••"
        error={error}
        containerStyle={styles.pinInput}
        autoFocus
      />

      <AppButton
        label={isLocked ? 'Unlock' : 'Log In'}
        onPress={handleSubmit}
        loading={loading}
        fullWidth
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  appName: {
    fontSize: Typography.xxxl,
    fontWeight: Typography.bold,
    color: Colors.primary,
    marginBottom: Spacing.xl,
  },
  subtitle: {
    fontSize: Typography.base,
    color: Colors.gray500,
    marginBottom: Spacing.lg,
  },
  lockedLabel: {
    fontSize: Typography.base,
    color: Colors.gray500,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  lockedUser: {
    fontWeight: Typography.semiBold,
    color: Colors.gray900,
  },
  pinInput: { width: '100%', marginBottom: Spacing.md },
});
