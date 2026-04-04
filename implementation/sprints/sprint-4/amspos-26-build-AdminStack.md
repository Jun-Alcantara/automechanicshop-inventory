# AMSPOS-26: Build AdminStack Navigator

**Sprint**: Sprint 4 — Admin Stack & Settings Infrastructure
**Effort**: 1 day
**Dependencies**: AMSPOS-21
**Phase**: Foundation

---

## Description

Create `src/navigation/AdminStack.tsx` with all Admin section screens. These include Reports, Audit Logs, Customer management, User management, Settings, and ChangeOwnPin.

---

## Instructions

### 1. `src/navigation/AdminStack.tsx`

```typescript
import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { AdminMenuScreen } from '@screens/admin/AdminMenuScreen';
import { ReportsScreen } from '@screens/admin/ReportsScreen';
import { AuditLogScreen } from '@screens/admin/AuditLogScreen';
import { CustomerListScreen } from '@screens/admin/CustomerListScreen';
import { CustomerDetailScreen } from '@screens/admin/CustomerDetailScreen';
import { CustomerFormScreen } from '@screens/admin/CustomerFormScreen';
import { VehicleDetailScreen } from '@screens/admin/VehicleDetailScreen';
import { VehicleFormScreen } from '@screens/admin/VehicleFormScreen';
import { UserListScreen } from '@screens/admin/UserListScreen';
import { UserFormScreen } from '@screens/admin/UserFormScreen';
import { SettingsScreen } from '@screens/admin/SettingsScreen';
import { ChangeOwnPinScreen } from '@screens/admin/ChangeOwnPinScreen';
import type { AdminStackParamList } from './types';

const Stack = createStackNavigator<AdminStackParamList>();

export const AdminStack: React.FC = () => (
  <Stack.Navigator screenOptions={{ headerShown: true }}>
    <Stack.Screen name="AdminMenu" component={AdminMenuScreen} options={{ title: 'Admin' }} />
    <Stack.Screen name="Reports" component={ReportsScreen} options={{ title: 'Reports' }} />
    <Stack.Screen name="AuditLog" component={AuditLogScreen} options={{ title: 'Audit Log' }} />
    <Stack.Screen name="CustomerList" component={CustomerListScreen} options={{ title: 'Customers' }} />
    <Stack.Screen name="CustomerDetail" component={CustomerDetailScreen} options={{ title: 'Customer' }} />
    <Stack.Screen name="CustomerForm" component={CustomerFormScreen} options={({ route }) => ({ title: route.params?.customerId ? 'Edit Customer' : 'New Customer' })} />
    <Stack.Screen name="VehicleDetail" component={VehicleDetailScreen} options={{ title: 'Vehicle' }} />
    <Stack.Screen name="VehicleForm" component={VehicleFormScreen} options={({ route }) => ({ title: route.params?.vehicleId ? 'Edit Vehicle' : 'New Vehicle' })} />
    <Stack.Screen name="UserList" component={UserListScreen} options={{ title: 'Users' }} />
    <Stack.Screen name="UserForm" component={UserFormScreen} options={({ route }) => ({ title: route.params?.userId ? 'Edit User' : 'New User' })} />
    <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: 'Settings' }} />
    <Stack.Screen name="ChangeOwnPin" component={ChangeOwnPinScreen} options={{ title: 'Change PIN' }} />
  </Stack.Navigator>
);
```

### 2. Ensure all admin screen stubs exist

All admin screens were stubbed in AMSPOS-22-25-27. Verify the stubs exist. If any are missing, create them with the placeholder pattern from that task.

---

## Acceptance Criteria

- [ ] `AdminStack` registers all 12 admin screens
- [ ] Dynamic titles for form screens (Create vs Edit) based on route params
- [ ] All screen imports resolve (stubs exist)
- [ ] No TypeScript errors

## Definition of Done

- All acceptance criteria are met
- Admin tab navigates to AdminMenu stub
- Code committed to `main`
