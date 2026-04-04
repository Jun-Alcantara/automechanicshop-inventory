# AMSPOS-52: `src/screens/admin/AuditLogScreen.tsx`

**Sprint**: Sprint 7 — Dashboard, Reports & User Screens
**Effort**: 1 day
**Dependencies**: AMSPOS-40 (auditService)
**Phase**: Reports/Dashboard

---

## Description

Admin screen for browsing the audit log. Gated by `VIEW_REPORTS` permission. Supports filtering by date range. Displays a flat list of audit entries.

---

## Instructions

### 1. `src/screens/admin/AuditLogScreen.tsx`

**Permission guard:**

```typescript
usePermissionGuard('VIEW_REPORTS');
```

**State:**

```typescript
const [fromDate, setFromDate] = useState<Date>(startOfToday());
const [toDate, setToDate]     = useState<Date>(new Date());
const [entries, setEntries]   = useState<AuditLogEntry[]>([]);
```

**Fetching:**

```typescript
// Re-fetch whenever fromDate or toDate changes
useEffect(() => {
  getAuditLogs(fromDate, toDate).then(setEntries);
}, [fromDate, toDate]);
```

**List row — each entry displays:**

| Field | Notes |
|-------|-------|
| Timestamp | Formatted date + time |
| User name | Who performed the action |
| Action type | e.g. `CREATE`, `UPDATE`, `DELETE`, `LOGIN` |
| Entity | e.g. `Transaction`, `Product`, `User` |
| Note | Optional freetext detail |

**Layout:**

- Date range filter at the top (Start Date / End Date inputs)
- `FlatList` of audit entries below
- Show `EmptyState` when `entries` is empty
- Wrap in `ScreenWrapper`

---

## Acceptance Criteria

- [ ] Screen is blocked for users without `VIEW_REPORTS` permission
- [ ] Default date range is today (start of day → now)
- [ ] Changing either date re-fetches entries via `getAuditLogs(fromDate, toDate)`
- [ ] Each row shows: timestamp, user name, action type, entity, note
- [ ] `EmptyState` is shown when no entries match the filter
- [ ] Screen is wrapped in `ScreenWrapper`
- [ ] No TypeScript errors
