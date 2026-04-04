import type { User } from '../types';
import type { Permission } from '../constants/permissions';

export const hasPermission = (user: User | null, permission: Permission): boolean => {
  if (!user) return false;
  if (user.isMainAdmin) return true;
  return user.permissions.includes(permission);
};

/**
 * Throws an error if the user does not have the required permission.
 * Use at the start of service functions that require authorization.
 */
export const requirePermission = (user: User | null, permission: Permission): void => {
  if (!hasPermission(user, permission)) {
    throw new Error(`Permission denied: ${permission} required.`);
  }
};
