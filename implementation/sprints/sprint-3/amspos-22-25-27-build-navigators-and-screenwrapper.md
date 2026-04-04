# AMSPOS-22, 23, 24, 25, 27: Build Tab Navigators, Stacks, and ScreenWrapper

**Sprint**: Sprint 3 — Navigation Setup
**Effort**: 3.5 days combined (Tasks 22, 23, 24, 25, 27)
**Dependencies**: AMSPOS-21
**Phase**: Foundation

---

## Description

Build all remaining navigation structures:
- `MainTabNavigator` (4 tabs: Dashboard, Transactions, Inventory, Admin)
- `TransactionsStack` (transaction flow screens)
- `InventoryStack` (inventory management screens)
- `AdminStack` (admin section screens)
- `ScreenWrapper` (layout wrapper for all content screens)

All screen components used here are stubs — just a `<View><Text>Screen name</Text></View>` placeholder until their sprint. The navigators are the wiring, not the screens.

---

## Instructions

### 1. `src/navigation/MainTabNavigator.tsx` (Task 22)

```typescript
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
```

> Tab icons will be added when a vector icon library is available. For now, use text-only tabs.

### 2. `src/navigation/TransactionsStack.tsx` (Task 24)

```typescript
import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { TransactionListScreen } from '@screens/transactions/TransactionListScreen';
import { NewTransactionScreen } from '@screens/transactions/NewTransactionScreen';
import { TransactionDetailScreen } from '@screens/transactions/TransactionDetailScreen';
import { PaymentScreen } from '@screens/transactions/PaymentScreen';
import { ReceiptScreen } from '@screens/transactions/ReceiptScreen';
import { TransactionHistoryDetailScreen } from '@screens/transactions/TransactionHistoryDetailScreen';
import { VoidTransactionScreen } from '@screens/transactions/VoidTransactionScreen';
import { ReturnTransactionScreen } from '@screens/transactions/ReturnTransactionScreen';
import type { TransactionsStackParamList } from './types';

const Stack = createStackNavigator<TransactionsStackParamList>();

export const TransactionsStack: React.FC = () => (
  <Stack.Navigator screenOptions={{ headerShown: true }}>
    <Stack.Screen name="TransactionList" component={TransactionListScreen} options={{ title: 'Transactions' }} />
    <Stack.Screen name="NewTransaction" component={NewTransactionScreen} options={{ title: 'New Transaction' }} />
    <Stack.Screen name="TransactionDetail" component={TransactionDetailScreen} options={{ title: 'Transaction' }} />
    <Stack.Screen name="Payment" component={PaymentScreen} options={{ title: 'Payment' }} />
    <Stack.Screen name="Receipt" component={ReceiptScreen} options={{ title: 'Receipt' }} />
    <Stack.Screen name="TransactionHistoryDetail" component={TransactionHistoryDetailScreen} options={{ title: 'Transaction Details' }} />
    <Stack.Screen name="VoidTransaction" component={VoidTransactionScreen} options={{ title: 'Void Transaction' }} />
    <Stack.Screen name="ReturnTransaction" component={ReturnTransactionScreen} options={{ title: 'Process Return' }} />
  </Stack.Navigator>
);
```

### 3. `src/navigation/InventoryStack.tsx` (Task 25)

```typescript
import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { InventoryListScreen } from '@screens/inventory/InventoryListScreen';
import { ProductFormScreen } from '@screens/inventory/ProductFormScreen';
import { ServiceFormScreen } from '@screens/inventory/ServiceFormScreen';
import { CategoryListScreen } from '@screens/inventory/CategoryListScreen';
import { SupplierListScreen } from '@screens/inventory/SupplierListScreen';
import { AddOnCatalogScreen } from '@screens/inventory/AddOnCatalogScreen';
import type { InventoryStackParamList } from './types';

const Stack = createStackNavigator<InventoryStackParamList>();

export const InventoryStack: React.FC = () => (
  <Stack.Navigator screenOptions={{ headerShown: true }}>
    <Stack.Screen name="InventoryList" component={InventoryListScreen} options={{ title: 'Inventory' }} />
    <Stack.Screen name="ProductForm" component={ProductFormScreen} options={({ route }) => ({ title: route.params?.productId ? 'Edit Product' : 'New Product' })} />
    <Stack.Screen name="ServiceForm" component={ServiceFormScreen} options={({ route }) => ({ title: route.params?.serviceId ? 'Edit Service' : 'New Service' })} />
    <Stack.Screen name="CategoryList" component={CategoryListScreen} options={{ title: 'Categories' }} />
    <Stack.Screen name="SupplierList" component={SupplierListScreen} options={{ title: 'Suppliers' }} />
    <Stack.Screen name="AddOnCatalog" component={AddOnCatalogScreen} options={{ title: 'Add-On Catalog' }} />
  </Stack.Navigator>
);
```

### 4. `src/navigation/AdminStack.tsx` (Task 26 — deferred to Sprint 4)

Stub file:

```typescript
// Fully implemented in AMSPOS-26 (Sprint 4)
export const AdminStack: React.FC = () => null as any;
```

### 5. Placeholder screen stubs

Create placeholder files for every screen that doesn't exist yet. This is needed so the navigator imports compile. Each stub:

```typescript
// Example: src/screens/transactions/TransactionListScreen.tsx
import React from 'react';
import { View, Text } from 'react-native';
export const TransactionListScreen: React.FC = () => (
  <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
    <Text>Transaction List (Coming Soon)</Text>
  </View>
);
```

Create stubs for all screens in `transactions/`, `inventory/`, `admin/`, `dashboard/`.

### 6. `src/components/layout/ScreenWrapper.tsx` (Task 27)

```typescript
import React from 'react';
import { SafeAreaView, StyleSheet, ViewStyle } from 'react-native';
import { Colors } from '@constants/theme';
import { useSessionStore } from '@stores/sessionStore';

interface ScreenWrapperProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export const ScreenWrapper: React.FC<ScreenWrapperProps> = ({ children, style }) => {
  const { refreshActivity } = useSessionStore();

  return (
    <SafeAreaView
      style={[styles.container, style]}
      onStartShouldSetResponder={() => {
        refreshActivity();
        return false; // don't consume — let events pass through
      }}
    >
      {children}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
});
```

---

## Acceptance Criteria

- [ ] `MainTabNavigator` renders 4 tabs: Dashboard, Transactions, Inventory, Admin
- [ ] `TransactionsStack` registers all 8 transaction screens with correct param types
- [ ] `InventoryStack` registers all 6 inventory screens with correct param types
- [ ] `AdminStack` stub compiles without error
- [ ] All screen stubs exist and compile
- [ ] `ScreenWrapper` is a `SafeAreaView` that calls `refreshActivity()` on touch
- [ ] Navigation between tabs works on emulator
- [ ] No TypeScript errors

## Definition of Done

- All acceptance criteria are met
- Tab navigation tested on Android emulator
- Code committed to `main`
