import { database } from './database';
import { Q } from '@nozbe/watermelondb';
import { UserModel } from '../models/UserModel';
import { verifyPin } from '../utils/pinHash';
import type { User } from '../types';

/**
 * Maps a UserModel record to the plain User interface.
 * Only services (not stores or screens) call this function.
 */
export const mapUserModel = (model: UserModel): User => ({
  id: model.id,
  displayName: model.displayName,
  pinHash: model.pinHash,
  pinSalt: model.pinSalt,
  permissions: model.permissions,
  isMainAdmin: model.isMainAdmin,
  isActive: model.isActive,
  createdAt: model.createdAt,
  createdBy: model.createdBy,
  updatedAt: model.updatedAt,
  updatedBy: model.updatedBy,
});

/**
 * Looks up a user by attempting PIN verification against all active user records.
 * Returns the matching User or null if no match.
 *
 * Note: We iterate through all active users and verify the PIN hash.
 * PINs are unique across all accounts (enforced at creation time in userService),
 * so at most one user will match.
 */
export const authenticateByPin = async (pin: string): Promise<User | null> => {
  const activeUsers = await database
    .get<UserModel>('users')
    .query(Q.where('is_active', true))
    .fetch();

  for (const userModel of activeUsers) {
    const matches = await verifyPin(pin, userModel.pinHash, userModel.pinSalt);
    if (matches) {
      return mapUserModel(userModel);
    }
  }

  return null;
};

/**
 * Fetches a single user by ID.
 * Used by sessionStore.login() after successful PIN auth.
 */
export const getUserById = async (userId: string): Promise<User | null> => {
  try {
    const userModel = await database.get<UserModel>('users').find(userId);
    if (!userModel.isActive) return null;
    return mapUserModel(userModel);
  } catch {
    return null;
  }
};

/**
 * Checks whether a given PIN is already in use by any active user.
 * Used during user creation and PIN change to enforce uniqueness.
 */
export const isPinTaken = async (
  pin: string,
  excludeUserId?: string
): Promise<boolean> => {
  const activeUsers = await database
    .get<UserModel>('users')
    .query(Q.where('is_active', true))
    .fetch();

  for (const userModel of activeUsers) {
    if (excludeUserId && userModel.id === excludeUserId) continue;
    const matches = await verifyPin(pin, userModel.pinHash, userModel.pinSalt);
    if (matches) return true;
  }

  return false;
};
