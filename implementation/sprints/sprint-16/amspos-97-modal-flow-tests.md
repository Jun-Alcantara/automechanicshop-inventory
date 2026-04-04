# AMSPOS-97: Test All Modals & Flows

**Sprint**: Sprint 16 — Final QA & Documentation
**Effort**: 1 day
**Dependencies**: BarcodeScannerModal, DiscountPickerModal, AddOnPickerModal, CustomerSearchModal
**Phase**: Polish

---

## Overview

Manually test all modal components with their edge cases.

---

## BarcodeScannerModal

- Scan a known barcode → "Add to Cart" confirmation appears
- Scan an unknown barcode from TransactionScreen → UnknownBarcodeAlert appears
- Scan from InventoryListScreen → product detail shown
- Scan from ProductFormScreen → barcode field populated
- Tap Cancel → returns without scanning

---

## DiscountPickerModal

- Apply Fixed discount → line item total reduces correctly
- Apply Percentage discount → line item total reduces correctly
- Toggle from Fixed to Percentage → previous value is cleared
- Remove discount → line item total reverts to original price
- Percentage > 100% is blocked by validation

---

## AddOnPickerModal

- Select from catalog → add-on appears on line item
- Create custom add-on → `isOnTheFly=true`, not saved to catalog
- Custom add-on name required (validation blocks empty submit)
- Custom add-on amount required (validation blocks empty submit)

---

## CustomerSearchModal

- Search by name → results appear
- Search by phone number → results appear
- Search by plate number → vehicle results appear
- Select customer only (no vehicle) → transaction created with no vehicle
- Walk-in flow → duplicate nickname prompt appears when name already exists

---

## Acceptance Criteria

- [ ] All BarcodeScannerModal scenarios pass
- [ ] All DiscountPickerModal scenarios pass (including >100% block)
- [ ] All AddOnPickerModal scenarios pass (catalog + custom + validation)
- [ ] All CustomerSearchModal scenarios pass (name, phone, plate, walk-in)

## Definition of Done

- All acceptance criteria are met
- Code committed to `main`
