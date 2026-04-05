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
    <Stack.Screen name="InventoryList" component={InventoryListScreen} options={{ headerShown: false }} />
    <Stack.Screen name="ProductForm" component={ProductFormScreen} options={({ route }) => ({ title: route.params?.productId ? 'Edit Product' : 'New Product' })} />
    <Stack.Screen name="ServiceForm" component={ServiceFormScreen} options={({ route }) => ({ title: route.params?.serviceId ? 'Edit Service' : 'New Service' })} />
    <Stack.Screen name="CategoryList" component={CategoryListScreen} options={{ title: 'Categories' }} />
    <Stack.Screen name="SupplierList" component={SupplierListScreen} options={{ title: 'Suppliers' }} />
    <Stack.Screen name="AddOnCatalog" component={AddOnCatalogScreen} options={{ title: 'Add-On Catalog' }} />
  </Stack.Navigator>
);
