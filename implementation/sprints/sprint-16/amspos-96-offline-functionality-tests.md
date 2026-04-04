# AMSPOS-96: Test Offline Functionality

**Sprint**: Sprint 16 — Final QA & Documentation
**Effort**: 0.5 day
**Dependencies**: All core flows (transactions, inventory, customers)
**Phase**: Polish

---

## Overview

Verify the app works identically with no internet connection.

---

## Test Scenarios

1. Enable Airplane Mode → verify app loads normally from PinLock
2. In Airplane Mode: create a transaction, add items, finalize, print receipt
3. In Airplane Mode: create a new product with a custom category
4. In Airplane Mode: void a transaction
5. In Airplane Mode: search customers and vehicles
6. Disable Airplane Mode → verify no errors, data is consistent

**Expected result**: Every operation listed above completes successfully. Connectivity status has no effect on functionality.

---

## Acceptance Criteria

- [ ] App loads from PinLock with Airplane Mode enabled
- [ ] Full transaction (create → add items → finalize → print) works offline
- [ ] Product + category creation works offline
- [ ] Void transaction works offline
- [ ] Customer/vehicle search works offline
- [ ] Re-enabling connectivity causes no errors and data remains consistent

## Definition of Done

- All acceptance criteria are met
- Results documented
- Code committed to `main`
