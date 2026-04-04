# AMSPOS-55: `src/screens/inventory/ServiceFormScreen.tsx`

**Sprint**: Sprint 9 — Product/Service Forms, Customer List & Barcode Scanner
**Effort**: 0.5 day
**Dependencies**: AMSPOS-34 (serviceItemService), AMSPOS-41 (inventoryStore)
**Phase**: Inventory

---

## Description

Create or edit a service item. Minimal two-field form. Gated by `MANAGE_INVENTORY`.

---

## Instructions

### 1. `src/screens/inventory/ServiceFormScreen.tsx`

**Permission guard:**

```typescript
usePermissionGuard('MANAGE_INVENTORY');
```

**Route params:**

```typescript
type Params = { serviceId?: string };
// serviceId present → edit mode (pre-populate form)
// serviceId absent  → create mode (blank form)
```

**Form fields:**

| Field | Type | Rules |
|-------|------|-------|
| Name | Text | Required |
| Base Price | Numeric | Required |

**Deactivate button** (edit mode only):

```typescript
Alert.alert(
  'Deactivate Service',
  `Deactivate "${service.name}"? It will no longer appear in the catalog.`,
  [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Deactivate', style: 'destructive', onPress: () => deactivateServiceItem(serviceId) },
  ]
);
```

**Submit:**

```typescript
// Create: createServiceItem({ name, basePrice })
// Edit:   updateServiceItem(serviceId, { name, basePrice })
// Validation on submit — inline errors via AppInput.error
// No optimistic UI — wait for service call before navigating back
```

**Layout:** Wrap in `ScreenWrapper`.

---

## Acceptance Criteria

- [ ] Screen is blocked for users without `MANAGE_INVENTORY`
- [ ] Create mode: blank form; submitting valid data calls `createServiceItem`
- [ ] Edit mode: form pre-filled; submitting calls `updateServiceItem`
- [ ] Deactivate button visible only in edit mode; shows confirmation before calling `deactivateServiceItem`
- [ ] Validation errors shown inline below each field
- [ ] Screen is wrapped in `ScreenWrapper`
- [ ] No TypeScript errors
