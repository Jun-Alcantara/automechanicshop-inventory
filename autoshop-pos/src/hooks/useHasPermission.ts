import { useSessionStore } from '@stores/sessionStore';
import { hasPermission } from '@utils/permissions';
import type { Permission } from '@constants/permissions';

/**
 * Returns true if the current user has the given permission.
 * Use for conditional UI rendering (show/hide buttons, sections).
 *
 * Usage:
 *   const canApplyDiscount = useHasPermission('APPLY_DISCOUNTS');
 *   {canApplyDiscount && <AppButton label="Apply Discount" onPress={...} />}
 */
export const useHasPermission = (permission: Permission): boolean => {
  const user = useSessionStore((s) => s.user);
  return hasPermission(user, permission);
};
