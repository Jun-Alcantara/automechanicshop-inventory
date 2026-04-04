# AMSPOS-34: Create serviceItemService

**Sprint**: Sprint 5 — Inventory, Customer & Transaction Services
**Effort**: 0.5 day
**Dependencies**: AMSPOS-3, AMSPOS-8
**Phase**: Inventory

---

## Description

Create `src/services/serviceItemService.ts` for managing salon or auto-shop service items. Service items are priced labour or treatment entries (e.g. "Oil Change", "Haircut") that appear on POS transactions alongside products. The service supports a reactive observable for list screens, plus create, update, and soft-delete operations. All writes are atomic with their audit log entries.

Note: The WatermelonDB model for service items is `ServiceModel` with table name `services` (defined in `src/models/ServiceModel.ts`).

---

## Instructions

### 1. `src/services/serviceItemService.ts`

```typescript
import { database } from './database';
import { Q } from '@nozbe/watermelondb';
import { ServiceModel } from '../models/ServiceModel';
import { appendAuditLog } from './auditService';
import type { ServiceItem, User } from '../types';

// ─── Mapper ───────────────────────────────────────────────────────────────────

const mapServiceModel = (m: ServiceModel): ServiceItem => ({
  id: m.id,
  name: m.name,
  basePrice: m.basePrice,
  isActive: m.isActive,
  createdAt: m.createdAt,
  createdBy: m.createdBy,
  updatedAt: m.updatedAt,
  updatedBy: m.updatedBy,
});

// ─── Input Types ──────────────────────────────────────────────────────────────

interface CreateServiceInput {
  name: string;
  basePrice: number;
}

// ─── Observable ───────────────────────────────────────────────────────────────

/**
 * Observable query for all active service items sorted alphabetically.
 * Subscribed to by useInventoryStore for the services list screen.
 */
export const observeServiceItems = () =>
  database
    .get<ServiceModel>('services')
    .query(Q.where('is_active', true), Q.sortBy('name', Q.asc))
    .observe();

// ─── Writes ───────────────────────────────────────────────────────────────────

/**
 * Creates a new service item and appends a CREATE_SERVICE audit log entry
 * in the same atomic write block.
 */
export const createServiceItem = async (
  input: CreateServiceInput,
  actingUser: User
): Promise<ServiceItem> => {
  let created: ServiceItem | null = null;

  await database.write(async () => {
    const model = await database.get<ServiceModel>('services').create((s) => {
      s.name = input.name;
      s.basePrice = input.basePrice;
      s.isActive = true;
      s.createdAt = new Date();
      s.createdBy = actingUser.id;
      s.updatedAt = new Date();
      s.updatedBy = actingUser.id;
    });

    await appendAuditLog({
      userId: actingUser.id,
      userName: actingUser.displayName,
      actionType: 'CREATE_SERVICE',
      entityType: 'SERVICE',
      entityId: model.id,
      after: {
        name: input.name,
        basePrice: input.basePrice,
      },
    });

    created = mapServiceModel(model);
  });

  return created!;
};

/**
 * Applies a partial patch to an existing service item and appends an
 * EDIT_SERVICE audit log entry capturing the before and after values
 * of changed fields.
 */
export const updateServiceItem = async (
  id: string,
  patch: Partial<CreateServiceInput>,
  actingUser: User
): Promise<void> => {
  const model = await database.get<ServiceModel>('services').find(id);

  await database.write(async () => {
    const before: Record<string, unknown> = {};
    const after: Record<string, unknown> = {};

    await model.update((s) => {
      if (patch.name !== undefined) {
        before.name = s.name;
        after.name = patch.name;
        s.name = patch.name;
      }
      if (patch.basePrice !== undefined) {
        before.basePrice = s.basePrice;
        after.basePrice = patch.basePrice;
        s.basePrice = patch.basePrice;
      }
      s.updatedAt = new Date();
      s.updatedBy = actingUser.id;
    });

    await appendAuditLog({
      userId: actingUser.id,
      userName: actingUser.displayName,
      actionType: 'EDIT_SERVICE',
      entityType: 'SERVICE',
      entityId: id,
      before,
      after,
    });
  });
};

/**
 * Soft-deletes a service item by setting isActive to false.
 * No audit log is written for deactivation — service deactivation is not
 * in the audit matrix (functional_requirements.md §1.4).
 *
 * Note: If the audit matrix is later updated to require DEACTIVATE_SERVICE,
 * add an appendAuditLog call inside this write block following the same
 * pattern as deactivateProduct.
 */
export const deactivateServiceItem = async (
  id: string,
  actingUser: User
): Promise<void> => {
  const model = await database.get<ServiceModel>('services').find(id);

  await database.write(async () => {
    await model.update((s) => {
      s.isActive = false;
      s.updatedAt = new Date();
      s.updatedBy = actingUser.id;
    });
  });
};
```

---

## Acceptance Criteria

- [ ] `observeServiceItems()` returns a WatermelonDB Observable scoped to `is_active = true`, sorted by name ascending
- [ ] `observeServiceItems()` queries the `services` table via `ServiceModel` (not `service_items`)
- [ ] `createServiceItem` writes the service record and a `CREATE_SERVICE` audit log entry in a single `database.write()` block
- [ ] `updateServiceItem` records before/after values for every changed field in the `EDIT_SERVICE` audit log entry
- [ ] `deactivateServiceItem` sets `isActive = false` and stamps `updatedAt` / `updatedBy`; no audit log entry (not in audit matrix)
- [ ] All writes use `appendAuditLog` (not `logEvent`) so they share the caller's `database.write()` transaction
- [ ] `mapServiceModel` maps all `ServiceModel` fields to the plain `ServiceItem` interface
- [ ] No TypeScript errors

## Definition of Done

- All acceptance criteria are met
- `npx tsc --noEmit` passes
- Code committed to `main`
