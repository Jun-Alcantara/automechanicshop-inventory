# AMSPOS-66: `src/screens/transactions/TransactionDetailScreen.tsx`

**Sprint**: Sprint 12 — TransactionDetailScreen (Complex)
**Effort**: 3.5 days
**Dependencies**: AMSPOS-44 (transactionDraftStore), AMSPOS-72 (BarcodeScanner), AMSPOS-73 (DiscountPickerModal), AMSPOS-74 (AddOnPickerModal), AMSPOS-77 (negativeStockWarning), AMSPOS-76 (unknownBarcodeAlert), AMSPOS-88 (EmptyState)
**Phase**: Transactions

---

## Description

The active transaction workspace — the most complex screen in the app. Allows cashiers to search for and add products/services, edit quantities, apply discounts and add-ons, and proceed to payment.

---

## Instructions

### 1. Route param & draft lifecycle

```typescript
// TransactionStackParamList:
TransactionDetail: { transactionId: string };
```

```typescript
const { transactionId } = route.params;
const { openDraft, clearDraft } = useTransactionDraftStore();

useEffect(() => {
  openDraft(transactionId);
  return () => clearDraft();
}, [transactionId]);
```

### 2. Layout overview

Wrap the entire screen in `ScreenWrapper`. The screen has four main sections stacked vertically:

1. **Header** — customer/vehicle info
2. **Item search bar** — text input + barcode button
3. **Line items list** — `FlatList` of `LineItemRow`
4. **Totals + action bar** — fixed at bottom

---

### 3. Section 1: Header

Read customer and vehicle from the draft:

```typescript
const { draft } = useTransactionDraftStore();
// draft.customer_name, draft.vehicle_plate, draft.walk_in_name
```

Display logic:
- If `draft.customer_name`: show customer name + vehicle plate
- Else if `draft.walk_in_name`: show `"Walk-in: {walk_in_name}"`
- Else: show `"Walk-in"`

---

### 4. Section 2: Item search bar

**State:**

```typescript
const [searchQuery, setSearchQuery] = useState('');
const [searchResults, setSearchResults] = useState<(Product | ServiceItem)[]>([]);
const [showResults, setShowResults] = useState(false);
```

**Text search:**

```typescript
const { products, serviceItems } = useInventoryStore();

useEffect(() => {
  if (searchQuery.trim().length === 0) {
    setSearchResults([]);
    setShowResults(false);
    return;
  }
  const q = searchQuery.toLowerCase();
  const matched = [
    ...products.filter(p => p.name.toLowerCase().includes(q) || p.barcode?.includes(q)),
    ...serviceItems.filter(s => s.name.toLowerCase().includes(q)),
  ];
  setSearchResults(matched);
  setShowResults(true);
}, [searchQuery, products, serviceItems]);
```

**Barcode scan button:**

```typescript
const handleBarcodeScan = () => {
  setBarcodeCallback((scannedCode: string) => {
    const found = products.find(p => p.barcode === scannedCode);
    if (!found) {
      showUnknownBarcodeAlert(scannedCode, navigation);
      return;
    }
    handleAddItem(found);
  });
  navigation.navigate('BarcodeScanner');
};
```

**Search result item tap:**

```typescript
const handleAddItem = async (item: Product | ServiceItem) => {
  if ('stockAvailable' in item && item.stockAvailable === 0) {
    const confirmed = await showNegativeStockWarning();
    if (!confirmed) return;
  }
  useTransactionDraftStore.getState().addLineItem(item);
  setSearchQuery('');
  setShowResults(false);
};
```

**Permission guard:** Adding items requires `CREATE_TRANSACTIONS`. Check with `useHasPermission('CREATE_TRANSACTIONS')` — hide the search bar entirely if the user lacks this permission.

**Search results dropdown:** Render as an absolutely-positioned `FlatList` below the search bar. Dismiss when an item is tapped or when the input loses focus.

---

### 5. Section 3: Line items FlatList

```typescript
const { lineItems } = useTransactionDraftStore();
```

Each item renders a `LineItemRow` with the following interactive controls:

#### 5a. Quantity editor

An inline number input or +/- stepper:

```typescript
const handleQtyChange = (lineItemId: string, newQty: number) => {
  if (newQty <= 0) {
    // show confirmation then remove
    handleRemoveItem(lineItemId);
  } else {
    useTransactionDraftStore.getState().updateLineItemQty(lineItemId, newQty);
  }
};
```

#### 5b. Discount button

Requires `APPLY_DISCOUNTS` permission. Hide button if user lacks permission.

```typescript
const handleDiscount = (lineItem: LineItem) => {
  setDiscountCallback((payload) => {
    useTransactionDraftStore.getState().applyDiscount(lineItem.id, payload);
  });
  navigation.navigate('DiscountPicker', {
    currentDiscountType: lineItem.discountType,
    currentDiscountValue: lineItem.discountValue,
  });
};
```

#### 5c. Add-On button

```typescript
const handleAddOn = (lineItem: LineItem) => {
  setAddOnCallback((selectedAddOns) => {
    useTransactionDraftStore.getState().applyAddOns(lineItem.id, selectedAddOns);
  });
  navigation.navigate('AddOnPicker', {
    currentAddOnIds: lineItem.addOnIds ?? [],
  });
};
```

#### 5d. Remove button

Requires `CANCEL_TRANSACTIONS` permission. Hide button if user lacks permission.

```typescript
const handleRemoveItem = (lineItemId: string) => {
  Alert.alert(
    'Remove Item',
    'Remove this item from the transaction?',
    [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => useTransactionDraftStore.getState().removeLineItem(lineItemId),
      },
    ]
  );
};
```

**Empty state:** When `lineItems.length === 0`, show:

```typescript
<EmptyState
  title="No Items Added"
  subtitle="No items added yet. Search for products or services above."
/>
```

---

### 6. Section 4: Totals + action bar

```typescript
const totals = calculateTransactionTotals(lineItems);
```

Display:
- Subtotal: `formatCurrency(totals.subtotal)`
- VAT (`12%`): `formatCurrency(totals.vat)`
- **Total**: `formatCurrency(totals.total)` (bold)

**Action buttons (fixed at bottom):**

```typescript
const canCancel = useHasPermission('CANCEL_TRANSACTIONS');

{canCancel && (
  <AppButton
    label="Cancel Transaction"
    variant="danger"
    onPress={handleCancelTransaction}
  />
)}

<AppButton
  label="Proceed to Payment"
  onPress={() => navigation.navigate('Payment', { transactionId })}
  disabled={lineItems.length === 0}
/>
```

**Cancel transaction handler:**

```typescript
const handleCancelTransaction = () => {
  Alert.alert(
    'Cancel Transaction',
    'Are you sure you want to cancel this transaction? This cannot be undone.',
    [
      { text: 'No', style: 'cancel' },
      {
        text: 'Yes, Cancel',
        style: 'destructive',
        onPress: async () => {
          await transactionService.cancel(transactionId);
          navigation.goBack();
        },
      },
    ]
  );
};
```

---

## Acceptance Criteria

- [ ] Draft is opened on mount (`openDraft`) and cleared on unmount (`clearDraft`)
- [ ] Header displays customer name + vehicle plate, or walk-in label
- [ ] Search bar filters products and services by name and barcode
- [ ] Search bar is hidden when user lacks `CREATE_TRANSACTIONS` permission
- [ ] Barcode scan button triggers `setBarcodeCallback` and navigates to `BarcodeScanner`
- [ ] Unknown barcode shows `UnknownBarcodeAlert`
- [ ] Product with `stockAvailable === 0` shows `NegativeStockWarning` before adding
- [ ] Line items list renders `LineItemRow` for each draft item
- [ ] Quantity edit calls `updateLineItemQty`; qty ≤ 0 triggers remove confirmation
- [ ] Discount button (hidden without `APPLY_DISCOUNTS`) opens `DiscountPickerModal`
- [ ] Add-On button opens `AddOnPickerModal`
- [ ] Remove button (hidden without `CANCEL_TRANSACTIONS`) shows confirmation alert
- [ ] Empty state shown when no line items
- [ ] Totals calculated via `calculateTransactionTotals` and formatted with `formatCurrency`
- [ ] "Cancel Transaction" only visible with `CANCEL_TRANSACTIONS` permission
- [ ] "Proceed to Payment" disabled when no line items
- [ ] Wrapped in `ScreenWrapper`
- [ ] No TypeScript errors

## Definition of Done

- All acceptance criteria met
- Full add / remove / discount / add-on flow tested end-to-end
- Code committed to `main`
