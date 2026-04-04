# AMSPOS-92: Integration Tests — Transaction Flow

**Sprint**: Sprint 15 — Testing
**Effort**: 2 days
**Dependencies**: WatermelonDB schema, all transaction services, product/user services
**Phase**: Polish

---

## Overview

Test the complete transaction lifecycle using an in-memory WatermelonDB test database.

---

## Test Setup

```typescript
// src/services/__tests__/transactionFlow.test.ts
import { Database } from '@nozbe/watermelondb';
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite';
import { schema } from '../../services/schema';
// ... import all models and services

let db: Database;
let actingUser: User;

beforeAll(async () => {
  const adapter = new SQLiteAdapter({ schema, dbName: ':memory:' });
  db = new Database({ adapter, modelClasses: [ /* all models */ ] });
  actingUser = await createMainAdmin('Test Admin', '123456');
});
```

---

## Test Scenarios

```typescript
describe('Transaction lifecycle', () => {
  it('creates a transaction with IN_PROGRESS status', async () => {
    const txn = await createTransaction({ cashierId: actingUser.id }, actingUser);
    expect(txn.status).toBe('IN_PROGRESS');
  });

  it('adds a product and reserves stock atomically', async () => {
    const product = await createProduct(
      { name: 'Oil', sellingPrice: 100, stockAvailable: 5, ... },
      actingUser
    );
    const txn = await createTransaction({ cashierId: actingUser.id }, actingUser);
    await addLineItem(txn.id, product, actingUser);
    const updatedProduct = await getProductById(product.id);
    expect(updatedProduct?.stockAvailable).toBe(4);
    expect(updatedProduct?.stockReserved).toBe(1);
  });

  it('finalizing a transaction commits stock', async () => {
    // Setup: create product (stock=5), create txn, add item
    // Action: finalize transaction
    // Assert: stockReserved decremented, stockAvailable unchanged from reserved state
  });

  it('voiding a transaction releases reserved stock', async () => {
    // Setup: create product, txn, add item, finalize
    // Action: void transaction
    // Assert: stock fully restored to original
  });

  it('void is blocked when a return exists', async () => {
    // Setup: create product, txn, add item, finalize, process return
    // Action: attempt voidTransaction
    // Assert: throws error
  });
});
```

---

## Acceptance Criteria

- [ ] Creating a transaction sets status to `IN_PROGRESS`
- [ ] Adding a line item atomically decrements `stockAvailable` and increments `stockReserved`
- [ ] Finalizing a transaction commits stock (stockReserved decremented)
- [ ] Voiding releases all reserved/committed stock
- [ ] Void throws when a return already exists for the transaction
- [ ] All tests use in-memory SQLite (no real DB touched)
- [ ] All tests pass with `npm test`

## Definition of Done

- All acceptance criteria are met
- `npm test` runs with 0 failures
- Code committed to `main`
