import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSessionStore } from '@stores/sessionStore';
import { useInventoryStore } from '@stores/inventoryStore';
import { useCatalogStore } from '@stores/catalogStore';
import { useOpenTransactionsStore } from '@stores/openTransactionsStore';
import { useSettingsStore } from '@stores/settingsStore';
import { useUserStore } from '@stores/userStore';
import { useInactivityTimer } from '@hooks/useInactivityTimer';
import { hasPermission } from '@utils/permissions';
import { Colors } from '@constants/theme';

/**
 * Mounts as a sibling to the main navigation tree inside RootNavigator.
 * Manages all Zustand store subscriptions tied to the active session.
 */
export const AppListeners: React.FC = () => {
  const { status, user } = useSessionStore();

  // Always mount inactivity timer — it self-activates only when status === 'ACTIVE'
  useInactivityTimer();

  useEffect(() => {
    if (status === 'ACTIVE') {
      // Subscribe all unconditional stores
      useSettingsStore.getState().subscribe();
      useInventoryStore.getState().subscribe();
      useCatalogStore.getState().subscribe();
      useOpenTransactionsStore.getState().subscribe();

      // Conditional: userStore only for MANAGE_USERS permission
      if (user && hasPermission(user, 'MANAGE_USERS')) {
        useUserStore.getState().subscribe();
      }
    } else {
      // Unsubscribe all on LOCKED or NONE
      useSettingsStore.getState().unsubscribe();
      useInventoryStore.getState().unsubscribe();
      useCatalogStore.getState().unsubscribe();
      useOpenTransactionsStore.getState().unsubscribe();
      useUserStore.getState().unsubscribe();
    }
  }, [status, user]);

  // Select error fields from each store
  const inventoryError = useInventoryStore((s) => s.error);
  const catalogError = useCatalogStore((s) => s.error);
  const settingsError = useSettingsStore((s) => s.error);

  const hasError = !!(inventoryError || catalogError || settingsError);

  return hasError ? (
    <View style={styles.errorBanner}>
      <Text style={styles.errorText}>
        Data sync error. Some information may be outdated.
      </Text>
    </View>
  ) : null;
};

const styles = StyleSheet.create({
  errorBanner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    backgroundColor: Colors.dangerLight,
    paddingVertical: 6,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  errorText: {
    color: Colors.danger,
    fontSize: 13,
    fontWeight: '500',
  },
});
