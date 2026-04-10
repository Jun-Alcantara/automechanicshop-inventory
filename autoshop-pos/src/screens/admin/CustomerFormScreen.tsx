import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
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
  createCustomer,
  updateCustomer,
  searchCustomers,
} from '@services/customerService';
import { database } from '@services/database';
import { CustomerModel } from '../../models/CustomerModel';
import type { AdminStackParamList } from '@navigation/types';
import { Colors, Spacing, Typography, BorderRadius } from '@constants/theme';

type CustomerFormRouteProp = RouteProp<AdminStackParamList, 'CustomerForm'>;
type CustomerFormNavigationProp = StackNavigationProp<AdminStackParamList, 'CustomerForm'>;

type CustomerType = 'NAMED' | 'WALKIN';

export const CustomerFormScreen: React.FC = () => {
  const isAuthorized = usePermissionGuard('CREATE_TRANSACTIONS');
  const route = useRoute<CustomerFormRouteProp>();
  const navigation = useNavigation<CustomerFormNavigationProp>();
  const currentUser = useSessionStore((s) => s.user);

  const { customerId } = route.params ?? {};
  const isEditMode = !!customerId;

  const [isLoading, setIsLoading] = useState(isEditMode);
  const [isSaving, setIsSaving] = useState(false);

  const [type, setType] = useState<CustomerType>('NAMED');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  const [errors, setErrors] = useState<{ name?: string }>({});

  // Pre-fill in edit mode
  useEffect(() => {
    if (!isEditMode || !customerId) return;

    database.get<CustomerModel>('customers')
      .find(customerId)
      .then((model) => {
        setType(model.type as CustomerType);
        setName(model.name);
        setPhone(model.phone ?? '');
        setEmail(model.email ?? '');
      })
      .catch(() => {
        Alert.alert('Error', 'Failed to load customer.');
        navigation.goBack();
      })
      .finally(() => setIsLoading(false));
  }, [isEditMode, customerId, navigation]);

  const validate = (): boolean => {
    if (!name.trim()) {
      setErrors({ name: 'Name is required.' });
      return false;
    }
    setErrors({});
    return true;
  };

  const doCreate = async () => {
    if (!currentUser) return;
    const input: { type: CustomerType; name: string; phone?: string; email?: string } = {
      type,
      name: name.trim(),
    };
    if (phone.trim()) input.phone = phone.trim();
    if (email.trim()) input.email = email.trim();
    await createCustomer(input, currentUser);
    navigation.goBack();
  };

  const handleSubmit = async () => {
    if (!validate() || !currentUser) return;

    // Walk-in duplicate check (create mode only)
    if (!isEditMode && type === 'WALKIN') {
      setIsSaving(true);
      try {
        const matches = await searchCustomers(name.trim());
        const duplicate = matches.find(
          (c) => c.type === 'WALKIN' && c.name.toLowerCase() === name.trim().toLowerCase()
        );

        if (duplicate) {
          setIsSaving(false);
          Alert.alert(
            'Duplicate Nickname',
            'A walk-in with this nickname already exists. Link to existing record?',
            [
              {
                text: 'Yes, Link',
                onPress: () => {
                  navigation.navigate('CustomerDetail', { customerId: duplicate.id });
                },
              },
              {
                text: 'No, Create New',
                onPress: async () => {
                  setIsSaving(true);
                  try {
                    await doCreate();
                  } catch {
                    Alert.alert('Error', 'Failed to create customer.');
                  } finally {
                    setIsSaving(false);
                  }
                },
              },
            ]
          );
          return;
        }

        await doCreate();
      } catch {
        Alert.alert('Error', 'Failed to create customer.');
      } finally {
        setIsSaving(false);
      }
      return;
    }

    setIsSaving(true);
    try {
      if (isEditMode && customerId) {
        const patch: { name?: string; phone?: string; email?: string } = {
          name: name.trim(),
        };
        if (phone.trim()) patch.phone = phone.trim();
        if (email.trim()) patch.email = email.trim();
        await updateCustomer(customerId, patch, currentUser);
      } else {
        await doCreate();
      }
    } catch {
      Alert.alert('Error', 'Failed to save customer.');
    } finally {
      setIsSaving(false);
    }
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

          {/* Type toggle — create mode only */}
          {!isEditMode && (
            <View>
              <Text style={styles.fieldLabel}>Type</Text>
              <View style={styles.toggleRow}>
                <TouchableOpacity
                  style={[styles.toggleOption, type === 'NAMED' && styles.toggleOptionActive]}
                  onPress={() => setType('NAMED')}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.toggleText, type === 'NAMED' && styles.toggleTextActive]}>
                    Named
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.toggleOption, type === 'WALKIN' && styles.toggleOptionActive]}
                  onPress={() => setType('WALKIN')}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.toggleText, type === 'WALKIN' && styles.toggleTextActive]}>
                    Walk-in
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          <AppInput
            label={type === 'WALKIN' ? 'Nickname' : 'Full Name'}
            placeholder={type === 'WALKIN' ? 'e.g. Regular Customer' : 'e.g. Juan dela Cruz'}
            value={name}
            onChangeText={setName}
            error={errors.name}
            autoCapitalize="words"
          />

          <AppInput
            label="Phone"
            placeholder="e.g. 09171234567"
            value={phone}
            onChangeText={setPhone}
            keyboardType="numeric"
          />

          <AppInput
            label="Email"
            placeholder="e.g. juan@email.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        <AppButton
          label={isEditMode ? 'Save Changes' : 'Create Customer'}
          onPress={handleSubmit}
          loading={isSaving}
          fullWidth
        />
      </ScrollView>
    </ScreenWrapper>
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
  fieldLabel: {
    fontSize: Typography.sm,
    fontWeight: Typography.medium,
    color: Colors.gray700,
    marginBottom: Spacing.xs,
  },
  toggleRow: {
    flexDirection: 'row',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  toggleOption: {
    flex: 1,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    backgroundColor: Colors.surface,
  },
  toggleOptionActive: {
    backgroundColor: Colors.primary,
  },
  toggleText: {
    fontSize: Typography.base,
    color: Colors.gray700,
    fontWeight: Typography.medium,
  },
  toggleTextActive: {
    color: Colors.white,
    fontWeight: Typography.semiBold,
  },
});
