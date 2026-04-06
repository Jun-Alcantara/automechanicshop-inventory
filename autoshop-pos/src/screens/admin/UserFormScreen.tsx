import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, Alert, ActivityIndicator } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';

import { ScreenWrapper } from '@components/layout/ScreenWrapper';
import { AppInput } from '@components/common/AppInput';
import { AppButton } from '@components/common/AppButton';
import { usePermissionGuard } from '@hooks/usePermissionGuard';
import { useSessionStore } from '@stores/sessionStore';
import { getUser, createUser, updateUser } from '@services/userService';
import { PERMISSIONS } from '@constants/permissions';
import type { AdminStackParamList } from '@navigation/types';
import type { User, Permission } from '@/types';
import { Colors, Spacing, Typography, BorderRadius } from '@constants/theme';

type UserFormRouteProp = RouteProp<AdminStackParamList, 'UserForm'>;
type UserFormNavigationProp = StackNavigationProp<AdminStackParamList, 'UserForm'>;

export const UserFormScreen: React.FC = () => {
  const isAuthorized = usePermissionGuard('MANAGE_USERS');
  const route = useRoute<UserFormRouteProp>();
  const navigation = useNavigation<UserFormNavigationProp>();
  const { userId } = route.params || {};
  const isEditMode = !!userId;

  const currentUser = useSessionStore((state) => state.user);

  const [isLoading, setIsLoading] = useState(isEditMode);
  const [isSaving, setIsSaving] = useState(false);
  
  const [userToEdit, setUserToEdit] = useState<User | null>(null);
  
  const [displayName, setDisplayName] = useState('');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState<Set<Permission>>(new Set());
  const [isActive, setIsActive] = useState(true);

  const [errors, setErrors] = useState<{ displayName?: string; pin?: string; confirmPin?: string }>({});

  useEffect(() => {
    if (isEditMode && userId) {
      loadUser(userId);
    }
  }, [isEditMode, userId]);

  const loadUser = async (id: string) => {
    try {
      setIsLoading(true);
      const user = await getUser(id);
      setUserToEdit(user);
      setDisplayName(user.displayName);
      setSelectedPermissions(new Set(user.permissions));
      setIsActive(user.isActive);
    } catch (error) {
      Alert.alert('Error', 'Failed to load user details.');
      navigation.goBack();
    } finally {
      setIsLoading(false);
    }
  };

  const togglePermission = (permission: Permission) => {
    if (userToEdit?.isMainAdmin) return; // Main admin has all permissions
    const newPerms = new Set(selectedPermissions);
    if (newPerms.has(permission)) {
      newPerms.delete(permission);
    } else {
      newPerms.add(permission);
    }
    setSelectedPermissions(newPerms);
  };

  const toggleActiveStatus = async () => {
    if (!currentUser || !userToEdit) return;
    const newStatus = !isActive;
    
    if (!newStatus) {
      Alert.alert(
        'Deactivate User',
        'Are you sure you want to deactivate this user?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Deactivate',
            style: 'destructive',
            onPress: async () => {
              try {
                setIsSaving(true);
                await deactivateUser(currentUser, userToEdit.id);
                setIsActive(false);
                Alert.alert('Success', 'User has been deactivated.');
              } catch (error) {
                Alert.alert('Error', 'Failed to deactivate user.');
              } finally {
                setIsSaving(false);
              }
            },
          },
        ]
      );
    } else {
      Alert.alert(
        'Activate User',
        'Are you sure you want to activate this user?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Activate',
            style: 'default',
            onPress: async () => {
              try {
                setIsSaving(true);
                await updateUser(currentUser, userToEdit.id, { isActive: true });
                setIsActive(true);
                Alert.alert('Success', 'User has been activated.');
              } catch (error) {
                Alert.alert('Error', 'Failed to update user status.');
              } finally {
                setIsSaving(false);
              }
            },
          },
        ]
      );
    }
  };

  const validate = () => {
    const newErrors: { displayName?: string; pin?: string; confirmPin?: string } = {};
    if (!displayName.trim()) {
      newErrors.displayName = 'Display name is required.';
    }
    
    if (!isEditMode && !pin.trim()) {
      newErrors.pin = 'PIN is required for new users.';
    } else if (pin && pin.length < 4) {
      newErrors.pin = 'PIN must be at least 4 digits.';
    } else if (pin && !/^\d+$/.test(pin)) {
      newErrors.pin = 'PIN must contain only numbers.';
    }

    if (pin || !isEditMode) {
      if (pin !== confirmPin) {
        newErrors.confirmPin = 'PINs do not match.';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate() || !currentUser) return;

    try {
      setIsSaving(true);
      const permissionsArray = Array.from(selectedPermissions);

      if (isEditMode && userId) {
        const updates: { displayName?: string; pin?: string; permissions?: Permission[] } = {
          displayName: displayName.trim(),
          permissions: permissionsArray,
        };
        if (pin) updates.pin = pin;
        
        await updateUser(currentUser, userId, updates);
        Alert.alert('Success', 'User updated successfully.');
      } else {
        await createUser(currentUser, displayName.trim(), pin, permissionsArray);
        Alert.alert('Success', 'User created successfully.');
      }
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', 'Failed to save user.');
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
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>User Details</Text>
          <AppInput
            label="Display Name"
            placeholder="e.g. John Doe"
            value={displayName}
            onChangeText={setDisplayName}
            error={errors.displayName}
            editable={!userToEdit?.isMainAdmin}
          />
          <AppInput
            label={isEditMode ? "New PIN (Leave blank to keep current)" : "PIN"}
            placeholder="****"
            value={pin}
            onChangeText={setPin}
            secureTextEntry
            keyboardType="number-pad"
            maxLength={6}
            error={errors.pin}
          />
          {(!isEditMode || pin.length > 0) && (
            <AppInput
              label="Confirm PIN"
              placeholder="****"
              value={confirmPin}
              onChangeText={setConfirmPin}
              secureTextEntry
              keyboardType="number-pad"
              maxLength={6}
              error={errors.confirmPin}
            />
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Permissions</Text>
          {Object.values(PERMISSIONS).map((permission) => (
            <View key={permission} style={styles.permissionRow}>
              <Text style={styles.permissionText}>
                {permission.replace(/_/g, ' ')}
              </Text>
              <Switch
                value={userToEdit?.isMainAdmin ? true : selectedPermissions.has(permission)}
                onValueChange={() => togglePermission(permission)}
                disabled={userToEdit?.isMainAdmin || (permission === 'MANAGE_USERS' && !currentUser?.isMainAdmin)}
                trackColor={{ false: Colors.gray300, true: Colors.primary }}
              />
            </View>
          ))}
        </View>

        <AppButton
          label={isEditMode ? 'Save Changes' : 'Create User'}
          onPress={handleSave}
          loading={isSaving}
          fullWidth
          style={styles.saveButton}
        />

        {isEditMode && userToEdit && !userToEdit.isMainAdmin && (
          <AppButton
            label={isActive ? 'Deactivate User' : 'Activate User'}
            onPress={toggleActiveStatus}
            variant={isActive ? 'danger' : 'secondary'}
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
  permissionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.xs,
  },
  permissionText: {
    fontSize: Typography.base,
    color: Colors.gray900,
  },
  saveButton: {
    marginTop: Spacing.md,
  },
  deactivateButton: {
    marginTop: Spacing.md,
  },
});
