import React, { useEffect, useState } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { NavigationContainer } from '@react-navigation/native';
import { database } from '@services/database';
import { useSessionStore } from '@stores/sessionStore';
import { AppListeners } from '@components/layout/AppListeners';
import { InitSetupScreen } from '@screens/auth/InitSetupScreen';
import { PinLockScreen } from '@screens/auth/PinLockScreen';
import { BarcodeScannerModal } from '@screens/modals/BarcodeScannerModal';
import { CustomerSearchModal } from '@screens/modals/CustomerSearchModal';
import { DiscountPickerModal } from '@screens/modals/DiscountPickerModal';
import { MainTabNavigator } from './MainTabNavigator';
import type { RootStackParamList } from './types';

const Stack = createStackNavigator<RootStackParamList>();

export const RootNavigator: React.FC = () => {
  const { status } = useSessionStore();
  const [isFirstLaunch, setIsFirstLaunch] = useState<boolean | null>(null);

  useEffect(() => {
    const subscription = database
      .get('users')
      .query()
      .observeCount()
      .subscribe(count => {
        setIsFirstLaunch(count === 0);
      });
    return () => subscription.unsubscribe();
  }, []);

  if (isFirstLaunch === null) {
    return null;
  }

  return (
    <NavigationContainer>
      <AppListeners />
      <Stack.Navigator screenOptions={{ headerShown: false, animation: 'none' }}>
        {isFirstLaunch ? (
          <Stack.Screen name="InitSetup" component={InitSetupScreen} />
        ) : status === 'ACTIVE' ? (
          <Stack.Screen name="MainTabs" component={MainTabNavigator} />
        ) : (
          <Stack.Screen name="PinLock" component={PinLockScreen} />
        )}
        <Stack.Screen
          name="BarcodeScanner"
          component={BarcodeScannerModal}
          options={{ presentation: 'modal', headerShown: false }}
        />
        <Stack.Screen
          name="CustomerSearch"
          component={CustomerSearchModal}
          options={{ presentation: 'modal', headerShown: false }}
        />
        <Stack.Screen
          name="DiscountPicker"
          component={DiscountPickerModal}
          options={{ presentation: 'modal', headerShown: false }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};
