import React from 'react';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { ScreenWrapper } from '@components/layout/ScreenWrapper';
import { CustomerSearchList } from '@components/customers/CustomerSearchList';
import type { Customer } from '@/types';
import type { TransactionsStackParamList } from '@navigation/types';

type NavigationProp = StackNavigationProp<TransactionsStackParamList, 'CustomerSearch'>;

export const CustomerSearchScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();

  const handleSelectCustomer = (customer: Customer) => {
    navigation.navigate('VehicleSelection', {
      customerId: customer.id,
      customerName: customer.name,
    });
  };

  const handleNewCustomer = () => {
    navigation.navigate('CustomerForm', {});
  };

  return (
    <ScreenWrapper>
      <CustomerSearchList
        onSelectCustomer={handleSelectCustomer}
        onNewCustomer={handleNewCustomer}
        loadOnMount
      />
    </ScreenWrapper>
  );
};
