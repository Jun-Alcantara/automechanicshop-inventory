import { useSessionStore } from '../sessionStore';

// ─── Mocks ────────────────────────────────────────────────────────────────────

jest.mock('../../services/authService', () => ({
  authenticateByPin: jest.fn(),
  getUserById: jest.fn(),
}));

const mockClearDraft = jest.fn();

jest.mock('../transactionDraftStore', () => ({
  useTransactionDraftStore: {
    getState: jest.fn(() => ({ clearDraft: mockClearDraft })),
  },
}));

import { authenticateByPin, getUserById } from '../../services/authService';

const mockAuthenticateByPin = authenticateByPin as jest.Mock;
const mockGetUserById = getUserById as jest.Mock;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeUser(overrides: Record<string, unknown> = {}) {
  return {
    id: 'user-1',
    displayName: 'Alice',
    pinHash: 'hash-abc',
    pinSalt: 'salt-abc',
    permissions: [],
    isMainAdmin: false,
    isActive: true,
    createdAt: new Date('2024-01-01'),
    createdBy: 'system',
    updatedAt: new Date('2024-01-02'),
    updatedBy: 'system',
    ...overrides,
  };
}

function resetStore() {
  useSessionStore.setState({ user: null, status: 'NONE', lastActivityAt: 0 });
}

// ─── login ────────────────────────────────────────────────────────────────────

describe('login', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetStore();
  });

  it('sets user and status ACTIVE when getUserById returns a user', async () => {
    const user = makeUser();
    mockGetUserById.mockResolvedValue(user);

    await useSessionStore.getState().login('user-1');

    const state = useSessionStore.getState();
    expect(state.user).toEqual(user);
    expect(state.status).toBe('ACTIVE');
    expect(state.lastActivityAt).toBeGreaterThan(0);
  });

  it('throws when getUserById returns null', async () => {
    mockGetUserById.mockResolvedValue(null);

    await expect(useSessionStore.getState().login('nonexistent')).rejects.toThrow(
      'User not found after authentication.'
    );
  });

  it('calls getUserById with the provided userId', async () => {
    mockGetUserById.mockResolvedValue(makeUser());

    await useSessionStore.getState().login('user-42');

    expect(mockGetUserById).toHaveBeenCalledWith('user-42');
  });
});

// ─── logout ───────────────────────────────────────────────────────────────────

describe('logout', () => {
  beforeEach(() => resetStore());

  it('clears user, resets status to NONE, and zeroes lastActivityAt', () => {
    useSessionStore.setState({ user: makeUser() as never, status: 'ACTIVE', lastActivityAt: 9999 });

    useSessionStore.getState().logout();

    const state = useSessionStore.getState();
    expect(state.user).toBeNull();
    expect(state.status).toBe('NONE');
    expect(state.lastActivityAt).toBe(0);
  });
});

// ─── lock ─────────────────────────────────────────────────────────────────────

describe('lock', () => {
  beforeEach(() => resetStore());

  it('sets status to LOCKED without clearing the user', () => {
    const user = makeUser();
    useSessionStore.setState({ user: user as never, status: 'ACTIVE', lastActivityAt: 1000 });

    useSessionStore.getState().lock();

    const state = useSessionStore.getState();
    expect(state.status).toBe('LOCKED');
    expect(state.user).toEqual(user);
  });
});

// ─── unlock ───────────────────────────────────────────────────────────────────

describe('unlock', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetStore();
  });

  it('returns false and does not change state when PIN is wrong', async () => {
    mockAuthenticateByPin.mockResolvedValue(null);
    useSessionStore.setState({ status: 'LOCKED' });

    const result = await useSessionStore.getState().unlock('000000');

    expect(result).toBe(false);
    expect(useSessionStore.getState().status).toBe('LOCKED');
  });

  it('returns true and sets status ACTIVE when PIN is correct (same user)', async () => {
    const user = makeUser();
    useSessionStore.setState({ user: user as never, status: 'LOCKED' });
    mockAuthenticateByPin.mockResolvedValue(user);

    const result = await useSessionStore.getState().unlock('123456');

    expect(result).toBe(true);
    const state = useSessionStore.getState();
    expect(state.status).toBe('ACTIVE');
    expect(state.user).toEqual(user);
    expect(state.lastActivityAt).toBeGreaterThan(0);
  });

  it('does NOT clear draft when same user unlocks', async () => {
    const user = makeUser({ id: 'user-1' });
    useSessionStore.setState({ user: user as never, status: 'LOCKED' });
    mockAuthenticateByPin.mockResolvedValue(user);

    await useSessionStore.getState().unlock('123456');

    expect(mockClearDraft).not.toHaveBeenCalled();
  });

  it('clears the draft store when a different user unlocks', async () => {
    const alice = makeUser({ id: 'user-1' });
    const bob = makeUser({ id: 'user-2', displayName: 'Bob' });
    useSessionStore.setState({ user: alice as never, status: 'LOCKED' });
    mockAuthenticateByPin.mockResolvedValue(bob);

    const result = await useSessionStore.getState().unlock('654321');

    expect(result).toBe(true);
    expect(mockClearDraft).toHaveBeenCalledTimes(1);
    expect(useSessionStore.getState().user).toEqual(bob);
  });
});

// ─── refreshActivity ──────────────────────────────────────────────────────────

describe('refreshActivity', () => {
  beforeEach(() => resetStore());

  it('updates lastActivityAt to approximately now', () => {
    const before = Date.now();
    useSessionStore.getState().refreshActivity();
    const after = Date.now();

    const { lastActivityAt } = useSessionStore.getState();
    expect(lastActivityAt).toBeGreaterThanOrEqual(before);
    expect(lastActivityAt).toBeLessThanOrEqual(after);
  });
});

// ─── authenticatePin ──────────────────────────────────────────────────────────

describe('authenticatePin', () => {
  beforeEach(() => jest.clearAllMocks());

  it('delegates to authenticateByPin and returns the user', async () => {
    const user = makeUser();
    mockAuthenticateByPin.mockResolvedValue(user);

    const result = await useSessionStore.getState().authenticatePin('123456');

    expect(result).toEqual(user);
    expect(mockAuthenticateByPin).toHaveBeenCalledWith('123456');
  });

  it('returns null when PIN does not match any user', async () => {
    mockAuthenticateByPin.mockResolvedValue(null);

    const result = await useSessionStore.getState().authenticatePin('000000');

    expect(result).toBeNull();
  });
});
