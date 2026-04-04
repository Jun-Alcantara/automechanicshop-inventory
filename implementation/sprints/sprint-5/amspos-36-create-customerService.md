# AMSPOS-36: Create customerService

**Sprint**: Sprint 5 — Inventory, Customer & Transaction Services
**Effort**: 0.5 day
**Dependencies**: AMSPOS-3, AMSPOS-8
**Phase**: Customers

---

## Description

Create `src/services/customerService.ts` for managing customers. Supports named customers and walk-in records with searchable phone and name fields.

---

## Instructions

### Customer Service Implementation

Create `src/services/customerService.ts` with the following implementation:

```typescript
import { database } from './database';
import { Q } from '@nozbe/watermelondb';
import type { Customer, User } from '../types';
import { CustomerModel } from '../models/CustomerModel';

interface CreateCustomerInput {
  type: 'NAMED' | 'WALKIN';
  name: string;
  phone?: string;
  email?: string;
}

/**
 * Observables - for store subscriptions
 */

export const observeCustomers = () =>
  database.get<CustomerModel>('customers')
    .query(Q.where('is_active', true), Q.sortBy('name', Q.asc))
    .observe();

/**
 * Reads - one-time fetches
 */

export const searchCustomers = async (query: string): Promise<Customer[]> => {
  const sanitized = Q.sanitizeLikeString(query);
  const models = await database.get<CustomerModel>('customers')
    .query(
      Q.where('is_active', true),
      Q.or(
        Q.where('name', Q.like(`%${sanitized}%`)),
        Q.where('phone', Q.like(`%${sanitized}%`))
      )
    )
    .fetch();
  return models.map(mapCustomerModel);
};

/**
 * Writes - with atomic audit log entries
 */

export const createCustomer = async (input: CreateCustomerInput, actingUser: User): Promise<Customer> => {
  let created: Customer | null = null;
  await database.write(async () => {
    const model = await database.get<CustomerModel>('customers').create((c) => {
      c.type = input.type;
      c.name = input.name;
      c.phone = input.phone ?? '';
      c.email = input.email ?? '';
      c.isActive = true;
      c.createdAt = new Date();
      c.createdBy = actingUser.id;
      c.updatedAt = new Date();
      c.updatedBy = actingUser.id;
    });
    await database.get('audit_logs').create((log: any) => {
      log.timestamp = new Date();
      log.userId = actingUser.id;
      log.userName = actingUser.displayName;
      log.actionType = 'CREATE_CUSTOMER';
      log.entityType = 'CUSTOMER';
      log.entityId = model.id;
      log.after = JSON.stringify({ name: input.name, type: input.type });
      log.note = '';
    });
    created = mapCustomerModel(model);
  });
  return created!;
};

export const updateCustomer = async (id: string, patch: Partial<CreateCustomerInput>, actingUser: User): Promise<void> => {
  const model = await database.get<CustomerModel>('customers').find(id);
  await database.write(async () => {
    const before: Record<string, unknown> = {};
    const after: Record<string, unknown> = {};
    await model.update((c) => {
      if (patch.name !== undefined) { before.name = c.name; after.name = patch.name; c.name = patch.name; }
      if (patch.phone !== undefined) { before.phone = c.phone; after.phone = patch.phone; c.phone = patch.phone; }
      if (patch.email !== undefined) { before.email = c.email; after.email = patch.email; c.email = patch.email; }
      c.updatedAt = new Date();
      c.updatedBy = actingUser.id;
    });
    await database.get('audit_logs').create((log: any) => {
      log.timestamp = new Date();
      log.userId = actingUser.id;
      log.userName = actingUser.displayName;
      log.actionType = 'EDIT_CUSTOMER';
      log.entityType = 'CUSTOMER';
      log.entityId = id;
      log.before = JSON.stringify(before);
      log.after = JSON.stringify(after);
      log.note = '';
    });
  });
};

/**
 * Helper functions
 */

const mapCustomerModel = (m: CustomerModel): Customer => ({
  id: m.id,
  type: m.type,
  name: m.name,
  phone: m.phone,
  email: m.email,
  isActive: m.isActive,
  createdAt: m.createdAt,
  createdBy: m.createdBy,
  updatedAt: m.updatedAt,
  updatedBy: m.updatedBy,
});
```

**Audit action types**: `CREATE_CUSTOMER`, `EDIT_CUSTOMER`. **Entity type**: `CUSTOMER`.

**Important**: WatermelonDB LIKE queries must use `Q.sanitizeLikeString()` to escape user input and prevent SQL injection.

---

## Acceptance Criteria

- [ ] `observeCustomers()` returns a WatermelonDB Observable containing only active customers, sorted by name
- [ ] `searchCustomers()` performs case-insensitive partial matching on both name and phone fields using `Q.like` and `Q.sanitizeLikeString()`
- [ ] `createCustomer()` atomically creates a customer record and writes an audit log in a single `database.write()` block
- [ ] `updateCustomer()` atomically updates customer fields and writes an audit log with before/after values in a single `database.write()` block
- [ ] All functions are properly typed with TypeScript
- [ ] No TypeScript compilation errors

## Definition of Done

- All acceptance criteria are met
- `npx tsc --noEmit` passes
- Code committed to `main`
