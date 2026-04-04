# AMSPOS-60: `src/screens/admin/CustomerDetailScreen.tsx`

**Sprint**: Sprint 10 — Customer & Vehicle Screens
**Effort**: 1 day
**Dependencies**: AMSPOS-36 (customerService), AMSPOS-37 (vehicleService), AMSPOS-42 (transactionService)
**Phase**: Customers

---

## Description

Read-only detail screen for a customer. Shows customer info, their vehicles, and transaction history. Refreshes on focus.

---

## Instructions

### 1. `src/screens/admin/CustomerDetailScreen.tsx`

**Route params:**

```typescript
type Params = { customerId: string };
```

**Data loading:**

```typescript
useFocusEffect(useCallback(() => {
  loadCustomer(customerId);
  subscribeVehicles(customerId);   // observeVehiclesForCustomer()
  loadTransactionHistory(customerId);
}, [customerId]));
```

**Three sections:**

#### 1. Customer Info

- Name (or nickname for walk-ins)
- Type badge: `Named` | `Walk-in`
- Phone, Email
- **Edit button** → navigate to `CustomerForm` with `{ customerId }`

#### 2. Vehicles

- List of vehicles from `observeVehiclesForCustomer(customerId)`
- Each row: `{make} {model} ({color}) — {plateNumber}`
- Tap row → navigate to `VehicleDetail` with `{ vehicleId }`
- **"Add Vehicle" button** → navigate to `VehicleForm` with `{ customerId }` (no `vehicleId`)
- Show `EmptyState` if no vehicles

#### 3. Transaction History

- All `FINALIZED` / `VOIDED` / `RETURNED` transactions for this customer
- Each row: date, total (`formatPHP`), status badge
- Tap row → navigate to `TransactionHistoryDetail` with `{ transactionId }`
- Show `EmptyState` if no transactions

**Layout:** `ScreenWrapper` → `ScrollView` with three sections separated by `SectionHeader`.

---

## Acceptance Criteria

- [ ] Displays customer name/nickname, type badge, phone, and email
- [ ] Edit button navigates to `CustomerForm` with the customer's ID
- [ ] Vehicles section lists all vehicles from `observeVehiclesForCustomer`
- [ ] Tapping a vehicle row navigates to `VehicleDetail`
- [ ] "Add Vehicle" navigates to `VehicleForm` with `customerId` (no `vehicleId`)
- [ ] Transaction history shows date, total, and status badge per row
- [ ] Tapping a transaction navigates to `TransactionHistoryDetail`
- [ ] Both lists show `EmptyState` when empty
- [ ] Data refreshes on screen focus via `useFocusEffect`
- [ ] Screen is wrapped in `ScreenWrapper`
- [ ] No TypeScript errors
