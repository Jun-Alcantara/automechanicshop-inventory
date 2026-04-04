import { authenticateByPin, getUserById, isPinTaken, mapUserModel } from '../authService';

// ─── Mocks ────────────────────────────────────────────────────────────────────

jest.mock('../database', () => ({
  database: {
    get: jest.fn(),
  },
}));

jest.mock('../../utils/pinHash', () => ({
  verifyPin: jest.fn(),
}));

import { database } from '../database';
import { verifyPin } from '../../utils/pinHash';

const mockGet = database.get as jest.Mock;
const mockVerifyPin = verifyPin as jest.Mock;

// ─── Helpers ──────────────────────────────────────────────────────────────────

const makeUser = (overrides: Partial<ReturnType<typeof makeMockModel>> = {}) =>
  makeMockModel(overrides);

function makeMockModel(overrides: Record<string, unknown> = {}) {
  return {
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
  });

  it('returns null when no user PIN matches', async () => {
    const model = makeMockModel();
    mockQuery([model]);
    mockVerifyPin.mockResolvedValue(false);

    const result = await authenticateByPin('000000');

    expect(result).toBeNull();
  });

  it('returns the first matching user when multiple active users exist', async () => {
    const alice = makeMockModel({ id: 'user-1', pinHash: 'hash-a', pinSalt: 'salt-a' });
    const bob = makeMockModel({ id: 'user-2', pinHash: 'hash-b', pinSalt: 'salt-b' });
    mockQuery([alice, bob]);
    mockVerifyPin
      .mockResolvedValueOnce(false) // alice does not match
      .mockResolvedValueOnce(true); // bob matches

    const result = await authenticateByPin('654321');

    expect(result?.id).toBe('user-2');
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

  it('returns true when a PIN is already in use', async () => {
    const model = makeMockModel();
    mockQuery([model]);
    mockVerifyPin.mockResolvedValue(true);

    expect(await isPinTaken('123456')).toBe(true);
  });

  it('returns false when no user has that PIN', async () => {
    const model = makeMockModel();
    mockQuery([model]);
    mockVerifyPin.mockResolvedValue(false);

    expect(await isPinTaken('999999')).toBe(false);
  });

  it('skips the excluded user when excludeUserId is provided', async () => {
    const alice = makeMockModel({ id: 'user-1' });
    mockQuery([alice]);
    mockVerifyPin.mockResolvedValue(true); // would match if not excluded

    const result = await isPinTaken('123456', 'user-1');

    expect(result).toBe(false);
    expect(mockVerifyPin).not.toHaveBeenCalled();
  });

  it('still checks other users even when excludeUserId is set', async () => {
    const alice = makeMockModel({ id: 'user-1' });
    const bob = makeMockModel({ id: 'user-2' });
    mockQuery([alice, bob]);
    mockVerifyPin
      .mockResolvedValueOnce(true); // bob matches (alice is skipped)

    const result = await isPinTaken('123456', 'user-1');

    expect(result).toBe(true);
    expect(mockVerifyPin).toHaveBeenCalledTimes(1);
  });

  it('returns false when there are no active users', async () => {
    mockQuery([]);

    expect(await isPinTaken('123456')).toBe(false);
    expect(mockVerifyPin).not.toHaveBeenCalled();
  });
});
