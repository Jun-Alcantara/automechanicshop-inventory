import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ScreenWrapper } from '@components/layout/ScreenWrapper';
import { AppButton } from '@components/common/AppButton';
import { usePermissionGuard } from '@hooks/usePermissionGuard';
import { Colors, Spacing } from '@constants/theme';
import { PERMISSIONS } from '@constants/permissions';

export const NewTransactionScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const isAuthorized = usePermissionGuard(PERMISSIONS.CREATE_TRANSACTIONS);

  if (!isAuthorized) return null;

  const handleSearchCustomer = () => {
    navigation.navigate('CustomerSearch');
  };

  const handleNavigateToCreateCustomer = () => {
    navigation.navigate('CustomerForm', {});
  };

  return (
    <ScreenWrapper>
      <View style={styles.container}>
        <AppButton
          label="Search Existing Customer"
          onPress={handleSearchCustomer}
          variant="secondary"
          fullWidth
        />
        <AppButton
          label="Create New Customer"
          onPress={handleNavigateToCreateCustomer}
          variant="secondary"
          fullWidth
        />
      </View>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
    gap: Spacing.md,
    backgroundColor: Colors.background,
  },
});
