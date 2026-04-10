import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { AppInput } from '@components/common/AppInput';
import { AppButton } from '@components/common/AppButton';
import { useSessionStore } from '@stores/sessionStore';
import { createVehicle, updateVehicle } from '@services/vehicleService';
import { database } from '@services/database';
import { VehicleModel } from '../../models/VehicleModel';
import { Colors, Spacing, BorderRadius } from '@constants/theme';

interface Props {
  customerId: string;
  vehicleId?: string;
  onSaved: () => void;
  onCancel?: () => void;
  submitLabel?: string;
}

export const VehicleForm: React.FC<Props> = ({
  customerId,
  vehicleId,
  onSaved,
  onCancel,
  submitLabel,
}) => {
  const isEditMode = !!vehicleId;
  const currentUser = useSessionStore((s) => s.user);

  const [isLoading, setIsLoading] = useState(isEditMode);
  const [isSaving, setIsSaving] = useState(false);

  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [color, setColor] = useState('');
  const [plateNumber, setPlateNumber] = useState('');
  const [errors, setErrors] = useState<{ make?: string }>({});

  useEffect(() => {
    if (!isEditMode || !vehicleId) return;

    database.get<VehicleModel>('vehicles')
      .find(vehicleId)
      .then((v) => {
        setMake(v.make);
        setModel(v.model ?? '');
        setColor(v.color ?? '');
        setPlateNumber(v.plateNumber ?? '');
      })
      .catch(() => {
        Alert.alert('Error', 'Failed to load vehicle.');
        onCancel?.();
      })
      .finally(() => setIsLoading(false));
  }, [isEditMode, vehicleId, onCancel]);

  const validate = (): boolean => {
    if (!make.trim()) {
      setErrors({ make: 'Make is required.' });
      return false;
    }
    setErrors({});
    return true;
  };

  const handleSubmit = async () => {
    if (!validate() || !currentUser) return;

    setIsSaving(true);
    try {
      if (isEditMode && vehicleId) {
        const patch: Parameters<typeof updateVehicle>[1] = { make: make.trim() };
        if (model.trim()) patch.model = model.trim();
        if (color.trim()) patch.color = color.trim();
        if (plateNumber.trim()) patch.plateNumber = plateNumber.trim();
        await updateVehicle(vehicleId, patch, currentUser);
      } else {
        const input: Parameters<typeof createVehicle>[0] = { customerId, make: make.trim() };
        if (model.trim()) input.model = model.trim();
        if (color.trim()) input.color = color.trim();
        if (plateNumber.trim()) input.plateNumber = plateNumber.trim();
        await createVehicle(input, currentUser);
      }
      onSaved();
    } catch {
      Alert.alert('Error', 'Failed to save vehicle.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.section}>
        <AppInput
          label="Make"
          placeholder="e.g. Toyota"
          value={make}
          onChangeText={setMake}
          error={errors.make}
          autoCapitalize="words"
          autoFocus={!isEditMode}
        />
        <AppInput
          label="Model"
          placeholder="e.g. Vios"
          value={model}
          onChangeText={setModel}
          autoCapitalize="words"
        />
        <AppInput
          label="Color"
          placeholder="e.g. Silver"
          value={color}
          onChangeText={setColor}
          autoCapitalize="words"
        />
        <AppInput
          label="Plate Number"
          placeholder="e.g. ABC 1234"
          value={plateNumber}
          onChangeText={setPlateNumber}
          autoCapitalize="characters"
        />
      </View>

      <View style={styles.actions}>
        <AppButton
          label={submitLabel ?? (isEditMode ? 'Save Changes' : 'Add Vehicle')}
          onPress={handleSubmit}
          loading={isSaving}
          fullWidth
        />
        {onCancel && (
          <AppButton
            label="Cancel"
            variant="secondary"
            onPress={onCancel}
            fullWidth
          />
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: Spacing.md,
    paddingBottom: Spacing.xxl,
    gap: Spacing.md,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    backgroundColor: Colors.white,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.md,
  },
  actions: {
    gap: Spacing.sm,
  },
});
