# Coding Standards & Conventions — AutoShop POS

> This is the authoritative coding reference for sprint task writers and developers.
> It is opinionated, project-specific, and supersedes general React Native conventions wherever they conflict.
> SDK: Expo 54 (CNG / prebuild). Target: Android only.

---

## Table of Contents

1. [TypeScript](#1-typescript)
2. [File and Folder Structure](#2-file-and-folder-structure)
3. [WatermelonDB Patterns](#3-watermelondb-patterns)
4. [Zustand Store Patterns](#4-zustand-store-patterns)
5. [React Navigation](#5-react-navigation)
6. [Component Patterns](#6-component-patterns)
7. [Permissions Pattern](#7-permissions-pattern)
8. [Error Handling](#8-error-handling)
9. [Styling](#9-styling)
10. [Testing](#10-testing)
11. [Imports](#11-imports)
12. [Do's and Don'ts](#12-dos-and-donts)

---

## 1. TypeScript

### Compiler configuration

`tsconfig.json` must include:

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true
  }
}
```

### No `any`

`any` is forbidden. Use `unknown` when the type is genuinely unknown and narrow it before use.

```typescript
// WRONG
const parse = (raw: any) => raw.name;

// CORRECT
const parse = (raw: unknown): string => {
  if (typeof raw === 'object' && raw !== null && 'name' in raw) {
    return String((raw as Record<string, unknown>).name);
  }
  throw new Error('Invalid raw value');
};
```

If a third-party library emits `any` (e.g., WatermelonDB raw record callbacks), assign it to `unknown` immediately at the boundary and narrow before proceeding.

### `interface` vs `type`

- **`interface`** for all domain object shapes: `User`, `Product`, `Transaction`, `LineItem`, etc.
- **`type`** for unions, intersections, mapped types, and utility types.

```typescript
// domain shape → interface
interface Product {
  id: string;
  name: string;
  sellingPrice: number;
  isActive: boolean;
}

// union → type
type TransactionStatus = 'IN_PROGRESS' | 'FINALIZED' | 'VOIDED' | 'CANCELLED' | 'RETURNED';

// utility → type
type ProductPatch = Partial<Pick<Product, 'name' | 'sellingPrice' | 'isActive'>>;
```

### Where types live

All domain interfaces live in `src/types/index.ts`. If the file exceeds ~400 lines, split into `user.types.ts`, `transaction.types.ts`, etc. and re-export from `index.ts`:

```typescript
// src/types/index.ts
export type { User } from './user.types';
export type { Transaction, LineItem, Payment } from './transaction.types';
```

Navigation param types live exclusively in `src/navigation/types.ts` (see Section 5).

Store interface types are defined inline in their store files (not exported to `types/index.ts`) because they describe store shape, not domain data.

### Enums

Use `const` objects + `typeof` union instead of TypeScript `enum` for string values. This avoids the runtime enum object and keeps values tree-shakeable.

```typescript
// src/constants/permissions.ts
export const Permission = {
  MANAGE_USERS: 'MANAGE_USERS',
  MANAGE_INVENTORY: 'MANAGE_INVENTORY',
  CREATE_TRANSACTIONS: 'CREATE_TRANSACTIONS',
  APPLY_DISCOUNTS: 'APPLY_DISCOUNTS',
  VOID_TRANSACTIONS: 'VOID_TRANSACTIONS',
  CANCEL_TRANSACTIONS: 'CANCEL_TRANSACTIONS',
  VIEW_REPORTS: 'VIEW_REPORTS',
  MANAGE_SETTINGS: 'MANAGE_SETTINGS',
} as const;

export type Permission = typeof Permission[keyof typeof Permission];
```

```typescript
// src/constants/transactionStatus.ts
export const TransactionStatus = {
  IN_PROGRESS: 'IN_PROGRESS',
  FINALIZED: 'FINALIZED',
  VOIDED: 'VOIDED',
  CANCELLED: 'CANCELLED',
  RETURNED: 'RETURNED',
} as const;

export type TransactionStatus = typeof TransactionStatus[keyof typeof TransactionStatus];
```

### Non-null assertion

Never use `!` (non-null assertion) on values that could genuinely be null at runtime. Use explicit null checks or throw a descriptive error.

```typescript
// WRONG
const name = user!.displayName;

// CORRECT
if (!user) throw new Error('No active user in session');
const name = user.displayName;
```

---

## 2. File and Folder Structure

### Naming conventions

| Artifact | Convention | Example |
|---|---|---|
| Screen component | `PascalCaseScreen.tsx` | `TransactionDetailScreen.tsx` |
| Modal screen | `PascalCaseModal.tsx` | `DiscountPickerModal.tsx` |
| Reusable component | `PascalCase.tsx` | `LineItemRow.tsx` |
| Navigator | `PascalCaseNavigator.tsx` or `PascalCaseStack.tsx` | `TransactionsStack.tsx` |
| Zustand store | `camelCaseStore.ts` | `transactionDraftStore.ts` |
| Database service | `camelCaseService.ts` | `productService.ts` |
| Custom hook | `useCamelCase.ts` | `usePermissionGuard.ts` |
| Utility (pure function) | `camelCase.ts` | `calculateLineItem.ts` |
| Constant / enum file | `camelCase.ts` | `permissions.ts` |
| WatermelonDB model | `PascalCaseModel.ts` | `ProductModel.ts` |
| Type definitions | `index.ts` (or `camelCase.types.ts` if split) | `types/index.ts` |

### Symbol naming conventions

| Symbol | Convention | Example |
|---|---|---|
| React component | `PascalCase` | `LineItemRow` |
| Zustand hook export | `use[Entity]Store` | `useInventoryStore` |
| Custom hook | `use[Description]` | `useHasPermission` |
| Service function | `[verb][Entity]` | `observeProducts`, `updateProduct` |
| Constant value | `SCREAMING_SNAKE_CASE` | `CREATE_TRANSACTIONS` |
| Domain interface | `PascalCase`, no `I` prefix | `Transaction`, `LineItem` |
| Route name | `PascalCase`, no `Screen` suffix | `TransactionDetail`, `Payment` |
| Store internal field | `_camelCase` | `_subscription` |

### Component placement rule

A component belongs in `src/components/[feature]/` if it is only ever rendered from that feature's screens. If it is used across more than one feature, it belongs in `src/components/common/`.

### Screen grouping rule

Screens are grouped by feature under `src/screens/[feature]/`. One file per screen, no index barrel files inside screen folders.

### Utils rule

Files in `src/utils/` must be pure functions with no side effects and no imports from `stores/`, `services/`, or `hooks/`.

---

## 3. WatermelonDB Patterns

### Dependency rule

```
screens / components
       ↓
    stores
       ↓
   services       ← only layer that imports database.ts
       ↓
  database.ts     ← single DB instance + model registration
       ↓
  Model files     ← only files that import from @nozbe/watermelondb directly
```

No screen, component, or store ever imports from `database.ts` or `@nozbe/watermelondb` directly.
Only `src/services/database.ts` and `src/models/*.ts` files may import from `@nozbe/watermelondb`.

### Model class definition

Each WatermelonDB table maps to one model class in `src/models/`. Use decorators exactly as shown. Always extend `Model` from `@nozbe/watermelondb`.

```typescript
// src/models/ProductModel.ts
import { Model } from '@nozbe/watermelondb';
import { text, field, date, readonly } from '@nozbe/watermelondb/decorators';

export class ProductModel extends Model {
  static table = 'products';

  @text('name') name!: string;
  @text('barcode') barcode!: string;
  @field('selling_price') sellingPrice!: number;
  @field('cost_price') costPrice!: number;
  @text('unit_of_measure') unitOfMeasure!: string;
  @field('stock_available') stockAvailable!: number;
  @field('stock_reserved') stockReserved!: number;
  @field('low_stock_threshold') lowStockThreshold!: number;
  @text('category_id') categoryId!: string;
  @text('supplier_id') supplierId!: string;
  @field('is_active') isActive!: boolean;
  @readonly @date('created_at') createdAt!: Date;
  @text('created_by') createdBy!: string;
  @date('updated_at') updatedAt!: Date;
  @text('updated_by') updatedBy!: string;
}
```

**Decorator reference:**

| Decorator | Column type | Exposed as |
|---|---|---|
| `@text('col')` | `string` | `string` |
| `@field('col')` | `number` or `boolean` | `number` or `boolean` |
| `@date('col')` | `number` (unix ms) | `Date` |
| `@json('col', sanitizer)` | `string` (JSON) | deserialized value |
| `@relation('table', 'col')` | `string` (FK) | lazy Model reference |
| `@children('table')` | — | Observable child collection |
| `@readonly` | — | makes field immutable after create |

### `@json` decorator pattern

Use `@json` for fields stored as JSON strings (e.g., `permissions` array on `UserModel`). Always provide a sanitizer that returns a safe default if deserialization fails.

```typescript
import { json } from '@nozbe/watermelondb/decorators';
import type { Permission } from 'src/constants/permissions';

const sanitizePermissions = (raw: unknown): Permission[] => {
  if (Array.isArray(raw)) return raw.filter((v): v is Permission => typeof v === 'string');
  return [];
};

export class UserModel extends Model {
  static table = 'users';

  @text('display_name') displayName!: string;
  @text('pin_hash') pinHash!: string;
  @text('pin_salt') pinSalt!: string;
  @json('permissions', sanitizePermissions) permissions!: Permission[];
  @field('is_main_admin') isMainAdmin!: boolean;
  @field('is_active') isActive!: boolean;
  @readonly @date('created_at') createdAt!: Date;
  @text('created_by') createdBy!: string;
  @date('updated_at') updatedAt!: Date;
  @text('updated_by') updatedBy!: string;
}
```

### `@relation` and `@children` pattern

```typescript
// src/models/LineItemModel.ts
import { relation, children } from '@nozbe/watermelondb/decorators';
import { LineItemAddOnModel } from './LineItemAddOnModel';

export class LineItemModel extends Model {
  static table = 'line_items';
  static associations = {
    transactions: { type: 'belongs_to' as const, key: 'transaction_id' },
    line_item_add_ons: { type: 'has_many' as const, foreignKey: 'line_item_id' },
  };

  @text('transaction_id') transactionId!: string;
  // ... other fields ...

  @relation('transactions', 'transaction_id') transaction!: Relation<TransactionModel>;
  @children('line_item_add_ons') addOns!: Query<LineItemAddOnModel>;
}
```

### Schema definition

Schema lives in `src/services/database.ts`, defined with `appSchema` and `tableSchema`. Schema version is incremented for every additive change. Destructive changes require a migration.

```typescript
import { appSchema, tableSchema } from '@nozbe/watermelondb';

export const schema = appSchema({
  version: 1,
  tables: [
    tableSchema({
      name: 'products',
      columns: [
        { name: 'name', type: 'string' },
        { name: 'barcode', type: 'string', isOptional: true },
        { name: 'selling_price', type: 'number' },
        { name: 'is_active', type: 'boolean' },
        { name: 'created_at', type: 'number' },
        { name: 'created_by', type: 'string' },
        { name: 'updated_at', type: 'number' },
        { name: 'updated_by', type: 'string' },
      ],
    }),
    // ... other tables
  ],
});
```

Column type map: string fields → `type: 'string'`, number/boolean fields → `type: 'number'` or `type: 'boolean'`, date fields (decorated with `@date`) → `type: 'number'`. JSON fields → `type: 'string'`.

### Observable query pattern

Observable functions live in service files and return a WatermelonDB `Observable`. They are never called directly from components — they are called from Zustand store `subscribe` actions.

```typescript
// src/services/productService.ts
import { database } from './database';
import { Q } from '@nozbe/watermelondb';
import type { Observable } from 'rxjs';
import type { ProductModel } from 'src/models/ProductModel';

export const observeActiveProducts = (): Observable<ProductModel[]> =>
  database
    .get<ProductModel>('products')
    .query(Q.where('is_active', true), Q.sortBy('name', Q.asc))
    .observe();
```

### `database.write()` pattern

Every mutation goes inside `database.write()`. Group related writes (primary record + audit log) in the same block to guarantee atomicity.

```typescript
// src/services/productService.ts
import { database } from './database';
import type { ProductModel } from 'src/models/ProductModel';
import type { Product } from 'src/types';
import type { User } from 'src/types';

export const updateProduct = async (
  product: ProductModel,
  patch: Partial<Pick<Product, 'name' | 'sellingPrice' | 'isActive'>>,
  actingUser: User,
): Promise<void> => {
  await database.write(async () => {
    await product.update((p) => {
      if (patch.name !== undefined) p.name = patch.name;
      if (patch.sellingPrice !== undefined) p.sellingPrice = patch.sellingPrice;
      if (patch.isActive !== undefined) p.isActive = patch.isActive;
      p.updatedAt = new Date();
      p.updatedBy = actingUser.id;
    });

    await database.get('audit_logs').create((log) => {
      log.timestamp = new Date();
      log.userId = actingUser.id;
      log.userName = actingUser.displayName;
      log.actionType = 'EDIT_PRODUCT';
      log.entityType = 'PRODUCT';
      log.entityId = product.id;
      log.before = JSON.stringify(extractChangedFields(product._raw, patch));
      log.after = JSON.stringify(patch);
    });
  });
};
```

### Fetch (one-time read) pattern

Use `database.get(...).find(id)` or `.query(...).fetch()` for one-time reads. These are `async` and return a plain value, not an Observable.

```typescript
export const fetchProductById = async (id: string): Promise<ProductModel> => {
  return database.get<ProductModel>('products').find(id);
};

export const fetchActiveProducts = async (): Promise<ProductModel[]> => {
  return database.get<ProductModel>('products').query(Q.where('is_active', true)).fetch();
};
```

### Audit log append-only rule

`audit_logs` is append-only. The `auditService.ts` file exposes only a single `appendAuditLog` function — no update or delete functions. Audit log entries are always written inside the same `database.write()` block as the primary mutation.

---

## 4. Zustand Store Patterns

### Store interface structure

Define a single interface per store file that contains both state fields and action signatures. Export the interface for type-checking in tests; the store itself is the default export via `create`.

```typescript
// src/stores/inventoryStore.ts
import { create } from 'zustand';
import type { Subscription } from 'rxjs';
import { observeActiveProducts, observeActiveServiceItems } from 'src/services/productService';
import type { Product, ServiceItem } from 'src/types';

interface InventoryStore {
  // State
  products: Product[];
  serviceItems: ServiceItem[];
  loading: boolean;
  error: Error | null;
  // Internal — not read by components
  _productSubscription: Subscription | null;
  _serviceSubscription: Subscription | null;
  // Actions
  subscribe: () => void;
  unsubscribe: () => void;
}

export const useInventoryStore = create<InventoryStore>((set, get) => ({
  products: [],
  serviceItems: [],
  loading: true,
  error: null,
  _productSubscription: null,
  _serviceSubscription: null,

  subscribe: () => {
    const productSub = observeActiveProducts().subscribe({
      next: (products) => set({ products, loading: false }),
      error: (error) => set({ error, loading: false }),
    });
    const serviceSub = observeActiveServiceItems().subscribe({
      next: (serviceItems) => set({ serviceItems }),
      error: (error) => set({ error }),
    });
    set({ _productSubscription: productSub, _serviceSubscription: serviceSub });
  },

  unsubscribe: () => {
    get()._productSubscription?.unsubscribe();
    get()._serviceSubscription?.unsubscribe();
    set({ _productSubscription: null, _serviceSubscription: null });
  },
}));
```

### Internal `_subscription` field naming

Subscription references stored in Zustand state must be prefixed with `_`. Components must never read `_` fields. If a store manages multiple subscriptions, name each descriptively: `_productSubscription`, `_serviceSubscription`.

### Subscribe / unsubscribe lifecycle

All stores with observable subscriptions are managed by `AppListeners`, a component that lives inside `RootNavigator`. It watches `sessionStore.status` and calls `subscribe()` / `unsubscribe()` accordingly.

```typescript
// src/components/AppListeners.tsx (structure only)
useEffect(() => {
  if (status === 'ACTIVE') {
    useInventoryStore.getState().subscribe();
    useCatalogStore.getState().subscribe();
    useOpenTransactionsStore.getState().subscribe();
    useSettingsStore.getState().subscribe();
    if (hasPermission(user, Permission.MANAGE_USERS)) {
      useUserStore.getState().subscribe();
    }
  } else {
    useInventoryStore.getState().unsubscribe();
    useCatalogStore.getState().unsubscribe();
    useOpenTransactionsStore.getState().unsubscribe();
    useSettingsStore.getState().unsubscribe();
    useUserStore.getState().unsubscribe();
  }
}, [status]);
```

### Selecting state from stores

Always select the minimum slice needed. Never subscribe to the full store object — this causes re-renders on every state change.

```typescript
// WRONG — re-renders on any store change
const store = useInventoryStore();

// CORRECT — re-renders only when `products` changes
const products = useInventoryStore((s) => s.products);
```

### Store actions that write to the database

Store actions that modify data must call a service function. Stores do not import from `database.ts` directly.

```typescript
// src/stores/transactionDraftStore.ts
addLineItem: async (item) => {
  const draft = get().draft;
  const user = useSessionStore.getState().user;
  if (!draft || !user) return;
  // Delegate to service layer — store never touches database.ts
  await addLineItemToTransaction(draft, item, user);
  // Refresh local draft from DB after write
  const updated = await fetchTransactionById(draft.id);
  set({ draft: mapTransactionModelToDto(updated) });
},
```

---

## 5. React Navigation

### Param list definitions

All param lists live in `src/navigation/types.ts`. Each stack/tab navigator has its own named param list type. Screen names use `PascalCase` without the `Screen` suffix.

```typescript
// src/navigation/types.ts
import type { StackScreenProps } from '@react-navigation/stack';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';

export type RootStackParamList = {
  InitSetup: undefined;
  PinLock: undefined;
  MainTabs: undefined;
};

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

export type InventoryStackParamList = {
  InventoryList: undefined;
  ProductForm: { productId?: string };  // undefined = create, string = edit
  ServiceForm: { serviceId?: string };
  CategoryList: undefined;
  SupplierList: undefined;
  AddOnCatalog: undefined;
};

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

export type MainTabParamList = {
  Dashboard: undefined;
  Transactions: undefined;
  Inventory: undefined;
  Admin: undefined;
};

// Convenience screen prop types
export type TransactionDetailScreenProps =
  StackScreenProps<TransactionsStackParamList, 'TransactionDetail'>;

export type ProductFormScreenProps =
  StackScreenProps<InventoryStackParamList, 'ProductForm'>;
```

### Typing screen props

Every screen that receives route params must type its props using the convenience types from `navigation/types.ts`.

```typescript
// src/screens/transactions/TransactionDetailScreen.tsx
import type { TransactionDetailScreenProps } from 'src/navigation/types';

export const TransactionDetailScreen = ({ route, navigation }: TransactionDetailScreenProps) => {
  const { transactionId } = route.params;
  // ...
};
```

Screens with no params use `undefined` in the param list and do not need to destructure `route`.

### Navigating between screens

Always use the typed `navigation` prop or `useNavigation` with a type argument. Never use string literals for route names without the type guard.

```typescript
// Inside a screen that already has the navigation prop
navigation.navigate('TransactionDetail', { transactionId: tx.id });

// Inside a nested component using the hook
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { TransactionsStackParamList } from 'src/navigation/types';

const navigation = useNavigation<StackNavigationProp<TransactionsStackParamList>>();
navigation.navigate('Payment', { transactionId });
```

### Modal screens

Modal screens (in `src/screens/modals/`) are pushed as stack screens with `presentation: 'modal'` in the navigator options. They are not in the tab navigator hierarchy.

---

## 6. Component Patterns

### Functional components only

No class components. No `React.Component` or `React.PureComponent`. Use function declarations for components, not arrow functions at the module level.

```typescript
// CORRECT
export function LineItemRow({ item, onRemove }: LineItemRowProps) {
  // ...
}

// ALSO ACCEPTABLE (named arrow function assigned to const)
export const LineItemRow = ({ item, onRemove }: LineItemRowProps): React.JSX.Element => {
  // ...
};

// WRONG
export class LineItemRow extends React.Component { ... }
```

### Prop types

Always define props as an `interface` directly above the component. Do not use `React.FC` — it obscures the return type and is no longer recommended.

```typescript
interface LineItemRowProps {
  item: LineItem;
  onRemove: (id: string) => void;
  onQtyChange: (id: string, qty: number) => void;
}

export function LineItemRow({ item, onRemove, onQtyChange }: LineItemRowProps) { ... }
```

### `ScreenWrapper`

Every screen component must wrap its root content in `ScreenWrapper`. This component handles safe area insets, keyboard avoidance, and the standard screen background color. Do not apply `SafeAreaView` or background color styles directly in screens.

```typescript
import { ScreenWrapper } from 'src/components/layout/ScreenWrapper';

export function TransactionDetailScreen({ route }: TransactionDetailScreenProps) {
  return (
    <ScreenWrapper>
      {/* screen content */}
    </ScreenWrapper>
  );
}
```

### `useHasPermission` in components

Use `useHasPermission` to conditionally render UI elements that require a permission.

```typescript
import { useHasPermission } from 'src/hooks/useHasPermission';
import { Permission } from 'src/constants/permissions';

export function TransactionDetailScreen(...) {
  const canApplyDiscount = useHasPermission(Permission.APPLY_DISCOUNTS);
  const canCancelTransaction = useHasPermission(Permission.CANCEL_TRANSACTIONS);

  return (
    <ScreenWrapper>
      {/* ... */}
      {canApplyDiscount && <AppButton label="Apply Discount" onPress={handleDiscount} />}
      {canCancelTransaction && <AppButton label="Cancel Transaction" onPress={handleCancel} />}
    </ScreenWrapper>
  );
}
```

### `usePermissionGuard` in screens

Call `usePermissionGuard` at the top of every screen that requires a permission to access. Return `null` immediately if unauthorized — this prevents child `useEffect`s from executing before the guard fires.

```typescript
import { usePermissionGuard } from 'src/hooks/usePermissionGuard';
import { Permission } from 'src/constants/permissions';

export function ReportsScreen() {
  const isAuthorized = usePermissionGuard(Permission.VIEW_REPORTS);
  if (!isAuthorized) return null;

  // safe to render: user has VIEW_REPORTS
  return <ScreenWrapper>...</ScreenWrapper>;
}
```

### Memoization

Apply `React.memo` on list-item components that receive stable props (e.g., `LineItemRow`, `TransactionCard`, `ProductCard`). Use `useCallback` for handlers passed to memoized children. Use `useMemo` only when a derived value is genuinely expensive — not for simple property access.

---

## 7. Permissions Pattern

Three tools exist. Use the right one for the context.

### `hasPermission` — pure utility function

```typescript
// src/utils/permissions.ts
import type { User } from 'src/types';
import type { Permission } from 'src/constants/permissions';

export const hasPermission = (user: User | null, permission: Permission): boolean => {
  if (!user) return false;
  if (user.isMainAdmin) return true;
  return user.permissions.includes(permission);
};
```

Use inside: service functions (guard before writes), store actions (conditional subscription), `AppListeners`, and `usePermissionGuard`/`useHasPermission` implementations.

Do not call `useSessionStore` inside this function — it is a pure utility. Pass `user` as an argument.

### `useHasPermission` — hook for conditional UI rendering

```typescript
// src/hooks/useHasPermission.ts
import { useSessionStore } from 'src/stores/sessionStore';
import { hasPermission } from 'src/utils/permissions';
import type { Permission } from 'src/constants/permissions';

export const useHasPermission = (permission: Permission): boolean => {
  const user = useSessionStore((s) => s.user);
  return hasPermission(user, permission);
};
```

Use inside: components to show/hide buttons, menu items, or form fields.

### `usePermissionGuard` — hook for screen-level access enforcement

```typescript
// src/hooks/usePermissionGuard.ts
import { useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import { useSessionStore } from 'src/stores/sessionStore';
import { hasPermission } from 'src/utils/permissions';
import type { Permission } from 'src/constants/permissions';

export const usePermissionGuard = (permission: Permission): boolean => {
  const user = useSessionStore((s) => s.user);
  const navigation = useNavigation();
  const isAuthorized = hasPermission(user, permission);

  useEffect(() => {
    if (!isAuthorized) {
      navigation.goBack();
      // trigger toast: "You don't have permission to access this screen."
    }
  }, [isAuthorized, navigation]);

  return isAuthorized;
};
```

Use inside: the top of every screen that is only accessible with a specific permission.

### Decision table

| Scenario | Tool |
|---|---|
| Hide/show a button or UI element | `useHasPermission` |
| Guard an entire screen (redirect if unauthorized) | `usePermissionGuard` |
| Guard a write inside a service function | `hasPermission` (called with `actingUser`) |
| Conditional store subscription in `AppListeners` | `hasPermission` (called with `user` from session) |

---

## 8. Error Handling

### Service layer

Service functions must `throw` on failure. Never swallow errors silently or return `null` to signal failure. Use descriptive error messages that include the entity type and action.

```typescript
// CORRECT
export const updateProduct = async (...): Promise<void> => {
  if (!product) throw new Error('updateProduct: product record is required');
  await database.write(async () => { ... });
};

// WRONG — silent failure
export const updateProduct = async (...): Promise<void> => {
  try {
    await database.write(async () => { ... });
  } catch {
    // swallowed
  }
};
```

### Store actions

Store actions that call services must catch errors and set `store.error`. They must also re-throw if the caller (a screen) needs to react to the failure (e.g., show an error message).

```typescript
addLineItem: async (item) => {
  try {
    await addLineItemToTransaction(...);
  } catch (error) {
    set({ error: error instanceof Error ? error : new Error(String(error)) });
    throw error; // re-throw so the screen can show feedback
  }
},
```

### Screen / component layer

Screens catch errors from store action calls in `try/catch` and show user-facing messages (e.g., a toast or inline error text). They do not log raw error objects to the user.

```typescript
const handleAddItem = async (item: Product) => {
  try {
    await useTransactionDraftStore.getState().addLineItem(item);
  } catch {
    showToast('Failed to add item. Please try again.');
  }
};
```

### Observable subscription errors

Each Zustand store's `subscribe` action passes an `error` callback to the Observable `.subscribe()`. Observable errors set `store.error`. `AppListeners` reads all store error fields and shows a persistent error banner when any subscription fails.

### No untyped catch bindings

Always type-narrow caught errors before use:

```typescript
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
}
```

---

## 9. Styling

### `StyleSheet.create` only

All styles must use `StyleSheet.create`. Inline style objects are forbidden — they create a new object on every render and bypass the native style registry.

```typescript
// WRONG
<View style={{ flex: 1, backgroundColor: '#fff' }}>

// CORRECT
<View style={styles.container}>

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
});
```

### Theme constants

All colors, spacing values, and typography styles must reference `src/constants/theme.ts`. Hard-coded hex values or pixel numbers are not permitted in component files.

```typescript
// src/constants/theme.ts (reference shape)
export const theme = {
  colors: {
    primary: '#1A56DB',
    background: '#F9FAFB',
    surface: '#FFFFFF',
    border: '#E5E7EB',
    text: '#111827',
    textMuted: '#6B7280',
    error: '#DC2626',
    warning: '#D97706',
    success: '#16A34A',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  radius: {
    sm: 4,
    md: 8,
    lg: 16,
  },
  typography: {
    heading1: { fontSize: 24, fontWeight: '700' as const },
    heading2: { fontSize: 20, fontWeight: '600' as const },
    body: { fontSize: 14, fontWeight: '400' as const },
    caption: { fontSize: 12, fontWeight: '400' as const },
    label: { fontSize: 14, fontWeight: '500' as const },
  },
} as const;
```

### Platform-specific styles

Use `Platform.select` inside `StyleSheet.create` for Android-specific adjustments. Do not create separate `.android.tsx` files unless the entire component structure differs by platform.

```typescript
const styles = StyleSheet.create({
  shadow: Platform.select({
    android: { elevation: 4 },
    default: {},
  }),
});
```

---

## 10. Testing

### MVP scope

The MVP testing strategy is deliberately minimal. Full test coverage is not required before launch. The following rules apply:

**Write tests for:**
- Pure utility functions in `src/utils/` (unit tests with Jest)
- `hasPermission` utility (unit tests)
- VAT and discount calculation functions (`calculateLineItem`, `calculateTransaction`)
- PIN hashing and verification (`pinHash.ts`)

**Skip for MVP:**
- Screen component tests
- Store integration tests
- End-to-end (Detox / Maestro) tests
- Service layer tests (WatermelonDB in-memory testing requires non-trivial setup)

### Test file location

Test files live adjacent to the source file using the `.test.ts` suffix:

```
src/utils/calculateLineItem.ts
src/utils/calculateLineItem.test.ts
```

### Test style

Use Jest with React Native Testing Library conventions. Do not use `describe` nesting deeper than two levels.

```typescript
// src/utils/calculateLineItem.test.ts
import { calculateLineItem } from './calculateLineItem';

describe('calculateLineItem', () => {
  it('computes VAT-exclusive total correctly', () => {
    const result = calculateLineItem({ unitPrice: 100, quantity: 2, vatType: 'VAT_EXCLUSIVE' });
    expect(result.vatAmount).toBe(24);
    expect(result.total).toBe(224);
  });
});
```

---

## 11. Imports

### Absolute imports

Use absolute imports from the `src/` root. Configure `tsconfig.json` and `babel.config.js` with a `src` path alias.

```typescript
// CORRECT
import { useInventoryStore } from 'src/stores/inventoryStore';
import { formatPHP } from 'src/utils/formatCurrency';
import type { Product } from 'src/types';

// WRONG — relative paths for cross-folder imports
import { useInventoryStore } from '../../stores/inventoryStore';
```

Relative imports are acceptable only within the same folder (e.g., a screen importing a sibling component file within the same feature folder).

### Import order

Enforce the following order with a blank line between each group. ESLint with `eslint-plugin-import` should enforce this automatically.

```typescript
// 1. React and React Native core
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';

// 2. Third-party libraries
import { useNavigation } from '@react-navigation/native';

// 3. Internal: constants and types
import { Permission } from 'src/constants/permissions';
import { theme } from 'src/constants/theme';
import type { Product } from 'src/types';

// 4. Internal: stores, services, hooks, utils
import { useInventoryStore } from 'src/stores/inventoryStore';
import { useHasPermission } from 'src/hooks/useHasPermission';

// 5. Internal: components
import { ScreenWrapper } from 'src/components/layout/ScreenWrapper';
import { AppButton } from 'src/components/common/AppButton';
```

### Type-only imports

Always use `import type` for TypeScript type and interface imports. This ensures zero runtime cost and makes the import intent explicit.

```typescript
import type { Product, Transaction } from 'src/types';
import type { StackScreenProps } from '@react-navigation/stack';
```

---

## 12. Do's and Don'ts

### Database

- **DO** write all mutations inside `database.write()`.
- **DO** include the audit log entry in the same `database.write()` block as the primary mutation. They must be atomic.
- **DO** keep all WatermelonDB and `database.ts` imports inside `src/services/` and `src/models/`.
- **DO NOT** import `database` from anywhere outside `src/services/`.
- **DO NOT** import from `@nozbe/watermelondb` anywhere except `src/models/` and `src/services/database.ts`.
- **DO NOT** expose update or delete methods on `auditService.ts`. Audit logs are append-only forever.
- **DO NOT** call `.fetch()` inside a render function or `useEffect` without a loading guard — always track `loading` state.

### Zustand stores

- **DO NOT** import `database` or any service's observable function directly in a component — go through the store.
- **DO** always call `unsubscribe()` on logout and session lock. Dangling subscriptions are a memory leak and a security issue (User B could see User A's data).
- **DO NOT** read `_` prefixed store fields from components.
- **DO** call `clearDraft()` on `transactionDraftStore` before restoring session for a different user.

### Permissions

- **DO** apply both `usePermissionGuard` (screen guard) and `useHasPermission` (UI hiding) for permission-gated features. The guard is a safety net; the UI hiding is for UX.
- **DO** return `null` immediately after `usePermissionGuard` returns `false`. This prevents screen-level `useEffect`s from running before the guard fires.
- **DO NOT** check `user.isMainAdmin` inline in components. Use `hasPermission` or its hook wrappers — they already handle the Main Admin bypass.

### TypeScript

- **DO NOT** use `any`. Use `unknown` + type narrowing.
- **DO NOT** use `!` (non-null assertion) on values that could be null at runtime. Throw a descriptive error instead.
- **DO** use `import type` for all type-only imports.

### Styling

- **DO NOT** use inline style objects (`style={{ ... }}`).
- **DO NOT** hard-code color hex values or pixel numbers in component files. All values come from `src/constants/theme.ts`.

### Errors

- **DO NOT** swallow errors silently in the service layer. Always `throw`.
- **DO** re-throw from store actions when the screen needs to react to failure.
- **DO NOT** expose raw error objects or stack traces to the user. Show a short, human-readable message.

### Navigation

- **DO** define all route param types in `src/navigation/types.ts`.
- **DO NOT** pass navigation params outside the typed param list.
- **DO NOT** use `navigation.navigate` with a plain string that is not covered by the param list types — the compiler will catch this.

### General

- **DO NOT** import from `src/utils/` inside `src/services/` or `src/stores/` if the utility requires store or database access. Utils are pure — they have no side effects and no imports from stores or services.
- **DO NOT** create barrel `index.ts` files inside screen folders.
- **DO** snapshot line item names and prices at the time of add. Never re-read the product name or price from the product record at finalization time — the product may have been edited.
- **DO** reserve stock atomically with the line item creation in a single `database.write()`. Never decrement stock before the line item exists.