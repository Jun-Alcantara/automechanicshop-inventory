# App Architecture & Folder Structure - AutoShop POS

## 1. Folder Structure

```
autoshop-pos/
├── src/
│   ├── navigation/          # React Navigation setup
│   ├── screens/             # One file per screen, grouped by feature
│   ├── components/          # Reusable UI components
│   ├── stores/              # Zustand store slices
│   ├── services/            # All WatermelonDB reads/writes
│   ├── hooks/               # Custom React hooks
│   ├── constants/           # Enums, theme, app-wide literals
│   ├── types/               # TypeScript interfaces & types
│   └── utils/               # Pure functions (math, formatting, hashing)
├── assets/                  # Images, fonts
├── app.json
├── package.json
└── tsconfig.json
```

---

### `/src/navigation/`

```
navigation/
├── RootNavigator.tsx         # Root stack: InitSetup, PinLock, MainTabs
├── MainTabNavigator.tsx      # Bottom tab navigator (4 tabs)
├── TransactionsStack.tsx     # Transactions tab stack
├── InventoryStack.tsx        # Inventory tab stack
├── AdminStack.tsx            # Admin tab stack (reports, users, settings)
└── types.ts                  # RootStackParamList, all screen param types
```

---

### `/src/screens/`

```
screens/
├── auth/
│   ├── InitSetupScreen.tsx
│   └── PinLockScreen.tsx
├── dashboard/
│   └── DashboardScreen.tsx
├── transactions/
│   ├── TransactionListScreen.tsx
│   ├── NewTransactionScreen.tsx
│   ├── TransactionDetailScreen.tsx
│   ├── PaymentScreen.tsx
│   ├── ReceiptScreen.tsx
│   ├── TransactionHistoryDetailScreen.tsx
│   ├── VoidTransactionScreen.tsx
│   └── ReturnTransactionScreen.tsx
├── inventory/
│   ├── InventoryListScreen.tsx
│   ├── ProductFormScreen.tsx
│   ├── ServiceFormScreen.tsx
│   ├── CategoryListScreen.tsx
│   ├── SupplierListScreen.tsx
│   └── AddOnCatalogScreen.tsx
├── admin/
│   ├── AdminMenuScreen.tsx
│   ├── ReportsScreen.tsx
│   ├── AuditLogScreen.tsx
│   ├── CustomerListScreen.tsx
│   ├── CustomerDetailScreen.tsx
│   ├── CustomerFormScreen.tsx
│   ├── VehicleDetailScreen.tsx
│   ├── VehicleFormScreen.tsx
│   ├── UserListScreen.tsx
│   ├── UserFormScreen.tsx
│   ├── SettingsScreen.tsx
│   └── ChangeOwnPinScreen.tsx
└── modals/
    ├── BarcodeScannerModal.tsx
    ├── DiscountPickerModal.tsx
    ├── AddOnPickerModal.tsx
    └── CustomerSearchModal.tsx
```

---

### `/src/components/`

```
components/
├── common/             # Generic, context-free UI atoms
│   ├── AppButton.tsx
│   ├── AppInput.tsx
│   ├── AppBadge.tsx
│   ├── Divider.tsx
│   ├── EmptyState.tsx
│   └── LoadingOverlay.tsx
├── layout/             # Screen chrome and structural wrappers
│   ├── ScreenWrapper.tsx
│   └── SectionHeader.tsx
├── transaction/        # Components used only in transaction screens
│   ├── TransactionCard.tsx
│   ├── LineItemRow.tsx
│   ├── PaymentMethodInput.tsx
│   └── RefundBreakdown.tsx
└── inventory/          # Components used only in inventory screens
    ├── ProductCard.tsx
    └── StockBadge.tsx
```

> **Rule**: A component belongs in a feature subfolder (`transaction/`, `inventory/`) if it is only ever rendered from that feature's screens. If it's used across more than one feature, it belongs in `common/`.

---

### `/src/services/`

```
services/
├── database.ts            # WatermelonDB instance init; exports `database` and all model classes
├── authService.ts         # PIN hashing and verification
├── userService.ts         # users table CRUD + observable
├── productService.ts      # products table CRUD + observable
├── serviceItemService.ts  # services table CRUD + observable
├── transactionService.ts  # transactions table CRUD + observable + atomic ops
├── customerService.ts     # customers + vehicles table CRUD + observable
├── catalogService.ts      # categories, suppliers, add_ons table CRUD + observables
├── auditService.ts        # audit_logs write-only (append)
└── settingsService.ts     # app settings read/write
```

> The folder is named `services/` and the shop's "service items" table maps to `serviceItemService.ts` to avoid ambiguity.
>
> `database.ts` is the single entry point for the WatermelonDB instance and all model class registrations. No other file imports from `@nozbe/watermelondb` directly except `database.ts` and the model class definitions themselves.

---

### `/src/stores/`

```
stores/
├── sessionStore.ts           # Current user, session status, activity timer
├── transactionDraftStore.ts  # Transaction being actively built/edited on screen
├── openTransactionsStore.ts  # Live IN_PROGRESS transaction list
├── inventoryStore.ts         # Products + service items (observable subscription)
├── catalogStore.ts           # Categories, suppliers, add-ons (observable subscription)
├── userStore.ts              # User accounts (observable subscription)
└── settingsStore.ts          # App settings (observable subscription)
```

---

### `/src/hooks/`

```
hooks/
├── usePermissionGuard.ts   # Redirect + toast if user lacks a permission
├── useHasPermission.ts     # Returns boolean; used for conditional UI
├── useInactivityTimer.ts   # Drives session lock via AppState + setTimeout
├── usePinAuth.ts           # PIN entry, hashing, verify against WatermelonDB user record
└── usePrinter.ts           # Bluetooth printer connect, print, error handling
```

---

### `/src/constants/`

```
constants/
├── permissions.ts       # Permission string enum
├── transactionStatus.ts # Transaction status enum
├── vatTypes.ts          # VAT type enum + labels
└── theme.ts             # Colors, spacing, typography scale
```

---

### `/src/types/`

```
types/
└── index.ts   # All TypeScript interfaces: User, Product, ServiceItem,
               # Transaction, LineItem, AddOn, Payment, Customer, Vehicle,
               # Category, Supplier, AppSettings, AuditLog
```

> All types live in one file. If it grows unwieldy (>400 lines), split into `user.types.ts`, `transaction.types.ts`, etc. and re-export from `index.ts`.

---

### `/src/utils/`

```
utils/
├── pinHash.ts              # hashPin(pin), verifyPin(pin, hash)
├── formatCurrency.ts       # formatPHP(amount) → "₱1,234.50"
├── calculateLineItem.ts    # vatAmount, discountAmount, total for a LineItem
└── calculateTransaction.ts # subtotal, totalVat, totalAmount, changeDue
```

> Utils are pure functions with no side effects and no imports from stores or services.

---

## 2. Zustand Store Slices

Each store exports a single `use[Name]Store` hook via `zustand/create`. State and actions are typed together in one interface.

---

### `useSessionStore`

Owns the authenticated session. All other stores read from this to know who is logged in.

```typescript
interface SessionStore {
  // State
  user: User | null;
  status: 'NONE' | 'ACTIVE' | 'LOCKED';
  lastActivityAt: number;

  // Actions
  login: (userId: string) => Promise<void>;       // fetches user record from WatermelonDB, sets status ACTIVE
  logout: () => void;                              // clears user, status → NONE
  lock: () => void;                               // status → LOCKED (preserves user ref)
  unlock: (pin: string) => Promise<boolean>;      // verify PIN, status → ACTIVE if correct
  refreshActivity: () => void;                    // resets lastActivityAt to Date.now()
}
```

---

### `useTransactionDraftStore`

Owns the transaction currently open on `TransactionDetailScreen`. Cleared when the user leaves the screen (finalize, cancel, or back-navigate).

```typescript
interface TransactionDraftStore {
  // State
  draft: Transaction | null;   // mirrors the IN_PROGRESS WatermelonDB transaction record

  // Actions
  openDraft: (transactionId: string) => Promise<void>;  // load from WatermelonDB
  addLineItem: (item: Product | ServiceItem) => Promise<void>;
  removeLineItem: (lineItemId: string) => Promise<void>;
  updateLineItemQty: (lineItemId: string, qty: number) => Promise<void>;
  applyDiscount: (lineItemId: string, type: 'FIXED' | 'PERCENTAGE', value: number) => Promise<void>;
  removeDiscount: (lineItemId: string) => Promise<void>;
  applyAddOn: (lineItemId: string, addOn: AddOnInput) => Promise<void>;
  removeAddOn: (lineItemId: string, addOnId: string) => Promise<void>;
  clearDraft: () => void;
}
```

> **Write pattern**: Each action writes to WatermelonDB via `database.write()` and then refreshes the local draft state from the updated record. Because WatermelonDB is fully local (no network), writes are synchronous at the SQLite level and complete in microseconds — there is no meaningful latency to hide with optimistic updates.
>
> **Stock reservation**: `addLineItem` reserves stock atomically within the same `database.write()` block as the line item creation. This works fully offline — there is no network dependency.
>
> **Multi-user unlock**: If a session lock occurs and a *different* user unlocks (different PIN/userId), `useSessionStore.unlock()` must call `clearDraft()` before restoring the ACTIVE state. This prevents User B from inheriting User A's open transaction context.

---

### `useOpenTransactionsStore`

Owns the list of IN_PROGRESS transactions shown on `TransactionListScreen`. Fed by a WatermelonDB observable subscription.

```typescript
interface OpenTransactionsStore {
  transactions: Transaction[];
  loading: boolean;
  error: Error | null;

  subscribe: () => void;    // starts WatermelonDB observable subscription
  unsubscribe: () => void;  // stops subscription; called on logout
}
```

---

### `useInventoryStore`

Owns the full product and service item lists. Fed by WatermelonDB observable subscriptions. Used for item search in `TransactionDetailScreen` and browsing in `InventoryListScreen`.

```typescript
interface InventoryStore {
  products: Product[];
  serviceItems: ServiceItem[];
  loading: boolean;
  error: Error | null;

  subscribe: () => void;
  unsubscribe: () => void;
}
```

> Full lists are held in memory because the terminal is single-device and the dataset is small. WatermelonDB queries return instantly from the local SQLite file — there is no loading delay after first mount.

---

### `useCatalogStore`

Owns categories, suppliers, and the add-on catalog. These are small, rarely changing lists.

```typescript
interface CatalogStore {
  categories: Category[];
  suppliers: Supplier[];
  addOns: AddOn[];
  error: Error | null;

  subscribe: () => void;
  unsubscribe: () => void;
}
```

---

### `useUserStore`

Owns the user account list for `UserListScreen`. Only hydrated when a user with `MANAGE_USERS` is active.

```typescript
interface UserStore {
  users: User[];
  loading: boolean;
  error: Error | null;

  subscribe: () => void;
  unsubscribe: () => void;
}
```

> `AppListeners` must check `hasPermission(user, 'MANAGE_USERS')` before calling `subscribe()` on this store. Do not subscribe for users without this permission.

---

### `useSettingsStore`

Owns app-wide settings (VAT defaults, inactivity timeout, receipt header, printer device ID).

```typescript
interface SettingsStore {
  settings: AppSettings | null;
  error: Error | null;

  subscribe: () => void;
  unsubscribe: () => void;
  updateSettings: (patch: Partial<AppSettings>) => Promise<void>;
}
```

---

## 3. WatermelonDB Service Layer Pattern

### Dependency rule

```
screens / components
       ↓
    stores
       ↓
   services          ← only layer that imports from database.ts
       ↓
  database.ts
```

Stores import from services. Services import from `database.ts`. No component, screen, or store ever imports from `database.ts` directly.

---

### Observable (reactive) pattern

Every real-time subscription follows this signature, returning a WatermelonDB Observable that the Zustand store subscribes to:

```typescript
// services/productService.ts
import { database } from './database';
import { Q } from '@nozbe/watermelondb';

export const observeProducts = () =>
  database
    .get('products')
    .query(Q.where('is_active', true), Q.sortBy('name', Q.asc))
    .observe();
```

The Zustand store calls `.subscribe()` on the returned Observable, storing the RxJS `Subscription` object. On `unsubscribe()`, the store calls `subscription.unsubscribe()` to stop the Observable:

```typescript
// stores/inventoryStore.ts (subscribe action excerpt)
subscribe: () => {
  const subscription = observeProducts().subscribe({
    next: (products) => set({ products, loading: false }),
    error: (error) => set({ error, loading: false }),
  });
  set({ _subscription: subscription });
},
unsubscribe: () => {
  get()._subscription?.unsubscribe();
  set({ _subscription: null });
},
```

Alternatively, for components that own their own data subscription lifecycle, use the `withObservables` HOC from `@nozbe/with-observables` to connect an Observable directly to component props, triggering re-renders only when the underlying data changes.

---

### Write pattern (with audit log)

Every write that must be audit-logged uses a single `database.write()` block so the primary write and audit entry are atomic. All operations inside one `database.write()` execute within a single SQLite transaction — if any step throws, all changes are rolled back:

```typescript
// services/productService.ts
import { database } from './database';

export const updateProduct = async (
  product: ProductModel,
  patch: Partial<Product>,
  actingUser: User
): Promise<void> => {
  await database.write(async () => {
    // Primary write
    await product.update((p) => {
      if (patch.name !== undefined) p.name = patch.name;
      if (patch.selling_price !== undefined) p.sellingPrice = patch.selling_price;
      if (patch.is_active !== undefined) p.isActive = patch.is_active;
      p.updatedAt = new Date();
      p.updatedBy = actingUser.id;
    });

    // Audit entry (same SQLite transaction — atomic)
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

---

### Stock reservation pattern

Adding a product to a transaction reserves stock atomically in a single `database.write()` block. This works fully offline — no network call is made at any point:

```typescript
// services/transactionService.ts
import { database } from './database';

export const addLineItemToTransaction = async (
  transaction: TransactionModel,
  product: ProductModel,
  actingUser: User
): Promise<void> => {
  await database.write(async () => {
    // Reserve stock — atomic with line item creation
    await product.update((p) => {
      p.stockAvailable = p.stockAvailable - 1;
      p.stockReserved = p.stockReserved + 1;
    });

    // Create line item record
    const lineItem = await database.get('line_items').create((li) => {
      li.transactionId = transaction.id;
      li.type = 'PRODUCT';
      li.refId = product.id;
      li.name = product.name;             // snapshot
      li.unitPrice = product.sellingPrice; // snapshot
      li.quantity = 1;
      li.vatType = product.vatType;
      li.subtotal = product.sellingPrice;
      li.vatAmount = calculateVat(product.sellingPrice, product.vatType);
      li.discountAmount = 0;
      li.total = li.subtotal + li.vatAmount;
    });

    // Audit entry
    await database.get('audit_logs').create((log) => {
      log.timestamp = new Date();
      log.userId = actingUser.id;
      log.userName = actingUser.displayName;
      log.actionType = 'ADD_ITEM';
      log.entityType = 'TRANSACTION';
      log.entityId = transaction.id;
      log.after = JSON.stringify({ lineItemId: lineItem.id, productId: product.id });
    });
  });
  // If any of the above steps throw, the entire write block is rolled back by SQLite.
  // Stock is never decremented without a corresponding line item being created.
};
```

> **Offline guarantee**: Because WatermelonDB maps directly to a local SQLite file, every `database.write()` completes entirely on-device. There is no concept of a pending write queue or a network-dependent transaction — the stock reservation is either committed or rolled back immediately, with no possibility of a partial write.

---

### Subscription lifecycle

All WatermelonDB observable subscriptions are managed by a single `AppListeners` component that mounts when the session becomes `ACTIVE` and unmounts on `LOCKED` / `NONE`:

```
RootNavigator
└── AppListeners   ← useEffect watches sessionStore.status
    │               ACTIVE  → call subscribe() on stores (see note below)
    │               LOCKED/NONE → call unsubscribe() on all stores
    └── MainTabs / PinLock / InitSetup
```

**Conditional subscription**: `useUserStore.subscribe()` is only called when the active user has the `MANAGE_USERS` permission. All other stores subscribe unconditionally on `ACTIVE`.

**Error surface path**: Each store's `error` callback (passed to the Observable `.subscribe()`) sets `store.error`. `AppListeners` reads all store `error` fields and displays a persistent error banner when any subscription fails (e.g., a schema mismatch or unexpected database error). The banner does not block the UI but informs the user that data may be stale.

This centralizes subscription management and ensures no dangling Observable subscriptions survive a logout.

---

## 4. Permission Guard Pattern

Three tools, used at different levels:

---

### `hasPermission` (pure utility)

```typescript
// utils/permissions.ts
export const hasPermission = (user: User | null, permission: Permission): boolean => {
  if (!user) return false;
  if (user.isMainAdmin) return true;
  return user.permissions.includes(permission);
};
```

Used inside services and store actions when they need to enforce access before a write.

---

### `useHasPermission` (hook for conditional UI)

```typescript
// hooks/useHasPermission.ts
export const useHasPermission = (permission: Permission): boolean => {
  const user = useSessionStore(s => s.user);
  return hasPermission(user, permission);
};
```

Used to show/hide buttons and entry points:

```tsx
const canApplyDiscount = useHasPermission('APPLY_DISCOUNTS');
// ...
{canApplyDiscount && <AppButton label="Apply Discount" onPress={...} />}
```

---

### `usePermissionGuard` (hook for screen-level enforcement)

Called at the top of every permission-gated screen. If the check fails, it navigates back and shows a toast. The hook returns a boolean so the screen can render `null` before the check resolves — this prevents any screen-level `useEffect`s from executing on an unauthorized mount.

```typescript
// hooks/usePermissionGuard.ts
export const usePermissionGuard = (permission: Permission): boolean => {
  const user = useSessionStore(s => s.user);
  const navigation = useNavigation();
  const isAuthorized = hasPermission(user, permission);

  useEffect(() => {
    if (!isAuthorized) {
      navigation.goBack();
      // show toast: "You don't have permission to access this screen."
    }
  }, [isAuthorized, navigation]);

  return isAuthorized;
};
```

Usage in a screen:

```tsx
export const ProductFormScreen = () => {
  const isAuthorized = usePermissionGuard('MANAGE_INVENTORY');
  if (!isAuthorized) return null; // prevents screen effects from running before guard fires

  // ... rest of screen
};
```

> Both the hook guard (runtime) and `useHasPermission` (hiding the entry point) are applied together. The guard is a safety net for deep links or direct navigation; the UI hiding is for UX clarity. Returning `null` before authorization is confirmed ensures no database queries or store actions execute on an unauthorized mount.

---

## 5. Naming Conventions

### Files

| Type | Convention | Example |
|---|---|---|
| Screen component | `PascalCaseScreen.tsx` | `TransactionDetailScreen.tsx` |
| Modal screen | `PascalCaseModal.tsx` | `DiscountPickerModal.tsx` |
| Reusable component | `PascalCase.tsx` | `LineItemRow.tsx` |
| Zustand store | `camelCaseStore.ts` | `transactionDraftStore.ts` |
| Database service | `camelCaseService.ts` | `productService.ts` |
| Custom hook | `useCamelCase.ts` | `usePermissionGuard.ts` |
| Utility | `camelCase.ts` | `calculateLineItem.ts` |
| Constant/enum file | `camelCase.ts` | `permissions.ts` |
| Type definitions | `index.ts` (or `camelCase.types.ts` if split) | `types/index.ts` |
| Navigator | `PascalCaseNavigator.tsx` | `TransactionsStack.tsx` |

### Code

| Symbol | Convention | Example |
|---|---|---|
| React component | `PascalCase` | `LineItemRow` |
| Zustand hook | `use[Entity]Store` | `useInventoryStore` |
| Custom hook | `use[Description]` | `useHasPermission` |
| Service function | `[verb][Entity]` | `observeProducts`, `updateProduct` |
| Constant value | `SCREAMING_SNAKE_CASE` | `CREATE_TRANSACTIONS` |
| TypeScript interface | `PascalCase` (no `I` prefix) | `Transaction`, `LineItem` |
| TypeScript enum | `PascalCase` | `TransactionStatus` |
| Screen route name | `PascalCase` (matches screen file name minus `Screen`) | `TransactionDetail` |

### Zustand store conventions

- State fields are plain nouns: `products`, `loading`, `error`
- Internal-only fields (not for direct component use) are prefixed with `_`: `_subscription`
- Action names use imperative verbs: `subscribe`, `addLineItem`, `clearDraft`

### Screen route params

Route param types are defined in `navigation/types.ts` as a single `RootStackParamList`. Screens never receive navigation params via props outside of this typed param list.

```typescript
// navigation/types.ts
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
```
