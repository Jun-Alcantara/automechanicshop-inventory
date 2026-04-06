import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { AdminStackParamList } from '@navigation/types';
import { ScreenWrapper } from '@components/layout';
import { useHasPermission } from '@hooks/useHasPermission';
import type { Permission } from '@constants/permissions';

type Nav = StackNavigationProp<AdminStackParamList>;

interface MenuItemConfig {
  label: string;
  screen: keyof AdminStackParamList;
  permission: Permission | null;
}

const MENU_ITEMS: MenuItemConfig[] = [
  { label: 'Customers', screen: 'CustomerList', permission: 'CREATE_TRANSACTIONS' },
  { label: 'Reports', screen: 'Reports', permission: 'VIEW_REPORTS' },
  { label: 'Audit Log', screen: 'AuditLog', permission: 'VIEW_REPORTS' },
  { label: 'Users', screen: 'UserList', permission: 'MANAGE_USERS' },
  { label: 'Settings', screen: 'Settings', permission: 'MANAGE_SETTINGS' },
  { label: 'Change My PIN', screen: 'ChangeOwnPin', permission: null },
];

export const AdminMenuScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();

  const canCreateTransactions = useHasPermission('CREATE_TRANSACTIONS');
  const canViewReports = useHasPermission('VIEW_REPORTS');
  const canManageUsers = useHasPermission('MANAGE_USERS');
  const canManageSettings = useHasPermission('MANAGE_SETTINGS');

  const checkPermission = (permission: Permission | null) => {
    if (permission === null) return true;
    switch (permission) {
      case 'CREATE_TRANSACTIONS': return canCreateTransactions;
      case 'VIEW_REPORTS': return canViewReports;
      case 'MANAGE_USERS': return canManageUsers;
      case 'MANAGE_SETTINGS': return canManageSettings;
      default: return false;
    }
  };

  const visibleItems = MENU_ITEMS.filter((item) => checkPermission(item.permission));

  return (
    <ScreenWrapper>
      <Text style={styles.title}>Admin</Text>
      <View>
        {visibleItems.map((item) => (
          <TouchableOpacity
            key={item.screen}
            style={styles.row}
            onPress={() => navigation.navigate(item.screen as any)}
          >
            <Text style={styles.rowText}>{item.label}</Text>
            <Text style={styles.arrow}>›</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  title: { fontSize: 22, fontWeight: '700', padding: 20, color: '#111928' },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderColor: '#E5E7EB',
  },
  rowText: { fontSize: 16, color: '#111928' },
  arrow: { fontSize: 20, color: '#9CA3AF' },
});
