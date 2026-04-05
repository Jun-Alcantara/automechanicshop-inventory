import React, { useState } from 'react';
import { ScrollView, StyleSheet, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ScreenWrapper } from '@components/layout/ScreenWrapper';
import { AppInput } from '@components/common/AppInput';
import { AppButton } from '@components/common/AppButton';
import { Spacing } from '@constants/theme';
import { useSessionStore } from '@stores/sessionStore';
import { changeOwnPin } from '@services/userService';
import { isValidPin } from '@utils/pinHash';

export const ChangeOwnPinScreen: React.FC = () => {
  const navigation = useNavigation();
  const user = useSessionStore((s) => s.user);
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (currentPin.length !== 6) e.currentPin = 'Enter your current 6-digit PIN.';
    if (!isValidPin(newPin)) e.newPin = 'New PIN must be exactly 6 digits.';
    if (newPin !== confirmPin) e.confirmPin = 'PINs do not match.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!user || !validate()) return;
    setLoading(true);
    try {
      await changeOwnPin(user, currentPin, newPin);
      Alert.alert('Success', 'Your PIN has been changed.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Failed to change PIN.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenWrapper>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <AppInput
          label="Current PIN"
          value={currentPin}
          onChangeText={setCurrentPin}
          keyboardType="numeric"
          maxLength={6}
          secureTextEntry
          error={errors.currentPin}
          containerStyle={styles.field}
        />
        <AppInput
          label="New PIN"
          value={newPin}
          onChangeText={setNewPin}
          keyboardType="numeric"
          maxLength={6}
          secureTextEntry
          error={errors.newPin}
          containerStyle={styles.field}
        />
        <AppInput
          label="Confirm New PIN"
          value={confirmPin}
          onChangeText={setConfirmPin}
          keyboardType="numeric"
          maxLength={6}
          secureTextEntry
          error={errors.confirmPin}
          containerStyle={styles.field}
        />
        <AppButton
          label="Save New PIN"
          onPress={handleSave}
          loading={loading}
          fullWidth
          style={styles.button}
        />
      </ScrollView>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  container: { padding: Spacing.xl },
  field: { marginBottom: Spacing.md },
  button: { marginTop: Spacing.lg },
});
