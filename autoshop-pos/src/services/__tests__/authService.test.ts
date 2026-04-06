// Force production code path — the __DEV__ shortcut bypasses verifyPin which
// breaks the PBKDF2 tests.
(global as unknown as Record<string, unknown>).__DEV__ = false;

import { authenticateByPin, getUserById, isPinTaken, mapUserModel } from '../authService';

// ─── Mocks ────────────────────────────────────────────────────────────────────

jest.mock('../database', () => ({
  database: {
    get: jest.fn(),
  },
}));

jest.mock('../../utils/pinHash', () => ({
  verifyPin: jest.fn(),
  computePinLookupHash: jest.fn(() => 'lookup-hash-abc'),
}));

import { database } from '../database';
import { verifyPin } from '../../utils/pinHash';

const mockGet = database.get as jest.Mock;
const mockVerifyPin = verifyPin as jest.Mock;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeMockModel(overrides: Record<string, unknown> = {}) {
  return {
    id: 'user-1',
    displayName: 'Alice',
    pinHash: 'hash-abc',
    pinSalt: 'salt-abc',
    pinLookupHash: 'lookup-hash-abc',
    permissions: ['MANAGE_USERS'],
    isMainAdmin: false,
    isActive: true,
    createdAt: new Date('2024-01-01'),
    createdBy: 'system',
    updatedAt: new Date('2024-01-02'),
    updatedBy: 'system',
    ...overrides,
  };
}

function mockQuery(models: ReturnType<typeof makeMockModel>[]) {
  mockGet.mockReturnValue({
    query: jest.fn().mockReturnValue({
      fetch: jest.fn().mockResolvedValue(models),
    }),
    find: jest.fn().mockImplementation(async (id: string) => {
      const found = models.find((m) => m.id === id);
      if (!found) throw new Error('Record not found');
      return found;
    }),
  });
}

// ─── mapUserModel ─────────────────────────────────────────────────────────────

describe('mapUserModel', () => {
  it('maps all fields from UserModel to User', () => {
    const model = makeMockModel();
    const result = mapUserModel(model as never);
    expect(result).toEqual({
      id: 'user-1',
      displayName: 'Alice',
      pinHash: 'hash-abc',
      pinSalt: 'salt-abc',
      permissions: ['MANAGE_USERS'],
      isMainAdmin: false,
      isActive: true,
      createdAt: new Date('2024-01-01'),
      createdBy: 'system',
      updatedAt: new Date('2024-01-02'),
      updatedBy: 'system',
    });
  });
});

// ─── authenticateByPin ────────────────────────────────────────────────────────

describe('authenticateByPin', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns the matching User when PIN matches', async () => {
    const model = makeMockModel();
    mockQuery([model]);
    mockVerifyPin.mockResolvedValue(true);

    const result = await authenticateByPin('123456');

    expect(result).not.toBeNull();
    expect(result?.id).toBe('user-1');
    expect(mockVerifyPin).toHaveBeenCalledWith('123456', model.pinHash, model.pinSalt);
    expect(mockVerifyPin).toHaveBeenCalledTimes(1);
  });

  it('returns null when DB lookup returns no candidate', async () => {
    mockQuery([]);

    const result = await authenticateByPin('000000');

    expect(result).toBeNull();
    expect(mockVerifyPin).not.toHaveBeenCalled();
  });

  it('returns null when PBKDF2 verify fails for the candidate', async () => {
    const model = makeMockModel();
    mockQuery([model]);
    mockVerifyPin.mockResolvedValue(false);

    const result = await authenticateByPin('000000');

    expect(result).toBeNull();
    expect(mockVerifyPin).toHaveBeenCalledTimes(1);
  });

  it('returns null when there are no active users', async () => {
    mockQuery([]);

    const result = await authenticateByPin('111111');

    expect(result).toBeNull();
    expect(mockVerifyPin).not.toHaveBeenCalled();
  });
});

// ─── getUserById ──────────────────────────────────────────────────────────────

describe('getUserById', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns a User for an active user', async () => {
    const model = makeMockModel({ isActive: true });
    mockQuery([model]);

    const result = await getUserById('user-1');

    expect(result).not.toBeNull();
    expect(result?.id).toBe('user-1');
  });

  it('returns null for an inactive user', async () => {
    const model = makeMockModel({ isActive: false });
    mockQuery([model]);

    const result = await getUserById('user-1');

    expect(result).toBeNull();
  });

  it('returns null when the record is not found (never throws)', async () => {
    mockGet.mockReturnValue({
      find: jest.fn().mockRejectedValue(new Error('Record not found')),
    });

    const result = await getUserById('nonexistent');

    expect(result).toBeNull();
  });
});

// ─── isPinTaken ───────────────────────────────────────────────────────────────

describe('isPinTaken', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns true when a user with the lookup hash is found', async () => {
    mockQuery([makeMockModel()]);

    expect(await isPinTaken('123456')).toBe(true);
    expect(mockVerifyPin).not.toHaveBeenCalled();
  });

  it('returns false when no user with the lookup hash is found', async () => {
    mockQuery([]);

    expect(await isPinTaken('999999')).toBe(false);
    expect(mockVerifyPin).not.toHaveBeenCalled();
  });

  it('returns false when the only match is the excluded user', async () => {
    mockQuery([]);

    const result = await isPinTaken('123456', 'user-1');

    expect(result).toBe(false);
    expect(mockVerifyPin).not.toHaveBeenCalled();
  });

  it('returns true when another user (not excluded) has the same lookup hash', async () => {
    mockQuery([makeMockModel({ id: 'user-2' })]);

    const result = await isPinTaken('123456', 'user-1');

    expect(result).toBe(true);
  });

  it('returns false when there are no active users', async () => {
    mockQuery([]);

    expect(await isPinTaken('123456')).toBe(false);
    expect(mockVerifyPin).not.toHaveBeenCalled();
  });
});
