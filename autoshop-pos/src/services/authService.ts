import { database } from './database';
import { Q } from '@nozbe/watermelondb';
import { UserModel } from '../models/UserModel';
import { verifyPin, computePinLookupHash } from '../utils/pinHash';
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
 * Authenticates a user by PIN.
 *
 * Fast path: queries the DB by pin_lookup_hash to find the candidate user in O(1),
 * then runs PBKDF2 verification exactly once. Previously this ran PBKDF2 against
 * every active user (N × ~3s = very slow).
 */
export const authenticateByPin = async (pin: string): Promise<User | null> => {
  const lookupHash = computePinLookupHash(pin);

  const candidates = await database
    .get<UserModel>('users')
    .query(Q.where('is_active', true), Q.where('pin_lookup_hash', lookupHash))
    .fetch();

  const userModel = candidates[0];
  if (!userModel) return null;

  const isValid = await verifyPin(pin, userModel.pinHash, userModel.pinSalt);
  return isValid ? mapUserModel(userModel) : null;
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
 *
 * Uses pin_lookup_hash for an O(1) DB lookup — no PBKDF2 needed.
 */
export const isPinTaken = async (
  pin: string,
  excludeUserId?: string
): Promise<boolean> => {
  const lookupHash = computePinLookupHash(pin);

  const conditions = [
    Q.where('is_active', true),
    Q.where('pin_lookup_hash', lookupHash),
    ...(excludeUserId ? [Q.where('id', Q.notEq(excludeUserId))] : []),
  ];

  const matches = await database
    .get<UserModel>('users')
    .query(...conditions)
    .fetch();

  return matches.length > 0;
};
