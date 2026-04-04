# AMSPOS-93: Service Layer Tests

**Sprint**: Sprint 15 — Testing
**Effort**: 1.5 days
**Dependencies**: All service files, WatermelonDB in-memory adapter, FileSystem mock
**Phase**: Polish

---

## Overview

Test each service function in isolation using a mock or in-memory database.

---

## Test Files & Key Scenarios

### productService
```typescript
// src/services/__tests__/productService.test.ts
// - createProduct() writes record to DB
// - deactivateProduct() sets is_active = false
```

### customerService
```typescript
// src/services/__tests__/customerService.test.ts
// - searchCustomers() returns results for partial name matches
// - searchCustomers() returns empty array when no match
```

### catalogService
```typescript
// src/services/__tests__/catalogService.test.ts
// - createCategory() writes to DB
// - getCategories() returns all active categories
```

### vehicleService
```typescript
// src/services/__tests__/vehicleService.test.ts
// - createVehicle() links correctly to customer
// - getVehiclesByCustomer() returns only that customer's vehicles
```

### transactionService
```typescript
// src/services/__tests__/transactionService.test.ts
// - createTransaction() sets status = IN_PROGRESS
// - addLineItem() is atomic (stock + line item written together)
```

### settingsService
```typescript
// src/services/__tests__/settingsService.test.ts
// Uses FileSystem mock (not real FS)
// - saveSettings() writes JSON to expected file path
// - loadSettings() reads and parses settings JSON correctly
// - loadSettings() returns defaults when file does not exist
```

---

## Acceptance Criteria

- [ ] `productService`: createProduct writes to DB; deactivateProduct sets is_active=false
- [ ] `customerService`: searchCustomers returns partial name matches
- [ ] `catalogService`: createCategory and getCategories work correctly
- [ ] `vehicleService`: vehicle links to correct customer; getVehiclesByCustomer scoped correctly
- [ ] `transactionService`: createTransaction sets IN_PROGRESS; addLineItem is atomic
- [ ] `settingsService`: save/load/defaults all work with mocked FileSystem
- [ ] All tests pass with `npm test`

## Definition of Done

- All acceptance criteria are met
- `npm test` runs with 0 failures
- Code committed to `main`
