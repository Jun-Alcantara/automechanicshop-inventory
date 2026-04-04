# AMSPOS-37: Create vehicleService

**Sprint**: Sprint 5 — Inventory, Customer & Transaction Services
**Effort**: 0.5 day
**Dependencies**: AMSPOS-3, AMSPOS-8, AMSPOS-36
**Phase**: Customers

---

## Description

Create `src/services/vehicleService.ts` for managing customer vehicles. Vehicles are linked to a specific customer and are selected when opening an auto-shop transaction. The service provides a per-customer observable query for the vehicle list panel, a plate number search for quick lookup at the POS counter, and create/update operations. No audit log entries are required for vehicle operations — vehicles are not in the audit matrix (`functional_requirements.md §1.4`). This service depends on AMSPOS-36 (customerService) because vehicles are always associated with an existing customer record.

---

## Instructions

### 1. `src/services/vehicleService.ts`

```typescript
import { database } from './database';
import { Q } from '@nozbe/watermelondb';
import { VehicleModel } from '../models/VehicleModel';
import type { Vehicle, User } from '../types';

// ─── Mapper ───────────────────────────────────────────────────────────────────

const mapVehicleModel = (m: VehicleModel): Vehicle => ({
  id: m.id,
  customerId: m.customerId,
  make: m.make,
  model: m.model,
  color: m.color,
  plateNumber: m.plateNumber,
  createdAt: m.createdAt,
  createdBy: m.createdBy,
});

// ─── Input Types ──────────────────────────────────────────────────────────────

interface CreateVehicleInput {
  customerId: string;
  make: string;
  model?: string;
  color?: string;
  plateNumber?: string;
}

// ─── Observable ───────────────────────────────────────────────────────────────

/**
 * Observable query for all vehicles belonging to a specific customer.
 * Subscribed to by the vehicle picker panel on the new transaction screen.
 * Re-evaluates automatically when vehicles are added or updated for this customer.
 */
export const observeVehiclesForCustomer = (customerId: string) =>
  database
    .get<VehicleModel>('vehicles')
    .query(Q.where('customer_id', customerId))
    .observe();

// ─── Reads ────────────────────────────────────────────────────────────────────

/**
 * Returns all vehicles whose plate number contains the given string
 * (case-insensitive partial match). Used by the plate number search bar
 * on the POS counter to quickly associate a vehicle with an inbound transaction.
 *
 * Uses Q.sanitizeLikeString to escape any special LIKE characters in the input
 * before wrapping with % wildcards.
 */
export const searchVehiclesByPlate = async (plate: string): Promise<Vehicle[]> => {
  const models = await database
    .get<VehicleModel>('vehicles')
    .query(
      Q.where('plate_number', Q.like(`%${Q.sanitizeLikeString(plate)}%`))
    )
    .fetch();

  return models.map(mapVehicleModel);
};

// ─── Writes ───────────────────────────────────────────────────────────────────

/**
 * Creates a new vehicle linked to the given customer.
 * No audit log entry (vehicles are not in the audit matrix).
 */
export const createVehicle = async (
  input: CreateVehicleInput,
  actingUser: User
): Promise<Vehicle> => {
  let created: Vehicle | null = null;

  await database.write(async () => {
    const model = await database.get<VehicleModel>('vehicles').create((v) => {
      v.customerId = input.customerId;
      v.make = input.make;
      v.model = input.model ?? '';
      v.color = input.color ?? '';
      v.plateNumber = input.plateNumber ?? '';
      v.createdAt = new Date();
      v.createdBy = actingUser.id;
    });

    created = mapVehicleModel(model);
  });

  return created!;
};

/**
 * Applies a partial patch to an existing vehicle record.
 * No audit log entry (vehicles are not in the audit matrix).
 */
export const updateVehicle = async (
  id: string,
  patch: Partial<CreateVehicleInput>,
  actingUser: User
): Promise<void> => {
  const model = await database.get<VehicleModel>('vehicles').find(id);

  await database.write(async () => {
    await model.update((v) => {
      if (patch.make !== undefined) {
        v.make = patch.make;
      }
      if (patch.model !== undefined) {
        v.model = patch.model;
      }
      if (patch.color !== undefined) {
        v.color = patch.color;
      }
      if (patch.plateNumber !== undefined) {
        v.plateNumber = patch.plateNumber;
      }
    });
  });
};
```

---

## Acceptance Criteria

- [ ] `observeVehiclesForCustomer(customerId)` returns a WatermelonDB Observable filtered by `customer_id`
- [ ] `searchVehiclesByPlate` uses `Q.like(`%${Q.sanitizeLikeString(plate)}%`)` for the partial plate match
- [ ] `searchVehiclesByPlate` returns a `Vehicle[]` (empty array when no match, never throws on no results)
- [ ] `createVehicle` defaults optional fields (`model`, `color`, `plateNumber`) to an empty string when not provided
- [ ] `createVehicle` sets `createdAt` and `createdBy` from `actingUser`
- [ ] `updateVehicle` patches only the fields present in the `patch` argument, leaving others unchanged
- [ ] `updateVehicle` does not update `customerId` — vehicle ownership is immutable after creation
- [ ] No `appendAuditLog` or `logEvent` calls exist anywhere in this file
- [ ] `mapVehicleModel` maps all `VehicleModel` fields to the plain `Vehicle` interface
- [ ] No TypeScript errors

## Definition of Done

- All acceptance criteria are met
- `npx tsc --noEmit` passes
- Code committed to `main`
