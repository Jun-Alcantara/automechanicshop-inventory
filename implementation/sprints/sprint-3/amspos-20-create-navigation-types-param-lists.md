# AMSPOS-20: Create Navigation Types & Param Lists

**Sprint**: Sprint 3 — Navigation Setup
**Effort**: 1 day
**Dependencies**: AMSPOS-19
**Phase**: Foundation

---

## Description

Create `src/navigation/types.ts` with all typed param lists for every navigator and screen in the app. This is the single source of truth for navigation types. All screen components and `useNavigation` calls reference these types.

---

## Instructions

### 1. `src/navigation/types.ts`

```typescript
import type { StackScreenProps } from '@react-navigation/stack';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { CompositeScreenProps, NavigatorScreenParams } from '@react-navigation/native';

// ─── Root Stack ───────────────────────────────────────────────────────────────

export type RootStackParamList = {
  InitSetup: undefined;
  PinLock: undefined;
  MainTabs: NavigatorScreenParams<MainTabParamList>;
};

// ─── Main Tab Navigator ───────────────────────────────────────────────────────

export type MainTabParamList = {
  Dashboard: undefined;
  Transactions: NavigatorScreenParams<TransactionsStackParamList>;
  Inventory: NavigatorScreenParams<InventoryStackParamList>;
  Admin: NavigatorScreenParams<AdminStackParamList>;
};

// ─── Transactions Stack ───────────────────────────────────────────────────────

export type TransactionsStackParamList = {
  TransactionList: undefined;
  NewTransaction: undefined;
  TransactionDetail: { transactionId: string };
  Payment: { transactionId: string };
  Receipt: { transactionId: string };
  TransactionHistoryDetail: { transactionId: string };
  VoidTransaction: { transactionId: string };
  ReturnTransaction: { transactionId: string };
};

// ─── Inventory Stack ──────────────────────────────────────────────────────────

export type InventoryStackParamList = {
  InventoryList: undefined;
  ProductForm: { productId?: string };    // undefined = create; string = edit
  ServiceForm: { serviceId?: string };
  CategoryList: undefined;
  SupplierList: undefined;
  AddOnCatalog: undefined;
};

// ─── Admin Stack ──────────────────────────────────────────────────────────────

export type AdminStackParamList = {
  AdminMenu: undefined;
  Reports: undefined;
  AuditLog: undefined;
  CustomerList: undefined;
  CustomerDetail: { customerId: string };
  CustomerForm: { customerId?: string };
  VehicleDetail: { vehicleId: string };
  VehicleForm: { vehicleId?: string; customerId: string };
  UserList: undefined;
  UserForm: { userId?: string };
  Settings: undefined;
  ChangeOwnPin: undefined;
};

// ─── Modal Screens (presented over any stack) ────────────────────────────────

export type ModalParamList = {
  BarcodeScanner: {
    onScan: (barcode: string) => void;
  };
  DiscountPicker: {
    lineItemId: string;
    currentDiscountType: string;
    currentDiscountValue: number;
    onApply: (type: 'FIXED' | 'PERCENTAGE', value: number) => void;
  };
  AddOnPicker: {
    lineItemId: string;
    onApply: (name: string, amount: number, isOnTheFly: boolean, addOnId?: string) => void;
  };
  CustomerSearch: {
    onSelect: (customerId: string, vehicleId?: string) => void;
  };
};

// ─── Screen prop helpers ──────────────────────────────────────────────────────

export type RootStackScreenProps<T extends keyof RootStackParamList> =
  StackScreenProps<RootStackParamList, T>;

export type TransactionsStackScreenProps<T extends keyof TransactionsStackParamList> =
  CompositeScreenProps<
    StackScreenProps<TransactionsStackParamList, T>,
    BottomTabScreenProps<MainTabParamList>
  >;

export type InventoryStackScreenProps<T extends keyof InventoryStackParamList> =
  CompositeScreenProps<
    StackScreenProps<InventoryStackParamList, T>,
    BottomTabScreenProps<MainTabParamList>
  >;

export type AdminStackScreenProps<T extends keyof AdminStackParamList> =
  CompositeScreenProps<
    StackScreenProps<AdminStackParamList, T>,
    BottomTabScreenProps<MainTabParamList>
  >;
```

---

## Acceptance Criteria

- [ ] `RootStackParamList`, `MainTabParamList`, `TransactionsStackParamList`, `InventoryStackParamList`, `AdminStackParamList`, `ModalParamList` are all defined
- [ ] All screen param shapes are typed (routes with IDs use `{ id: string }`, routes without params use `undefined`)
- [ ] `ProductForm` and similar create/edit screens use optional ID param (`{ productId?: string }`)
- [ ] Screen prop helper types exported for each stack
- [ ] No TypeScript errors

## Definition of Done

- All acceptance criteria are met
- Types importable from `@navigation/types`
- Code committed to `main`
