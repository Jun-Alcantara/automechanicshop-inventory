# AMSPOS-63: `src/screens/admin/VehicleFormScreen.tsx`

**Sprint**: Sprint 10 — Customer & Vehicle Screens
**Effort**: 0.5 day
**Dependencies**: AMSPOS-37 (vehicleService)
**Phase**: Customers

---

## Description

Create or edit a vehicle record linked to a customer.

---

## Instructions

### 1. `src/screens/admin/VehicleFormScreen.tsx`

**Route params:**

```typescript
type Params = {
  vehicleId?: string;   // present = edit mode
  customerId: string;   // always required (owner)
};
```

**Form fields:**

| Field | Type | Rules |
|-------|------|-------|
| Make | Text | Required |
| Model | Text | Optional |
| Color | Text | Optional |
| Plate Number | Text | Optional |

**Submit:**

```typescript
// Create: createVehicle({ customerId, make, model?, color?, plateNumber? })
// Edit:   updateVehicle(vehicleId, { make, model?, color?, plateNumber? })
// Validation on submit — inline errors via AppInput.error
// No optimistic UI — wait for service call before navigating back
```

**Layout:** Wrap in `ScreenWrapper`.

---

## Acceptance Criteria

- [ ] Create mode: blank form; submitting valid data calls `createVehicle` with `customerId`
- [ ] Edit mode: form pre-filled with existing vehicle data; submitting calls `updateVehicle`
- [ ] Make field is required; model, color, plate number are optional
- [ ] Validation errors shown inline
- [ ] Screen is wrapped in `ScreenWrapper`
- [ ] No TypeScript errors
