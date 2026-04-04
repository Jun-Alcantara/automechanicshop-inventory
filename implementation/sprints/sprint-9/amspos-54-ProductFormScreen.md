# AMSPOS-54: `src/screens/inventory/ProductFormScreen.tsx`

**Sprint**: Sprint 9 — Product/Service Forms, Customer List & Barcode Scanner
**Effort**: 2 days
**Dependencies**: AMSPOS-33 (productService), AMSPOS-41 (inventoryStore), AMSPOS-42 (catalogStore — categories, suppliers), AMSPOS-72 (BarcodeScannerModal)
**Phase**: Inventory

---

## Description

Create or edit a product. Route param `productId` determines mode. Gated by `MANAGE_INVENTORY`.

---

## Instructions

### 1. `src/screens/inventory/ProductFormScreen.tsx`

**Permission guard:**

```typescript
usePermissionGuard('MANAGE_INVENTORY');
```

**Route params:**

```typescript
type Params = { productId?: string };
// productId present → edit mode (pre-populate form)
// productId absent  → create mode (blank form)
```

**Form fields:**

| Field | Type | Rules |
|-------|------|-------|
| Name | Text | Required |
| Barcode | Text + Scan button | Optional; see barcode flow below |
| Selling Price | Numeric | Required |
| Cost Price | Numeric | Required |
| Unit of Measure | Text | Required (e.g. "piece", "liter") |
| Stock Available | Numeric | Required on create, min 0 |
| Low Stock Threshold | Numeric | Optional, default 0 |
| Category | Picker | Optional; items from `catalogStore.categories` |
| Supplier | Picker | Optional; items from `catalogStore.suppliers` |
| VAT Type | Picker | Options: `No VAT` \| `VAT Exclusive` \| `VAT Inclusive` |

**Barcode scan flow:**

```typescript
// "Scan" button next to the barcode field:
// 1. Call setBarcodeCallback((barcode) => setFieldValue('barcode', barcode))
// 2. Navigate to BarcodeScannerModal
// 3. On return, barcode field is populated with scanned value
// 4. If barcode already exists in DB → warn user with Alert:
//    "A product with this barcode already exists."
```

**Deactivate button** (edit mode only):

```typescript
Alert.alert(
  'Deactivate Product',
  `Deactivate "${product.name}"? It will no longer appear in the catalog.`,
  [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Deactivate', style: 'destructive', onPress: () => deactivateProduct(productId) },
  ]
);
```

**Submit:**

```typescript
// Create: createProduct({ name, barcode, sellingPrice, costPrice, unit, stockAvailable, lowStockThreshold, categoryId, supplierId, vatType })
// Edit:   updateProduct(productId, { ...fields })
// Validation on submit — show inline errors via AppInput.error
// Wait for service call to complete before navigating back (no optimistic UI)
```

**Layout:** Wrap in `ScreenWrapper` → `ScrollView` (form is long).

---

## Acceptance Criteria

- [ ] Screen is blocked for users without `MANAGE_INVENTORY`
- [ ] Create mode: all fields blank; submitting valid data calls `createProduct`
- [ ] Edit mode: all fields pre-filled from existing product; submitting calls `updateProduct`
- [ ] "Scan" button opens `BarcodeScannerModal` and populates the barcode field on scan
- [ ] Duplicate barcode shows a warning alert
- [ ] Deactivate button visible only in edit mode; shows confirmation before calling `deactivateProduct`
- [ ] Validation errors shown inline below each field
- [ ] Screen is wrapped in `ScreenWrapper` inside a `ScrollView`
- [ ] No TypeScript errors
