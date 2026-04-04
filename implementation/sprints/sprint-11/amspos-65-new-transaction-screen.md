# AMSPOS-65: `src/screens/transactions/NewTransactionScreen.tsx`

**Sprint**: Sprint 11 — Transaction Core Screens & Modals
**Effort**: 1.5 days
**Dependencies**: AMSPOS-42 (transactionService.createTransaction), AMSPOS-45 (useAuthStore for actingUser), AMSPOS-75 (CustomerSearchModal + setCustomerSearchCallback), AMSPOS-64 (TransactionListScreen done first)
**Phase**: Transactions

---

## Description

Initializes a new IN_PROGRESS transaction. The user must pick a customer (named or walk-in) before proceeding. Vehicle selection is optional. On submit, calls `createTransaction` and navigates to `TransactionDetail`.

Screen is guarded by `CREATE_TRANSACTIONS` permission via `usePermissionGuard`.

---

## Instructions

### 1. Permission guard

```typescript
import { usePermissionGuard } from 'src/hooks/usePermissionGuard';
import { Permission } from 'src/constants/permissions';

usePermissionGuard(Permission.CREATE_TRANSACTIONS); // redirects away if no permission
```

### 2. State

```typescript
const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
const [selectedCustomerName, setSelectedCustomerName] = useState<string | null>(null);
const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
const [walkInNickname, setWalkInNickname] = useState('');
const [showWalkInInput, setShowWalkInInput] = useState(false);
const [loading, setLoading] = useState(false);
```

### 3. Customer selection — named customer

```typescript
import { setCustomerSearchCallback } from 'src/screens/modals/CustomerSearchModal';

const handleSearchCustomer = () => {
  setCustomerSearchCallback((customerId, vehicleId) => {
    setSelectedCustomerId(customerId);
    // Fetch customer name from customerService or store for display
    if (vehicleId) setSelectedVehicleId(vehicleId);
  });
  navigation.navigate('CustomerSearch');
};
```

UI:
- "Search Customer" `AppButton` → calls `handleSearchCustomer`
- If `selectedCustomerName` is set: show name in a row with a "Change" button that re-opens the modal
- Vehicle row appears below customer (optional): show selected vehicle plate or a "Select Vehicle" prompt (only after customer selected)

### 4. Walk-in customer shortcut

```typescript
const handleWalkIn = async () => {
  // Check for existing walk-in with this nickname via customerService
  // If found, link it; if not, create a new walk-in customer
  const customer = await customerService.findOrCreateWalkIn(walkInNickname.trim());
  setSelectedCustomerId(customer.id);
  setSelectedCustomerName(customer.name);
  setShowWalkInInput(false);
};
```

UI:
- "Walk-in Customer" button toggles `showWalkInInput`
- When shown: `AppTextInput` for nickname + "Confirm" button → calls `handleWalkIn`

### 5. Start Transaction

```typescript
import { transactionService } from 'src/services/transactionService';
import { useAuthStore } from 'src/store/useAuthStore';

const actingUser = useAuthStore((s) => s.user);

const handleStart = async () => {
  if (!selectedCustomerId) return; // button should be disabled anyway
  setLoading(true);
  try {
    const transaction = await transactionService.createTransaction({
      customerId: selectedCustomerId,
      vehicleId: selectedVehicleId ?? undefined,
      cashierId: actingUser!.id,
    });
    navigation.replace('TransactionDetail', { transactionId: transaction.id });
  } finally {
    setLoading(false);
  }
};
```

"Start Transaction" `AppButton`:
- Disabled when `!selectedCustomerId || loading`
- Shows loading indicator when `loading`

### 6. Wrap in `ScreenWrapper`

```typescript
import { ScreenWrapper } from 'src/components/layout/ScreenWrapper';

return (
  <ScreenWrapper>
    {/* customer section */}
    {/* vehicle section */}
    {/* start button */}
  </ScreenWrapper>
);
```

---

## Acceptance Criteria

- [ ] Screen is guarded by `CREATE_TRANSACTIONS` via `usePermissionGuard`
- [ ] "Search Customer" opens `CustomerSearchModal` using module-level callback pattern
- [ ] Selected customer name displayed with a "Change" button
- [ ] Walk-in shortcut: nickname input → `findOrCreateWalkIn` → sets customer
- [ ] Vehicle selection shown after customer is selected (optional, user can skip)
- [ ] "Start Transaction" disabled until a customer is selected
- [ ] Calls `transactionService.createTransaction({ customerId, vehicleId?, cashierId })`
- [ ] Navigates to `TransactionDetail` with the new `transactionId` after creation
- [ ] Wrapped in `ScreenWrapper`
- [ ] No TypeScript errors

## Definition of Done

- Acceptance criteria met
- Full new transaction flow tested end-to-end (search customer → optional vehicle → start → detail)
- Code committed to `main`
