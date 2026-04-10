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

import { AppInput } from '@components/common/AppInput';
import { AppButton } from '@components/common/AppButton';

import { useSessionStore } from '@stores/sessionStore';
import {
  createCustomer,
  updateCustomer,
  searchCustomers,
} from '@services/customerService';
import { database } from '@services/database';
import { CustomerModel } from '../../models/CustomerModel';
import type { Customer } from '@/types';
import { Colors, Spacing, Typography, BorderRadius } from '@constants/theme';

type CustomerType = 'NAMED' | 'WALKIN';

interface CustomerFormProps {
  customerId?: string | undefined;
  onSuccess: (customer: Customer) => void;
  onCancel: () => void;
}

export const CustomerForm: React.FC<CustomerFormProps> = ({
  customerId,
  onSuccess,
  onCancel,
}) => {
  const currentUser = useSessionStore((s) => s.user);
  const isEditMode = !!customerId;

  const [isLoading, setIsLoading] = useState(isEditMode);
  const [isSaving, setIsSaving] = useState(false);

  const [type, setType] = useState<CustomerType>('NAMED');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  const [errors, setErrors] = useState<{ name?: string }>({});

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
        onCancel();
      })
      .finally(() => setIsLoading(false));
  }, [isEditMode, customerId, onCancel]);

  const validate = (): boolean => {
    if (!name.trim()) {
      setErrors({ name: 'Name is required.' });
      return false;
    }
    setErrors({});
    return true;
  };

  const doCreate = async (): Promise<Customer> => {
    if (!currentUser) throw new Error('No current user');
    const input: { type: CustomerType; name: string; phone?: string; email?: string } = {
      type,
      name: name.trim(),
    };
    if (phone.trim()) input.phone = phone.trim();
    if (email.trim()) input.email = email.trim();
    return createCustomer(input, currentUser);
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
                onPress: () => onSuccess(duplicate),
              },
              {
                text: 'No, Create New',
                onPress: async () => {
                  setIsSaving(true);
                  try {
                    const customer = await doCreate();
                    onSuccess(customer);
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

        const customer = await doCreate();
        onSuccess(customer);
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
        // Re-fetch the updated model to pass back to onSuccess
        const updated = await database.get<CustomerModel>('customers').find(customerId);
        onSuccess({ id: updated.id, type: updated.type as CustomerType, name: updated.name, phone: updated.phone, email: updated.email, isActive: updated.isActive, createdAt: updated.createdAt, createdBy: updated.createdBy });
      } else {
        const customer = await doCreate();
        onSuccess(customer);
      }
    } catch {
      Alert.alert('Error', 'Failed to save customer.');
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

      <View style={styles.actions}>
        <AppButton
          label="Cancel"
          onPress={onCancel}
          variant="secondary"
          fullWidth
        />
        <AppButton
          label={isEditMode ? 'Save Changes' : 'Create Customer'}
          onPress={handleSubmit}
          loading={isSaving}
          fullWidth
        />
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
  actions: {
    gap: Spacing.sm,
  },
});
