import React from 'react';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';

import { ScreenWrapper } from '@components/layout/ScreenWrapper';
import { CustomerForm } from '@components/customers/CustomerForm';
import type { Customer } from '@/types';
import type { TransactionsStackParamList } from '@navigation/types';

type NavigationProp = StackNavigationProp<TransactionsStackParamList, 'CustomerForm'>;

export const TransactionCustomerFormScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();

  const handleSuccess = (customer: Customer) => {
    navigation.navigate('VehicleSelection', {
      customerId: customer.id,
      customerName: customer.name,
    });
  };

  return (
    <ScreenWrapper>
      <CustomerForm
        onSuccess={handleSuccess}
        onCancel={() => navigation.goBack()}
      />
    </ScreenWrapper>
  );
};
