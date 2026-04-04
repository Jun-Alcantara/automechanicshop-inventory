# AMSPOS-62: `src/screens/admin/VehicleDetailScreen.tsx`

**Sprint**: Sprint 10 — Customer & Vehicle Screens
**Effort**: 0.5 day
**Dependencies**: AMSPOS-37 (vehicleService), AMSPOS-42 (transactionService)
**Phase**: Customers

---

## Description

Read-only detail screen for a vehicle. Shows vehicle info and its service history (transactions linked to this vehicle).

---

## Instructions

### 1. `src/screens/admin/VehicleDetailScreen.tsx`

**Route params:**

```typescript
type Params = { vehicleId: string };
```

**Two sections:**

#### 1. Vehicle Info

- Make, Model, Color, Plate Number
- **Edit button** → navigate to `VehicleForm` with `{ vehicleId }`

#### 2. Service History

- All transactions where `vehicleId` matches — statuses: `FINALIZED`, `VOIDED`, `RETURNED`
- Sorted by date descending
- Each row: date, total (`formatPHP`), status badge
- Tap row → navigate to `TransactionHistoryDetail` with `{ transactionId }`
- Show `EmptyState` if no transactions

**Layout:** `ScreenWrapper` → `ScrollView`.

---

## Acceptance Criteria

- [ ] Displays make, model, color, and plate number
- [ ] Edit button navigates to `VehicleForm` with `vehicleId`
- [ ] Service history lists transactions linked to this vehicle, sorted by date desc
- [ ] Each history row shows date, total, and status badge
- [ ] Tapping a history row navigates to `TransactionHistoryDetail`
- [ ] `EmptyState` shown when no service history
- [ ] Screen is wrapped in `ScreenWrapper`
- [ ] No TypeScript errors
