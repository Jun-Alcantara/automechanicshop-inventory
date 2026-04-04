# AMSPOS-89: Loading Spinners

**Sprint**: Sprint 13 — Payment & Post-Transaction Flows
**Effort**: 0.5 days
**Dependencies**: AMSPOS-67, AMSPOS-70, AMSPOS-71, AMSPOS-66 (screens that need overlays)
**Phase**: Transactions

---

## Description

Add `LoadingOverlay` to all screens in the transactions flow that perform async operations. The `LoadingOverlay` component was built in Sprint 0 — this task is only about wiring it into the screens.

---

## Instructions

### Component reference

```typescript
import { LoadingOverlay } from 'src/components/feedback/LoadingOverlay';

// Usage:
<LoadingOverlay visible={loading} />
```

### Pattern for each screen

```typescript
const [loading, setLoading] = useState(false);

const handleAsyncAction = async () => {
  setLoading(true);
  try {
    await someAsyncCall();
  } finally {
    setLoading(false); // always clears, even on error
  }
};

return (
  <>
    {/* screen content */}
    <LoadingOverlay visible={loading} />
  </>
);
```

The `finally` block ensures the overlay is dismissed even if the async call throws.

---

## Screens to update

### 1. `PaymentScreen` (AMSPOS-67)

- Trigger: `finalizeTransaction()`

### 2. `VoidTransactionScreen` (AMSPOS-70)

- Trigger: `voidTransaction()`

### 3. `ReturnTransactionScreen` (AMSPOS-71)

- Trigger: `processReturn()`

### 4. `TransactionDetailScreen` (AMSPOS-66)

- Trigger: `addLineItem()` — show overlay while the item is being written to WatermelonDB and stock reserved
- Trigger: `removeLineItem()` — show overlay while the line item is removed and stock released

For `TransactionDetailScreen`, the overlay should cover the entire screen (including the FlatList) to prevent the user from tapping other items while a write is in progress.

---

## Acceptance Criteria

- [ ] `LoadingOverlay` shown during `finalizeTransaction` in `PaymentScreen`
- [ ] `LoadingOverlay` shown during `voidTransaction` in `VoidTransactionScreen`
- [ ] `LoadingOverlay` shown during `processReturn` in `ReturnTransactionScreen`
- [ ] `LoadingOverlay` shown during `addLineItem` in `TransactionDetailScreen`
- [ ] `LoadingOverlay` shown during `removeLineItem` in `TransactionDetailScreen`
- [ ] `loading` state always resets to `false` in a `finally` block
- [ ] No TypeScript errors
