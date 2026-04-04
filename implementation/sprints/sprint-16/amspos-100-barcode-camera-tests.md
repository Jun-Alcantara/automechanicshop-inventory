# AMSPOS-100: Test Barcode Scanning & Camera Integration

**Sprint**: Sprint 16 — Final QA & Documentation
**Effort**: 0.5 day
**Dependencies**: BarcodeScannerModal, ProductFormScreen, TransactionDetailScreen, camera permissions
**Phase**: Polish

---

## Overview

Test barcode scanning and camera integration on a physical Android device.

---

## Test Scenarios

1. ProductFormScreen → tap "Scan Barcode" → camera opens
2. Scan an EAN-13 barcode → barcode field populated correctly
3. Scan a QR code → barcode field populated correctly
4. Camera permission denied → permission request dialog shown
5. TransactionDetailScreen → scan a known barcode → "Add to Cart?" modal appears
6. Scan unknown barcode from transaction → UnknownBarcodeAlert → tap "Create Product" → ProductFormScreen opens with barcode pre-filled

---

## Acceptance Criteria

- [ ] Camera opens from ProductFormScreen barcode scan button
- [ ] EAN-13 barcode scan populates barcode field
- [ ] QR code scan populates barcode field
- [ ] Permission denied shows permission request (not a crash)
- [ ] Known barcode from transaction shows "Add to Cart?" modal
- [ ] Unknown barcode flows to ProductFormScreen with barcode pre-filled

## Definition of Done

- All acceptance criteria are met
- Tested on physical Android device
- Code committed to `main`
