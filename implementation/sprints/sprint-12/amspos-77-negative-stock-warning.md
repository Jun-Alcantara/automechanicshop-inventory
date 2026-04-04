# AMSPOS-77: `src/screens/transactions/utils/negativeStockWarning.ts`

**Sprint**: Sprint 12 — TransactionDetailScreen (Complex)
**Effort**: 0.5 day
**Dependencies**: none
**Phase**: Transactions

---

## Description

A utility function (not a component) that shows a native alert when a user attempts to add a product with `stockAvailable === 0`. Returns a `Promise<boolean>` so the caller can `await` the user's choice before proceeding.

---

## Instructions

### 1. `src/screens/transactions/utils/negativeStockWarning.ts`

```typescript
import { Alert } from 'react-native';

export const showNegativeStockWarning = (): Promise<boolean> =>
  new Promise((resolve) => {
    Alert.alert(
      'Stock is 0',
      'This product is out of stock. Continue adding anyway?',
      [
        { text: 'Cancel', onPress: () => resolve(false), style: 'cancel' },
        { text: 'Continue', onPress: () => resolve(true) },
      ]
    );
  });
```

### 2. Usage pattern in `TransactionDetailScreen`

When user taps a product from search results:

```typescript
const handleAddItem = async (product: Product) => {
  if (product.stockAvailable === 0) {
    const confirmed = await showNegativeStockWarning();
    if (!confirmed) return;
  }
  useTransactionDraftStore.getState().addLineItem(product);
};
```

---

## Acceptance Criteria

- [ ] `showNegativeStockWarning` is a standalone utility function (not a React component)
- [ ] Returns `Promise<boolean>` — `true` if user taps "Continue", `false` if "Cancel"
- [ ] Alert title: `'Stock is 0'`
- [ ] Alert message: `'This product is out of stock. Continue adding anyway?'`
- [ ] "Cancel" button has `style: 'cancel'`
- [ ] No TypeScript errors

## Definition of Done

- Acceptance criteria met
- Code committed to `main`
