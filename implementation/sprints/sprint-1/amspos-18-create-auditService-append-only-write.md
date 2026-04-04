# AMSPOS-18: Create auditService — Append-Only Write

**Sprint**: Sprint 1 — Auth Services & Utilities
**Effort**: 1 day
**Dependencies**: AMSPOS-10, AMSPOS-11, AMSPOS-12
**Phase**: Auth

---

## Description

Create `src/services/auditService.ts` with a single `appendAuditLog` function and observable query. The audit log is **append-only** — no update or delete functions exist. This constraint is enforced at the application layer: only `create` operations on the `audit_logs` table are permitted.

---

## Instructions

### 1. `src/services/auditService.ts`

```typescript
import { database } from './database';
import { Q } from '@nozbe/watermelondb';
import type { AuditActionType, AuditEntityType, AuditLog } from '../types';

interface AppendAuditLogInput {
  userId: string;
  userName: string;
  actionType: AuditActionType;
  entityType: AuditEntityType;
  entityId: string;
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
  note?: string;
}

/**
 * Appends a single audit log entry.
 * IMPORTANT: Call this inside an existing database.write() block when the
 * audit entry must be atomic with the primary write (e.g., product edits).
 * Call standalone only for non-write events (login, logout).
 */
export const appendAuditLog = async (input: AppendAuditLogInput): Promise<void> => {
  await database.get('audit_logs').create((log: any) => {
    log.timestamp = new Date();
    log.userId = input.userId;
    log.userName = input.userName;
    log.actionType = input.actionType;
    log.entityType = input.entityType;
    log.entityId = input.entityId;
    log.before = input.before ? JSON.stringify(input.before) : '';
    log.after = input.after ? JSON.stringify(input.after) : '';
    log.note = input.note ?? '';
  });
};

/**
 * Wraps appendAuditLog in its own database.write() block.
 * Use for standalone audit events (login, logout) that are not
 * part of a larger atomic write.
 */
export const logEvent = async (input: AppendAuditLogInput): Promise<void> => {
  await database.write(async () => {
    await appendAuditLog(input);
  });
};

// ─── Observable for reports ───────────────────────────────────────────────────

/**
 * Observable query for audit logs filtered by date range.
 * Used by AuditLogScreen.
 */
export const observeAuditLogs = (fromDate: Date, toDate: Date) =>
  database
    .get('audit_logs')
    .query(
      Q.where('timestamp', Q.gte(fromDate.getTime())),
      Q.where('timestamp', Q.lte(toDate.getTime())),
      Q.sortBy('timestamp', Q.desc)
    )
    .observe();

/**
 * One-time fetch for reports (not observable).
 */
export const getAuditLogs = async (fromDate: Date, toDate: Date): Promise<AuditLog[]> => {
  const models = await database
    .get('audit_logs')
    .query(
      Q.where('timestamp', Q.gte(fromDate.getTime())),
      Q.where('timestamp', Q.lte(toDate.getTime())),
      Q.sortBy('timestamp', Q.desc)
    )
    .fetch();

  return models.map((m: any) => ({
    id: m.id,
    timestamp: m.timestamp,
    userId: m.userId,
    userName: m.userName,
    actionType: m.actionType,
    entityType: m.entityType,
    entityId: m.entityId,
    before: m.before,
    after: m.after,
    note: m.note,
  }));
};
```

### 2. Usage pattern for atomic writes

When a service function writes to a primary table (product, user, transaction), the audit log entry goes **inside the same `database.write()` block**:

```typescript
// In productService.ts — correct pattern:
await database.write(async () => {
  await product.update((p) => { p.name = newName; });
  await appendAuditLog({ // ← not logEvent(), no nested write()
    userId: actingUser.id,
    userName: actingUser.displayName,
    actionType: 'EDIT_PRODUCT',
    entityType: 'PRODUCT',
    entityId: product.id,
    before: { name: oldName },
    after: { name: newName },
  });
});
```

For standalone events (login, logout), use `logEvent()` which wraps in its own `database.write()`:

```typescript
// In PinLockScreen after unlock:
await logEvent({
  userId: user.id,
  userName: user.displayName,
  actionType: 'LOGIN',
  entityType: 'SESSION',
  entityId: user.id,
});
```

### 3. Immutability enforcement

There is no `updateAuditLog` or `deleteAuditLog` function in this file. Code review must ensure no future developer adds one. Leave a comment at the top of the file:

```typescript
/**
 * auditService.ts
 *
 * APPEND-ONLY: This module exposes only create operations on audit_logs.
 * No update or delete functions may ever be added here.
 * See documents/functional_requirements.md §1.4.
 */
```

---

## Acceptance Criteria

- [ ] `appendAuditLog` creates an audit log record (no `database.write()` wrapper — called inside existing write blocks)
- [ ] `logEvent` wraps `appendAuditLog` in a standalone `database.write()` for non-write events
- [ ] `observeAuditLogs(from, to)` returns a filtered Observable by timestamp range
- [ ] `getAuditLogs(from, to)` returns a typed `AuditLog[]`
- [ ] No `update` or `delete` functions exist in this file
- [ ] File-level comment documents the append-only constraint
- [ ] No TypeScript errors

## Definition of Done

- All acceptance criteria are met
- `npx tsc --noEmit` passes
- Code committed to `main`
