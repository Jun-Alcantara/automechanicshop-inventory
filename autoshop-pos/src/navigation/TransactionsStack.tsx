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
import { VehicleSelectionScreen } from '@screens/transactions/new-transaction/VehicleSelectionScreen';
import { CustomerSearchScreen } from '@screens/transactions/new-transaction/CustomerSearchScreen';
import { TransactionCustomerFormScreen } from '@screens/transactions/new-transaction/TransactionCustomerFormScreen';
import type { TransactionsStackParamList } from './types';

const Stack = createStackNavigator<TransactionsStackParamList>();

export const TransactionsStack: React.FC = () => (
  <Stack.Navigator screenOptions={{ headerShown: true }}>
    <Stack.Screen name="TransactionList" component={TransactionListScreen} options={{ headerShown: false }} />
    <Stack.Screen name="NewTransaction" component={NewTransactionScreen} options={{ title: 'New Transaction' }} />
    <Stack.Screen name="CustomerSearch" component={CustomerSearchScreen} options={{ title: 'Search Customer' }} />
    <Stack.Screen name="CustomerForm" component={TransactionCustomerFormScreen} options={{ title: 'New Customer' }} />
    <Stack.Screen name="VehicleSelection" component={VehicleSelectionScreen} options={({ route }) => ({ title: route.params.customerName })} />
    <Stack.Screen name="TransactionDetail" component={TransactionDetailScreen} options={{ headerShown: false }} />
    <Stack.Screen name="Payment" component={PaymentScreen} options={{ title: 'Payment' }} />
    <Stack.Screen name="Receipt" component={ReceiptScreen} options={{ title: 'Receipt' }} />
    <Stack.Screen name="TransactionHistoryDetail" component={TransactionHistoryDetailScreen} options={{ title: 'Transaction Details' }} />
    <Stack.Screen name="VoidTransaction" component={VoidTransactionScreen} options={{ title: 'Void Transaction' }} />
    <Stack.Screen name="ReturnTransaction" component={ReturnTransactionScreen} options={{ title: 'Process Return' }} />
  </Stack.Navigator>
);
