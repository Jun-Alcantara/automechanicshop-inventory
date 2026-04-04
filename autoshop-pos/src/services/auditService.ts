/**
 * auditService.ts
 *
 * APPEND-ONLY: This module exposes only create operations on audit_logs.
 * No update or delete functions may ever be added here.
 * See documents/functional_requirements.md §1.4.
 */

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
