# AMSPOS-98: Test Bluetooth Printer

**Sprint**: Sprint 16 — Final QA & Documentation
**Effort**: 0.5 day
**Dependencies**: SettingsScreen printer config, ReceiptScreen, PDF fallback
**Phase**: Polish

---

## Overview

Test all Bluetooth printer scenarios including happy path, failure/retry, and PDF fallback.

---

## Test Scenarios

1. SettingsScreen → Scan → connect to thermal printer → connection confirmed
2. ReceiptScreen → Print → receipt prints on 80mm paper with correct layout
3. ReceiptScreen → printer off → "Retry or skip?" alert appears
4. Retry → turn printer on during retry → prints successfully
5. Skip → navigates to Dashboard without printing
6. PDF fallback → Download PDF → share sheet opens with correct PDF
7. Void receipt → includes "VOID" notice and original transaction ID
8. Return receipt → includes "RETURN" notice

---

## Acceptance Criteria

- [ ] Printer connects successfully from SettingsScreen
- [ ] Receipt prints with correct layout on 80mm thermal paper
- [ ] Printer-off failure shows "Retry or skip?" alert
- [ ] Retry succeeds when printer is turned on mid-retry
- [ ] Skip navigates to Dashboard without error
- [ ] PDF share sheet opens correctly
- [ ] Void receipt shows "VOID" notice and original transaction ID
- [ ] Return receipt shows "RETURN" notice

## Definition of Done

- All acceptance criteria are met
- Tested on physical Android device with real printer
- Code committed to `main`
