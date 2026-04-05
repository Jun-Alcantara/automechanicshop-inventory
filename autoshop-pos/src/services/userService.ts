import { database } from './database';
import { UserModel } from '../models/UserModel';
import { hashPin, generateSalt, computePinLookupHash } from '../utils/pinHash';
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
