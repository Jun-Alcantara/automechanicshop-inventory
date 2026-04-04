import { Model } from '@nozbe/watermelondb';
import { text, field, date, json } from '@nozbe/watermelondb/decorators';
import { Permission } from '../types';

const sanitizePermissions = (raw: unknown): Permission[] => {
  if (!Array.isArray(raw)) return [];
  return raw.filter((p): p is Permission => typeof p === 'string');
};

export class UserModel extends Model {
  static table = 'users';

  @text('display_name') displayName!: string;
  @text('pin_hash') pinHash!: string;
  @text('pin_salt') pinSalt!: string;
  @json('permissions', sanitizePermissions) permissions!: Permission[];
  @field('is_main_admin') isMainAdmin!: boolean;
  @field('is_active') isActive!: boolean;
  @date('created_at') createdAt!: Date;
  @text('created_by') createdBy!: string;
  @date('updated_at') updatedAt!: Date;
  @text('updated_by') updatedBy!: string;
}
