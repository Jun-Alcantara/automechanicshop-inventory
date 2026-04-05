import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { AdminStackParamList } from '@navigation/types';

type Nav = StackNavigationProp<AdminStackParamList>;

const MENU_ITEMS: { label: string; screen: keyof AdminStackParamList }[] = [
  { label: 'Settings', screen: 'Settings' },
  { label: 'Change My PIN', screen: 'ChangeOwnPin' },
  { label: 'Users', screen: 'UserList' },
  { label: 'Customers', screen: 'CustomerList' },
  { label: 'Reports', screen: 'Reports' },
  { label: 'Audit Log', screen: 'AuditLog' },
];

export const AdminMenuScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Admin</Text>
      {MENU_ITEMS.map((item) => (
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
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
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
