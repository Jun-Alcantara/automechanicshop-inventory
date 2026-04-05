import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { DashboardScreen } from '@screens/dashboard/DashboardScreen';
import { TransactionsStack } from './TransactionsStack';
import { InventoryStack } from './InventoryStack';
import { AdminStack } from './AdminStack';
import { Colors, Typography } from '@constants/theme';
import type { MainTabParamList } from './types';

const Tab = createBottomTabNavigator<MainTabParamList>();

export const MainTabNavigator: React.FC = () => (
  <Tab.Navigator
    screenOptions={{
      headerShown: false,
      tabBarActiveTintColor: Colors.primary,
      tabBarInactiveTintColor: Colors.gray500,
      tabBarLabelStyle: { fontSize: Typography.xs, fontWeight: '600' },
    }}
  >
    <Tab.Screen name="Dashboard" component={DashboardScreen} options={{ title: 'Dashboard' }} />
    <Tab.Screen name="Transactions" component={TransactionsStack} options={{ title: 'Transactions' }} />
    <Tab.Screen name="Inventory" component={InventoryStack} options={{ title: 'Inventory' }} />
    <Tab.Screen name="Admin" component={AdminStack} options={{ title: 'Admin' }} />
  </Tab.Navigator>
);
