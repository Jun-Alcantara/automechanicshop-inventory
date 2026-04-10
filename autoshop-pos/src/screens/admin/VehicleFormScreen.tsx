import React from 'react';
import { ScreenWrapper } from '@components/layout/ScreenWrapper';
import { VehicleForm } from '@components/vehicles/VehicleForm';
import type { AdminStackScreenProps } from '@navigation/types';

type Props = AdminStackScreenProps<'VehicleForm'>;

export const VehicleFormScreen: React.FC<Props> = ({ route, navigation }) => {
  const { vehicleId, customerId } = route.params;

  return (
    <ScreenWrapper>
      <VehicleForm
        customerId={customerId}
        {...(vehicleId !== undefined && { vehicleId })}
        onSaved={() => navigation.goBack()}
        onCancel={() => navigation.goBack()}
      />
    </ScreenWrapper>
  );
};
