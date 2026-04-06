import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';

import { ScreenWrapper } from '@components/layout/ScreenWrapper';
import { AppInput } from '@components/common/AppInput';
import { AppButton } from '@components/common/AppButton';
import { usePermissionGuard } from '@hooks/usePermissionGuard';
import { useSessionStore } from '@stores/sessionStore';
import {
  getServiceItemById,
  createServiceItem,
  updateServiceItem,
  deactivateServiceItem,
} from '@services/serviceItemService';
import { Colors, Spacing, Typography, BorderRadius } from '@constants/theme';
import type { InventoryStackParamList } from '@navigation/types';

type ServiceFormRouteProp = RouteProp<InventoryStackParamList, 'ServiceForm'>;
type ServiceFormNavigationProp = StackNavigationProp<InventoryStackParamList, 'ServiceForm'>;

type Errors = {
  name?: string;
  basePrice?: string;
};

export const ServiceFormScreen: React.FC = () => {
  const isAuthorized = usePermissionGuard('MANAGE_INVENTORY');
  const route = useRoute<ServiceFormRouteProp>();
  const navigation = useNavigation<ServiceFormNavigationProp>();
  const { serviceId } = route.params || {};
  const isEditMode = !!serviceId;

  const currentUser = useSessionStore((s) => s.user);

  const [isLoading, setIsLoading] = useState(isEditMode);
  const [isSaving, setIsSaving] = useState(false);

  const [name, setName] = useState('');
  const [basePrice, setBasePrice] = useState('');
  const [errors, setErrors] = useState<Errors>({});

  useEffect(() => {
    if (isEditMode && serviceId) {
      loadService(serviceId);
    }
  }, [isEditMode, serviceId]);

  const loadService = async (id: string) => {
    try {
      setIsLoading(true);
      const service = await getServiceItemById(id);
      if (!service) {
        Alert.alert('Error', 'Service not found.');
        navigation.goBack();
        return;
      }
      setName(service.name);
      setBasePrice(String(service.basePrice));
    } catch {
      Alert.alert('Error', 'Failed to load service.');
      navigation.goBack();
    } finally {
      setIsLoading(false);
    }
  };

  const validate = (): boolean => {
    const newErrors: Errors = {};

    if (!name.trim()) newErrors.name = 'Name is required.';

    const bp = parseFloat(basePrice);
    if (!basePrice.trim() || isNaN(bp)) {
      newErrors.basePrice = 'Base price is required.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate() || !currentUser) return;

    try {
      setIsSaving(true);

      const payload = {
        name: name.trim(),
        basePrice: parseFloat(basePrice),
      };

      if (isEditMode && serviceId) {
        await updateServiceItem(serviceId, payload, currentUser);
      } else {
        await createServiceItem(payload, currentUser);
      }

      navigation.goBack();
    } catch {
      Alert.alert('Error', 'Failed to save service. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeactivate = () => {
    if (!currentUser || !serviceId) return;

    Alert.alert(
      'Deactivate Service',
      `Deactivate "${name}"? It will no longer appear in the catalog.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Deactivate',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsSaving(true);
              await deactivateServiceItem(serviceId, currentUser);
              navigation.goBack();
            } catch {
              Alert.alert('Error', 'Failed to deactivate service.');
            } finally {
              setIsSaving(false);
            }
          },
        },
      ]
    );
  };

  if (!isAuthorized) return null;

  if (isLoading) {
    return (
      <ScreenWrapper>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Service Details</Text>

          <AppInput
            label="Name"
            placeholder="e.g. Oil Change"
            value={name}
            onChangeText={setName}
            error={errors.name}
          />

          <AppInput
            label="Base Price"
            placeholder="0.00"
            value={basePrice}
            onChangeText={setBasePrice}
            keyboardType="decimal-pad"
            error={errors.basePrice}
          />
        </View>

        <AppButton
          label={isEditMode ? 'Save Changes' : 'Create Service'}
          onPress={handleSubmit}
          loading={isSaving}
          fullWidth
          style={styles.submitButton}
        />

        {isEditMode && (
          <AppButton
            label="Deactivate Service"
            onPress={handleDeactivate}
            variant="danger"
            loading={isSaving}
            fullWidth
            style={styles.deactivateButton}
          />
        )}
      </ScrollView>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: Spacing.md,
    paddingBottom: Spacing.xxl,
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
    marginBottom: Spacing.md,
    gap: Spacing.md,
  },
  sectionTitle: {
    fontSize: Typography.lg,
    fontWeight: Typography.semiBold,
    color: Colors.gray900,
    marginBottom: Spacing.xs,
  },
  submitButton: {
    marginTop: Spacing.xs,
  },
  deactivateButton: {
    marginTop: Spacing.md,
  },
});
