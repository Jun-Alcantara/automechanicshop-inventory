import { useEffect } from 'react';
import { Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSessionStore } from '@stores/sessionStore';
import { hasPermission } from '@utils/permissions';
import type { Permission } from '@constants/permissions';

/**
 * Screen-level permission guard.
 * Call at the very top of a screen component (before any other hooks).
 * Returns true when authorized, false when not.
 *
 * Usage:
 *   const isAuthorized = usePermissionGuard('MANAGE_INVENTORY');
 *   if (!isAuthorized) return null;
 */
export const usePermissionGuard = (permission: Permission): boolean => {
  const user = useSessionStore((s) => s.user);
  const navigation = useNavigation();
  const isAuthorized = hasPermission(user, permission);

  useEffect(() => {
    if (!isAuthorized) {
      navigation.goBack();
      Alert.alert(
        'Access Denied',
        "You don't have permission to access this screen."
      );
    }
  }, [isAuthorized, navigation]);

  return isAuthorized;
};
