# AMSPOS-94: Auth & Audit Tests

**Sprint**: Sprint 15 — Testing
**Effort**: 1 day
**Dependencies**: authService, auditService, pinHash utility
**Phase**: Polish

---

## Overview

Test authentication and audit logging behavior in isolation.

---

## Auth Service Tests

```typescript
// src/services/__tests__/authService.test.ts

describe('authenticateByPin', () => {
  it('returns the correct user when PIN matches', async () => {
    // Setup: create user with known PIN hash
    // Action: authenticateByPin(userId, correctPin)
    // Assert: returns user object
  });

  it('returns null when PIN is incorrect', async () => {
    // Action: authenticateByPin(userId, wrongPin)
    // Assert: returns null
  });
});

describe('isPinTaken', () => {
  it('returns true when PIN is already in use by another user', async () => {
    // Setup: two users with different PINs
    // Assert: isPinTaken(pin) returns true
  });

  it('returns false when excludeUserId matches the PIN owner', async () => {
    // Assert: isPinTaken(pin, ownUserId) returns false (editing own PIN)
  });
});
```

---

## Audit Service Tests

```typescript
// src/services/__tests__/auditService.test.ts

describe('logEvent', () => {
  it('creates an audit_log record in the DB', async () => {
    // Action: logEvent({ action: 'LOGIN', userId: 'u1', ... })
    // Assert: record exists in audit_logs table
  });
});

describe('getAuditLogs', () => {
  it('filters records by date range', async () => {
    // Setup: create logs at different timestamps
    // Action: getAuditLogs({ from: dateA, to: dateB })
    // Assert: only logs within range are returned
  });
});

describe('immutability check', () => {
  it('auditService has no update or delete functions (static check)', () => {
    // Import auditService and assert no updateLog/deleteLog exports exist
    const auditService = require('../../services/auditService');
    expect(auditService.updateLog).toBeUndefined();
    expect(auditService.deleteLog).toBeUndefined();
  });
});
```

---

## PIN Hash Utility (extend if needed)

```typescript
// src/utils/__tests__/pinHash.test.ts
// Note: Core cases covered in AMSPOS-9. Extend only if new edge cases are needed.
```

---

## Acceptance Criteria

- [ ] `authenticateByPin` returns correct user on valid PIN
- [ ] `authenticateByPin` returns null on wrong PIN
- [ ] `isPinTaken` returns true when PIN is in use; false when excludeUserId matches owner
- [ ] `logEvent` creates a record in audit_logs table
- [ ] `getAuditLogs` filters correctly by date range
- [ ] auditService has no update/delete functions (static code check passes)
- [ ] All tests pass with `npm test`

## Definition of Done

- All acceptance criteria are met
- `npm test` runs with 0 failures
- Code committed to `main`
