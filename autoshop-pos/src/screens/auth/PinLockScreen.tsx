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

const NUMPAD_ROWS = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['backspace', '0', 'check'],
] as const;

type NumpadKey = 'backspace' | 'check' | '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9';

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
      {/* App name — takes up remaining space, centered */}
      <View style={styles.header}>
        <Text style={styles.appName}>AutoShop POS</Text>
      </View>

      {/* PIN section — sits just above the numpad */}
      <View style={styles.pinSection}>
        {isLocked && user ? (
          <Text style={styles.lockedLabel}>
            {'Session locked.\n'}
            <Text style={styles.lockedUser}>{user.displayName}</Text>
          </Text>
        ) : (
          <Text style={styles.subtitle}>Enter your PIN to continue</Text>
        )}

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
      </View>

      {/* Numpad — anchored to bottom with gray container */}
      <View style={styles.numpadContainer}>
        {NUMPAD_ROWS.map((row, rowIdx) => (
          <View key={rowIdx} style={styles.numpadRow}>
            {row.map(key => {
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
                  onPress={() => handleKeyPress(key as NumpadKey)}
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
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  // App name fills the top space
  header: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appName: {
    fontSize: Typography.xxxl,
    fontWeight: Typography.bold,
    color: Colors.primary,
  },

  // Label + PIN boxes just above the numpad
  pinSection: {
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: Typography.base,
    color: Colors.gray500,
    marginBottom: Spacing.md,
  },
  lockedLabel: {
    fontSize: Typography.base,
    color: Colors.gray500,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  lockedUser: {
    fontWeight: Typography.semiBold,
    color: Colors.gray900,
  },

  // PIN boxes — flex to fill width
  pinRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  pinBox: {
    flex: 1,
    height: 52,
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.gray100,
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
    width: 12,
    height: 12,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary,
  },
  errorText: {
    fontSize: Typography.sm,
    color: Colors.danger,
    marginTop: Spacing.sm,
    textAlign: 'center',
  },
  errorPlaceholder: {
    height: Typography.sm + Spacing.sm,
  },

  // Numpad container — gray background, full width, bottom-anchored
  numpadContainer: {
    backgroundColor: Colors.gray100,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xl,
    gap: Spacing.sm,
  },
  numpadRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },

  // Individual keys — flex: 1 fills each row equally
  numKey: {
    flex: 1,
    height: 72,
    borderRadius: 18,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  numKeyCheck: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  numKeyBackspace: {
    backgroundColor: Colors.gray300,
    borderColor: Colors.gray300,
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
    color: Colors.gray700,
  },
  numKeyCheckText: {
    color: Colors.white,
  },
});
