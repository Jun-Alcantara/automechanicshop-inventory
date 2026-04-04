# AMSPOS-75: `src/screens/modals/CustomerSearchModal.tsx`

**Sprint**: Sprint 10 — Customer & Vehicle Screens
**Effort**: 2 days
**Dependencies**: AMSPOS-36 (customerService), AMSPOS-37 (vehicleService)
**Phase**: Transactions / Customers

---

## Description

Full-screen modal for selecting a customer (and optionally a vehicle) during the New Transaction flow. Supports search by name, phone, or plate number. Includes a walk-in quick-select flow.

---

## Instructions

### 1. Callback pattern

Use the same module-level callback pattern as `BarcodeScannerModal`:

```typescript
let _pendingOnSelect: ((customerId: string, vehicleId?: string) => void) | null = null;

export const setCustomerSearchCallback = (
  cb: (customerId: string, vehicleId?: string) => void
) => {
  _pendingOnSelect = cb;
};
```

Callers (e.g. `NewTransactionScreen`) must:
1. Call `setCustomerSearchCallback((customerId, vehicleId) => { /* apply to draft */ })`
2. Then navigate to the `CustomerSearch` modal screen

### 2. `src/screens/modals/CustomerSearchModal.tsx`

**Search:**

```typescript
const [query, setQuery] = useState('');

// On query change (debounce ~300ms):
const customers = await searchCustomers(query);       // match on name + phone
const vehicles  = await searchVehiclesByPlate(query); // match on plate number
```

**Results list — two row types:**

| Type | Display |
|------|---------|
| Customer row | Name/nickname, type badge (`Named`/`Walk-in`), phone |
| Vehicle row | Plate number, make/model, linked customer name |

**Tap customer row:**

- If customer has vehicles → show an inline sub-list to pick a vehicle (optional — user may skip)
- If no vehicles → call `_pendingOnSelect(customerId)` and close modal

**Tap vehicle row:**

- Call `_pendingOnSelect(vehicle.customerId, vehicle.id)` and close modal

**"New Customer" button:**

- Navigate to `CustomerForm` (modal stack)
- On return, the newly created customer is automatically selected (use focus effect or pass a callback)

**Walk-in quick flow:**

1. User taps **"Walk-in"** button
2. Inline nickname text input appears
3. On confirm:
   - Check for existing walk-in with matching nickname (case-insensitive)
   - If found:
     ```typescript
     Alert.alert('Existing Walk-in', 'Link to existing record?', [
       { text: 'Yes', onPress: () => _pendingOnSelect(existingCustomer.id) },
       { text: 'No, New', onPress: () => createAndSelect(nickname) },
     ]);
     ```
   - If not found: `createCustomer({ type: 'WALKIN', name: nickname })` then call `_pendingOnSelect`

**Layout:**

```
┌─────────────────────────────────────┐
│  [Search bar]                       │
│  [Walk-in]  [New Customer]          │
├─────────────────────────────────────┤
│  Customer: John Doe  [Named] 09xx   │
│    ↳ ABC 1234 — Toyota Vios         │  ← sub-list when expanded
│  Vehicle:  XYZ 5678 — Honda Civic   │
│  ...                                │
└─────────────────────────────────────┘
```

---

## Acceptance Criteria

- [ ] Search bar filters by name, phone, and plate number simultaneously
- [ ] Customer rows show name/nickname, type badge, phone
- [ ] Vehicle rows show plate number, make/model, linked customer name
- [ ] Tapping a customer with vehicles shows a vehicle sub-list (optional selection)
- [ ] Tapping a customer with no vehicles calls `onSelect(customerId)` immediately
- [ ] Tapping a vehicle row calls `onSelect(customerId, vehicleId)`
- [ ] "Walk-in" button shows inline nickname input; handles duplicate detection with alert
- [ ] "New Customer" navigates to `CustomerForm` and auto-selects the new customer on return
- [ ] `setCustomerSearchCallback` export is used by callers before navigating to the modal
- [ ] Modal is registered as a modal stack screen in the navigator
- [ ] No TypeScript errors
