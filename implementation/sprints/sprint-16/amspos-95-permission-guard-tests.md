# AMSPOS-95: Test All Permission Guards on All Screens

**Sprint**: Sprint 16 — Final QA & Documentation
**Effort**: 0.5 day
**Dependencies**: All guarded screens, usePermissionGuard hook
**Phase**: Polish

---

## Overview

Manually test every permission-gated screen to verify guards are enforced correctly.

---

## Screens with Permission Guards

| Screen | Required Permission |
|--------|-------------------|
| ProductFormScreen | MANAGE_INVENTORY |
| ServiceFormScreen | MANAGE_INVENTORY |
| CategoryListScreen | MANAGE_INVENTORY |
| SupplierListScreen | MANAGE_INVENTORY |
| AddOnCatalogScreen | MANAGE_INVENTORY |
| UserListScreen | MANAGE_USERS |
| UserFormScreen | MANAGE_USERS |
| ReportsScreen | VIEW_REPORTS |
| AuditLogScreen | VIEW_REPORTS |
| SettingsScreen | MANAGE_SETTINGS |
| VoidTransactionScreen | VOID_TRANSACTIONS |
| ReturnTransactionScreen | VOID_TRANSACTIONS |

---

## Test Matrix

### User with NO permissions
- Navigate to each guarded screen → verify redirect back with alert

### User with ONLY MANAGE_INVENTORY
- Inventory screens accessible
- All other guarded screens redirect with alert

### Main Admin
- All screens accessible — no guards triggered

---

## Deliverable

Create test checklist: `implementation/test-plans/permission-guard-test-plan.md`

---

## Acceptance Criteria

- [ ] Test plan document created at `implementation/test-plans/permission-guard-test-plan.md`
- [ ] No-permission user: all guarded screens navigate back with alert
- [ ] MANAGE_INVENTORY-only user: only inventory screens accessible
- [ ] Main Admin: all screens accessible
- [ ] Results documented in test plan

## Definition of Done

- All acceptance criteria are met
- Test plan committed to `main`
