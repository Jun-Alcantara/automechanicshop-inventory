# AMSPOS-91: Store Snapshot Tests

**Sprint**: Sprint 15 — Testing
**Effort**: 1.5 days
**Dependencies**: sessionStore, inventoryStore, settingsStore, transactionDraftStore
**Phase**: Polish

---

## Overview

Test Zustand store behavior in isolation using a mock database.

---

## sessionStore Tests

```typescript
// src/stores/__tests__/sessionStore.test.ts
import { useSessionStore } from '../sessionStore';

describe('sessionStore', () => {
  beforeEach(() => {
    useSessionStore.setState({ user: null, status: 'NONE', lastActivityAt: 0 });
  });

  it('login sets user and ACTIVE status', async () => {
    jest.mock('../../services/authService', () => ({
      getUserById: jest.fn().mockResolvedValue({
        id: 'user1', displayName: 'Test User', isMainAdmin: false,
        permissions: ['CREATE_TRANSACTIONS'], isActive: true,
      }),
    }));
    await useSessionStore.getState().login('user1');
    expect(useSessionStore.getState().status).toBe('ACTIVE');
    expect(useSessionStore.getState().user?.id).toBe('user1');
  });

  it('logout clears user and sets NONE status', () => {
    useSessionStore.setState({ user: { id: 'u1' } as any, status: 'ACTIVE' });
    useSessionStore.getState().logout();
    expect(useSessionStore.getState().user).toBeNull();
    expect(useSessionStore.getState().status).toBe('NONE');
  });

  it('lock sets status to LOCKED but preserves user', () => {
    const user = { id: 'u1', displayName: 'Jun' } as any;
    useSessionStore.setState({ user, status: 'ACTIVE' });
    useSessionStore.getState().lock();
    expect(useSessionStore.getState().status).toBe('LOCKED');
    expect(useSessionStore.getState().user?.id).toBe('u1');
  });
});
```

---

## Additional Store Tests

### inventoryStore
```typescript
// src/stores/__tests__/inventoryStore.test.ts
// - subscribe() populates products list from DB
// - unsubscribe() clears the products list
```

### settingsStore
```typescript
// src/stores/__tests__/settingsStore.test.ts
// - updateSettings() modifies state
// - updateSettings() persists changes (verify via settingsService mock)
```

### transactionDraftStore
```typescript
// src/stores/__tests__/transactionDraftStore.test.ts
// - clearDraft() resets draft to null
```

---

## Acceptance Criteria

- [ ] `sessionStore`: login sets ACTIVE status with correct user
- [ ] `sessionStore`: logout clears user and sets NONE
- [ ] `sessionStore`: lock sets LOCKED but preserves user
- [ ] `inventoryStore`: subscribe populates products; unsubscribe clears
- [ ] `settingsStore`: updateSettings modifies state and persists
- [ ] `transactionDraftStore`: clearDraft resets draft to null
- [ ] All tests pass with `npm test`

## Definition of Done

- All acceptance criteria are met
- `npm test` runs with 0 failures
- Code committed to `main`
