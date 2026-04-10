import React from 'react';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';

import { ScreenWrapper } from '@components/layout/ScreenWrapper';
import { CustomerForm } from '@components/customers/CustomerForm';

import { usePermissionGuard } from '@hooks/usePermissionGuard';
import type { AdminStackParamList } from '@navigation/types';

type CustomerFormRouteProp = RouteProp<AdminStackParamList, 'CustomerForm'>;
type CustomerFormNavigationProp = StackNavigationProp<AdminStackParamList, 'CustomerForm'>;

export const CustomerFormScreen: React.FC = () => {
  const isAuthorized = usePermissionGuard('CREATE_TRANSACTIONS');
  const route = useRoute<CustomerFormRouteProp>();
  const navigation = useNavigation<CustomerFormNavigationProp>();

  const { customerId } = route.params ?? {};

  if (!isAuthorized) return null;

  return (
    <ScreenWrapper>
      <CustomerForm
        customerId={customerId}
        onSuccess={() => navigation.goBack()}
        onCancel={() => navigation.goBack()}
      />
    </ScreenWrapper>
  );
};
