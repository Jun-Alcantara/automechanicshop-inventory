# AMSPOS-74: `src/screens/modals/AddOnPickerModal.tsx`

**Sprint**: Sprint 11 — Transaction Core Screens & Modals
**Effort**: 1 day
**Dependencies**: AMSPOS-72 (BarcodeScanner — same callback pattern), AMSPOS-44 (line item types), AMSPOS-45 (useCatalogStore)
**Phase**: Transactions

---

## Description

Modal for applying an add-on to a line item. Shows catalog add-ons (from store) and allows creating a custom on-the-fly add-on. Uses the same module-level callback pattern as `BarcodeScannerModal`.

---

## Instructions

### 1. Callback pattern

```typescript
type AddOnPayload = {
  name: string;
  amount: number;
  isOnTheFly: boolean;
  addOnId?: string; // only set for catalog add-ons
};

let _pendingOnApply: ((payload: AddOnPayload) => void) | null = null;

export const setAddOnCallback = (cb: (payload: AddOnPayload) => void) => {
  _pendingOnApply = cb;
};
```

Callers (e.g. `TransactionDetail` line item row) must:
1. Call `setAddOnCallback((payload) => { /* apply to line item */ })`
2. Navigate to `AddOnPicker` modal screen

### 2. `src/screens/modals/AddOnPickerModal.tsx`

**Catalog add-ons:**

```typescript
import { useCatalogStore } from 'src/store/useCatalogStore';

const addOns = useCatalogStore((s) => s.addOns).filter((a) => a.isActive);
```

**Layout:**

#### Section 1: "From Catalog"

FlatList of active catalog add-ons. Each row:
- Add-on name (left)
- Amount in ₱ (center/right)
- "Add" `AppButton` (right)

On "Add":
```typescript
const handleCatalogAdd = (addOn: CatalogAddOn) => {
  _pendingOnApply?.({ name: addOn.name, amount: addOn.amount, isOnTheFly: false, addOnId: addOn.id });
  _pendingOnApply = null;
  navigation.goBack();
};
```

If catalog is empty, show "No add-ons in catalog" placeholder text.

#### Section 2: "Custom Add-On"

Inline form below the catalog list:

```typescript
const [customName, setCustomName] = useState('');
const [customAmount, setCustomAmount] = useState('');
```

- `AppTextInput` — "Name" (required)
- `AppTextInput` — "Amount (₱)" (required, `keyboardType="numeric"`)
- "Add Custom" `AppButton`

On "Add Custom":
```typescript
const handleCustomAdd = () => {
  const amount = parseFloat(customAmount);
  if (!customName.trim() || isNaN(amount) || amount <= 0) return;
  _pendingOnApply?.({ name: customName.trim(), amount, isOnTheFly: true });
  _pendingOnApply = null;
  navigation.goBack();
};
```

Validation (inline error):
- Name: required, non-empty
- Amount: required, numeric, > 0

**Wrap in `ScreenWrapper`.**

---

## Acceptance Criteria

- [ ] Uses module-level `setAddOnCallback` / `_pendingOnApply` pattern
- [ ] Section 1 lists active add-ons from `useCatalogStore().addOns`
- [ ] Tapping "Add" on a catalog add-on fires callback with `{ name, amount, isOnTheFly: false, addOnId }` then closes
- [ ] Empty catalog shows placeholder text
- [ ] Section 2 custom form: name + amount inputs
- [ ] "Add Custom" validates (non-empty name, numeric amount > 0) and fires callback with `{ isOnTheFly: true }` then closes
- [ ] Inline validation errors shown on invalid submit attempt
- [ ] Wrapped in `ScreenWrapper`
- [ ] No TypeScript errors

## Definition of Done

- Acceptance criteria met
- Code committed to `main`
