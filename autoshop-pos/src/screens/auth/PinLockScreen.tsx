import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { Colors, Spacing, Typography, BorderRadius } from '@constants/theme';
import { useSessionStore } from '@stores/sessionStore';
import { logEvent } from '@services/auditService';
import { authenticateByPin } from '@services/authService';
import type { RootStackParamList } from '@navigation/types';

type Nav = StackNavigationProp<RootStackParamList, 'PinLock'>;

const PIN_LENGTH = 6;
const KEY_SIZE = 76;
const KEY_GAP = 14;

const NUMPAD_KEYS = [
  '1', '2', '3',
  '4', '5', '6',
  '7', '8', '9',
  'backspace', '0', 'check',
] as const;

type NumpadKey = typeof NUMPAD_KEYS[number];

export const PinLockScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const { status, user, login, unlock } = useSessionStore();
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isLocked = status === 'LOCKED';

  const handleSubmit = async (currentPin: string) => {
    if (currentPin.length !== PIN_LENGTH) {
      setError('Enter your 6-digit PIN.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      if (isLocked) {
        const success = await unlock(currentPin);
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
        const matchedUser = await authenticateByPin(currentPin);
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

      navigation.replace('MainTabs', { screen: 'Dashboard' });
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'An error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (key: NumpadKey) => {
    if (loading) return;

    if (key === 'backspace') {
      setPin(prev => prev.slice(0, -1));
      setError('');
    } else if (key === 'check') {
      handleSubmit(pin);
    } else {
      if (pin.length < PIN_LENGTH) {
        const newPin = pin + key;
        setPin(newPin);
        setError('');
        if (newPin.length === PIN_LENGTH) {
          handleSubmit(newPin);
        }
      }
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

      {/* PIN digit boxes */}
      <View style={styles.pinRow}>
        {Array.from({ length: PIN_LENGTH }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.pinBox,
              i < pin.length && styles.pinBoxFilled,
              !!error && styles.pinBoxError,
            ]}
          >
            {i < pin.length && <View style={styles.pinDot} />}
          </View>
        ))}
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : <View style={styles.errorPlaceholder} />}

      {/* Numpad 3 x 4 */}
      <View style={styles.numpad}>
        {NUMPAD_KEYS.map(key => {
          const isCheck = key === 'check';
          const isBackspace = key === 'backspace';
          return (
            <TouchableOpacity
              key={key}
              style={[
                styles.numKey,
                isCheck && styles.numKeyCheck,
                isBackspace && styles.numKeyBackspace,
                loading && styles.numKeyDisabled,
              ]}
              onPress={() => handleKeyPress(key)}
              disabled={loading}
              activeOpacity={0.65}
            >
              {isBackspace ? (
                <Text style={[styles.numKeyText, styles.numKeySymbol]}>⌫</Text>
              ) : isCheck ? (
                <Text style={[styles.numKeyText, styles.numKeyCheckText]}>✓</Text>
              ) : (
                <Text style={styles.numKeyText}>{key}</Text>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
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

  // PIN boxes
  pinRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  pinBox: {
    width: 54,
    height: 62,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinBoxFilled: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  pinBoxError: {
    borderColor: Colors.danger,
    backgroundColor: Colors.dangerLight,
  },
  pinDot: {
    width: 15,
    height: 15,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary,
  },
  errorText: {
    fontSize: Typography.sm,
    color: Colors.danger,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  errorPlaceholder: {
    height: Typography.sm + Spacing.md,
  },

  // Numpad
  numpad: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: KEY_SIZE * 3 + KEY_GAP * 2,
    gap: KEY_GAP,
  },
  numKey: {
    width: KEY_SIZE,
    height: KEY_SIZE,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
  },
  numKeyCheck: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  numKeyBackspace: {
    backgroundColor: Colors.gray100,
    borderColor: Colors.border,
  },
  numKeyDisabled: {
    opacity: 0.45,
  },
  numKeyText: {
    fontSize: Typography.xxl,
    fontWeight: Typography.semiBold,
    color: Colors.gray900,
  },
  numKeySymbol: {
    color: Colors.gray500,
  },
  numKeyCheckText: {
    color: Colors.white,
  },
});
