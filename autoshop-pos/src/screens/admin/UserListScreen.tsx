import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';

import { ScreenWrapper } from '@components/layout/ScreenWrapper';
import { EmptyState } from '@components/common/EmptyState';
import { AppBadge } from '@components/common/AppBadge';
import { AppButton } from '@components/common/AppButton';

import { useUserStore } from '@stores/userStore';
import { usePermissionGuard } from '@hooks/usePermissionGuard';
import type { User } from '@/types';
import type { AdminStackParamList } from '@navigation/types';
import { Colors, Spacing, Typography, BorderRadius } from '@constants/theme';

type NavigationProp = StackNavigationProp<AdminStackParamList, 'UserList'>;

export const UserListScreen: React.FC = () => {
  const isAuthorized = usePermissionGuard('MANAGE_USERS');
  const { users } = useUserStore();
  const navigation = useNavigation<NavigationProp>();

  if (!isAuthorized) return null;

  const handleCreateUser = () => {
    navigation.navigate('UserForm', {});
  };

  const handleEditUser = (userId: string) => {
    navigation.navigate('UserForm', { userId });
  };

  const renderItem = ({ item }: { item: User }) => {
    const isActive = item.isActive;
    return (
      <TouchableOpacity
        style={[styles.row, !isActive && styles.rowDeactivated]}
        onPress={() => handleEditUser(item.id)}
        activeOpacity={0.7}
      >
        <View style={styles.rowContent}>
          <Text style={styles.displayName}>{item.displayName}</Text>
          <Text style={styles.permissionsCount}>
            {item.permissions.length} permission{item.permissions.length === 1 ? '' : 's'}
          </Text>
        </View>
        <AppBadge
          label={isActive ? 'Active' : 'Deactivated'}
          variant={isActive ? 'success' : 'neutral'}
        />
      </TouchableOpacity>
    );
  };

  return (
    <ScreenWrapper>
      <FlatList
        data={users}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <EmptyState
            title="No Users Found"
            subtitle="Tap the button below to add a new user."
          />
        }
      />
      <View style={styles.fabContainer}>
        <AppButton label="New User" onPress={handleCreateUser} />
      </View>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  listContainer: {
    padding: Spacing.md,
    flexGrow: 1,
    paddingBottom: 100,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  rowDeactivated: {
    opacity: 0.4,
  },
  rowContent: {
    flex: 1,
    marginRight: Spacing.md,
  },
  displayName: {
    fontSize: Typography.base,
    fontWeight: Typography.semiBold,
    color: Colors.gray900,
    marginBottom: Spacing.xs,
  },
  permissionsCount: {
    fontSize: Typography.sm,
    color: Colors.gray500,
  },
  fabContainer: {
    position: 'absolute',
    bottom: Spacing.xl,
    right: Spacing.md,
    left: Spacing.md,
  },
});
