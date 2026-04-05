import { database } from './database';
import { Q } from '@nozbe/watermelondb';
import { UserModel } from '../models/UserModel';
import { hashPin, generateSalt, computePinLookupHash, verifyPin } from '../utils/pinHash';
import { PERMISSIONS } from '../constants/permissions';
import type { User } from '../types';
import { mapUserModel } from './authService';

/**
 * Creates the Main Admin account during initial setup.
 * Should only be called once, when no users exist in the database.
 * Grants all permissions to the Main Admin.
 */
export const createMainAdmin = async (displayName: string, pin: string): Promise<User> => {
  const salt = generateSalt();
  const [pinHash, pinLookupHash] = await Promise.all([
    hashPin(pin, salt),
    Promise.resolve(computePinLookupHash(pin)),
  ]);

  let createdModel: UserModel | null = null;

  await database.write(async () => {
    createdModel = await database.get<UserModel>('users').create((user) => {
      user.displayName = displayName;
      user.pinHash = pinHash;
      user.pinSalt = salt;
      user.pinLookupHash = pinLookupHash;
      user.permissions = Object.values(PERMISSIONS);
      user.isMainAdmin = true;
      user.isActive = true;
      (user as any).createdAt = new Date();
      (user as any).createdBy = 'SYSTEM';
      (user as any).updatedAt = new Date();
      (user as any).updatedBy = 'SYSTEM';
    });
  });

  return mapUserModel(createdModel!);
};

/**
 * Observable query that emits the full user list whenever it changes.
 * Used by userStore to keep the admin user list reactive.
 */
export const observeUsers = () =>
  database
    .get<UserModel>('users')
    .query(Q.sortBy('display_name', Q.asc))
    .observe();

/**
 * Changes the current user's own PIN after verifying the current PIN.
 * Throws an error with a user-readable message if the current PIN is wrong.
 */
export const changeOwnPin = async (
  user: User,
  currentPin: string,
  newPin: string
): Promise<void> => {
  const isValid = await verifyPin(currentPin, user.pinHash, user.pinSalt);
  if (!isValid) throw new Error('Current PIN is incorrect.');

  const salt = generateSalt();
  const [pinHash, pinLookupHash] = await Promise.all([
    hashPin(newPin, salt),
    Promise.resolve(computePinLookupHash(newPin)),
  ]);

  const model = await database.get<UserModel>('users').find(user.id);
  await database.write(async () => {
    await model.update((u) => {
      u.pinHash = pinHash;
      u.pinSalt = salt;
      u.pinLookupHash = pinLookupHash;
      (u as any).updatedAt = new Date();
      (u as any).updatedBy = user.id;
    });
  });
};
