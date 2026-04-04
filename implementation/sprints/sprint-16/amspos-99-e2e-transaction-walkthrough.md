# AMSPOS-99: End-to-End Transaction Walkthrough

**Sprint**: Sprint 16 — Final QA & Documentation
**Effort**: 1 day
**Dependencies**: All features complete
**Phase**: Polish

---

## Overview

Full 21-step scenario test to be executed before release. Covers the complete vehicle service visit lifecycle.

---

## Scenario: Complete Vehicle Service Visit

1. PIN Login as Main Admin
2. Dashboard: verify "0 orders today" and "$0.00 total today"
3. Inventory: Add product "Engine Oil 5W-30" (₱450, stock 10, VAT Inclusive)
4. Inventory: Add service "Oil Change" (₱300, No VAT)
5. Transactions → New Transaction
6. Search for customer "Juan dela Cruz" (plate ABC-123)
7. Add "Engine Oil 5W-30" (qty 2) → stock should be 8 available, 2 reserved
8. Add "Oil Change" service
9. Apply 10% discount to "Engine Oil 5W-30"
10. Add-on "Disposal Fee" ₱50 to "Engine Oil 5W-30"
11. Verify totals: correct subtotal, VAT, total
12. Proceed to Payment → pay ₱1,200 cash
13. Verify change due = ₱1,200 - actual total
14. Finalize → navigate to ReceiptScreen
15. Print receipt (or PDF)
16. Return to Dashboard: verify sales total and order count updated
17. Check stock: Engine Oil stock = 8 (2 committed, stockReserved = 0)
18. View Transaction History for Juan → transaction visible
19. Void the transaction with reason "Test void"
20. Verify stock restored: Engine Oil back to 10
21. Logout → PinLock screen shown

---

## Acceptance Criteria

- [ ] All 21 steps complete without errors
- [ ] Stock reservation is correct at step 7 (8 available, 2 reserved)
- [ ] Totals (subtotal, VAT, total) are correct at step 11
- [ ] Change due calculates correctly at step 13
- [ ] Dashboard counters update correctly at step 16
- [ ] stockReserved = 0 after finalize at step 17
- [ ] Transaction appears in customer history at step 18
- [ ] Stock fully restored after void at step 20
- [ ] PinLock shown after logout at step 21

## Definition of Done

- All acceptance criteria are met
- Walkthrough executed on physical Android device
- Code committed to `main`
