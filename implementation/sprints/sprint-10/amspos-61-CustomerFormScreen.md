# AMSPOS-61: `src/screens/admin/CustomerFormScreen.tsx`

**Sprint**: Sprint 10 — Customer & Vehicle Screens
**Effort**: 1.5 days
**Dependencies**: AMSPOS-36 (customerService)
**Phase**: Customers

---

## Description

Create or edit a customer. Supports Named and Walk-in types. Walk-in creation includes a duplicate nickname check. Gated by `CREATE_TRANSACTIONS`.

---

## Instructions

### 1. `src/screens/admin/CustomerFormScreen.tsx`

**Route params:**

```typescript
type Params = { customerId?: string };
// customerId present → edit mode
// customerId absent  → create mode
```

**Form fields:**

| Field | Type | Rules |
|-------|------|-------|
| Type toggle | `Named` \| `Walk-in` | Shown in **create mode only** — type cannot change on edit |
| Name / Nickname | Text | Required |
| Phone | Numeric keyboard | Optional |
| Email | Text (email keyboard) | Optional |

**Walk-in duplicate check (create mode only):**

When type is `WALKIN` and the user submits:

1. Check if an existing walk-in has the same nickname (case-insensitive)
2. If duplicate found:

```typescript
Alert.alert(
  'Duplicate Nickname',
  'A walk-in with this nickname already exists. Link to existing record?',
  [
    {
      text: 'Yes, Link',
      onPress: () => {
        // use the existing customer — navigate back with existingCustomerId
      },
    },
    {
      text: 'No, Create New',
      onPress: () => createCustomer(fields), // proceed with new record
    },
  ]
);
```

**Submit:**

```typescript
// Create: createCustomer({ type, name, phone?, email? })
// Edit:   updateCustomer(customerId, { name, phone?, email? })
// Validation on submit — inline errors via AppInput.error
// No optimistic UI
```

**Layout:** Wrap in `ScreenWrapper`.

---

## Acceptance Criteria

- [ ] Type toggle (`Named` / `Walk-in`) is shown only in create mode
- [ ] Name/Nickname field is required; phone and email are optional
- [ ] Walk-in create: duplicate nickname triggers a "Link to existing?" alert
- [ ] Choosing "Yes, Link" uses the existing customer and navigates back
- [ ] Choosing "No, Create New" proceeds to create a new walk-in record
- [ ] Edit mode: type field is hidden; existing name/phone/email are pre-filled
- [ ] Submitting valid data calls `createCustomer` or `updateCustomer`
- [ ] Validation errors shown inline
- [ ] Screen is wrapped in `ScreenWrapper`
- [ ] No TypeScript errors
