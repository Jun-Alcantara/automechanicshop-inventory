import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { DashboardScreen } from '@screens/dashboard/DashboardScreen';
import { TransactionsStack } from './TransactionsStack';
import { InventoryStack } from './InventoryStack';
import { AdminStack } from './AdminStack';
import { Colors, Typography } from '@constants/theme';
import type { MainTabParamList } from './types';

const Tab = createBottomTabNavigator<MainTabParamList>();

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

function tabIcon(active: IoniconName, inactive: IoniconName) {
  return ({ color, size }: { color: string; size: number }) => (
    <Ionicons name={color === Colors.primary ? active : inactive} size={size} color={color} />
  );
}

export const MainTabNavigator: React.FC = () => (
  <Tab.Navigator
    screenOptions={{
      headerShown: false,
      tabBarActiveTintColor: Colors.primary,
      tabBarInactiveTintColor: Colors.gray500,
      tabBarLabelStyle: { fontSize: Typography.xs, fontWeight: '600' },
    }}
  >
    <Tab.Screen
      name="Dashboard"
      component={DashboardScreen}
      options={{
        title: 'Dashboard',
        tabBarIcon: tabIcon('grid', 'grid-outline'),
      }}
    />
    <Tab.Screen
      name="Transactions"
      component={TransactionsStack}
      options={{
        title: 'Transactions',
        tabBarIcon: tabIcon('receipt', 'receipt-outline'),
      }}
    />
    <Tab.Screen
      name="Inventory"
      component={InventoryStack}
      options={{
        title: 'Inventory',
        tabBarIcon: tabIcon('cube', 'cube-outline'),
      }}
    />
    <Tab.Screen
      name="Admin"
      component={AdminStack}
      options={{
        title: 'Admin',
        tabBarIcon: tabIcon('shield', 'shield-outline'),
      }}
    />
  </Tab.Navigator>
);
