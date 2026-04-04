import { hasPermission, requirePermission } from '../permissions';
import type { User } from '../../types';

const makeUser = (permissions: string[], isMainAdmin = false): User =>
  ({ permissions, isMainAdmin, isActive: true } as User);

describe('hasPermission', () => {
  it('null user → false', () => expect(hasPermission(null, 'MANAGE_INVENTORY')).toBe(false));
  it('mainAdmin → always true', () => expect(hasPermission(makeUser([], true), 'MANAGE_INVENTORY')).toBe(true));
  it('user with permission → true', () => expect(hasPermission(makeUser(['MANAGE_INVENTORY']), 'MANAGE_INVENTORY')).toBe(true));
  it('user without permission → false', () => expect(hasPermission(makeUser([]), 'MANAGE_INVENTORY')).toBe(false));
});

describe('requirePermission', () => {
  it('throws for missing permission', () => {
    expect(() => requirePermission(makeUser([]), 'MANAGE_USERS')).toThrow('Permission denied');
  });
  it('does not throw for valid permission', () => {
    expect(() => requirePermission(makeUser(['MANAGE_USERS']), 'MANAGE_USERS')).not.toThrow();
  });
});
