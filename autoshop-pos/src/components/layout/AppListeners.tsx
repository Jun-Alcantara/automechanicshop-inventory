import React, { useEffect } from 'react';
import { useSessionStore } from '@stores/sessionStore';
import { useInventoryStore } from '@stores/inventoryStore';
import { useCatalogStore } from '@stores/catalogStore';
import { useOpenTransactionsStore } from '@stores/openTransactionsStore';
import { useSettingsStore } from '@stores/settingsStore';
import { useUserStore } from '@stores/userStore';
import { useInactivityTimer } from '@hooks/useInactivityTimer';
import { hasPermission } from '@utils/permissions';

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

  // This component renders nothing — it is a side-effect-only component
  return null;
};
