# AMSPOS-7: Setup Zustand Stores Skeleton

**Sprint**: Sprint 0 — Foundation Infrastructure
**Effort**: 1 day
**Dependencies**: AMSPOS-1
**Phase**: Foundation

---

## Description

Create skeleton Zustand store files for all 6 stores with their typed interfaces, initial state, and placeholder actions. These will be fully implemented in later sprints — the goal here is to establish the typed contracts and ensure all imports resolve.

---

## Instructions

### 1. `src/stores/sessionStore.ts`

```typescript
import { create } from 'zustand';

interface SessionStore {
  user: null; // will be typed as User | null in AMSPOS-12
  status: 'NONE' | 'ACTIVE' | 'LOCKED';
  lastActivityAt: number;

  login: (userId: string) => Promise<void>;
  logout: () => void;
  lock: () => void;
  unlock: (pin: string) => Promise<boolean>;
  refreshActivity: () => void;
}

export const useSessionStore = create<SessionStore>((set, get) => ({
  user: null,
  status: 'NONE',
  lastActivityAt: 0,

  login: async (_userId) => { /* implemented in AMSPOS-12 */ },
  logout: () => set({ user: null, status: 'NONE' }),
  lock: () => set({ status: 'LOCKED' }),
  unlock: async (_pin) => false,
  refreshActivity: () => set({ lastActivityAt: Date.now() }),
}));
```

### 2. `src/stores/transactionDraftStore.ts`

```typescript
import { create } from 'zustand';

interface TransactionDraftStore {
  draft: null; // will be typed as Transaction | null in AMSPOS-44
  openDraft: (transactionId: string) => Promise<void>;
  addLineItem: (item: unknown) => Promise<void>;
  removeLineItem: (lineItemId: string) => Promise<void>;
  updateLineItemQty: (lineItemId: string, qty: number) => Promise<void>;
  applyDiscount: (lineItemId: string, type: 'FIXED' | 'PERCENTAGE', value: number) => Promise<void>;
  removeDiscount: (lineItemId: string) => Promise<void>;
  applyAddOn: (lineItemId: string, addOn: unknown) => Promise<void>;
  removeAddOn: (lineItemId: string, addOnId: string) => Promise<void>;
  clearDraft: () => void;
}

export const useTransactionDraftStore = create<TransactionDraftStore>((set) => ({
  draft: null,
  openDraft: async (_id) => {},
  addLineItem: async (_item) => {},
  removeLineItem: async (_id) => {},
  updateLineItemQty: async (_id, _qty) => {},
  applyDiscount: async (_id, _type, _value) => {},
  removeDiscount: async (_id) => {},
  applyAddOn: async (_id, _addOn) => {},
  removeAddOn: async (_id, _addOnId) => {},
  clearDraft: () => set({ draft: null }),
}));
```

### 3. `src/stores/openTransactionsStore.ts`

```typescript
import { create } from 'zustand';
import type { Subscription } from 'rxjs';

interface OpenTransactionsStore {
  transactions: unknown[]; // will be typed as Transaction[] in AMSPOS-45
  loading: boolean;
  error: Error | null;
  _subscription: Subscription | null;

  subscribe: () => void;
  unsubscribe: () => void;
}

export const useOpenTransactionsStore = create<OpenTransactionsStore>((set, get) => ({
  transactions: [],
  loading: true,
  error: null,
  _subscription: null,

  subscribe: () => { /* implemented in AMSPOS-45 */ },
  unsubscribe: () => {
    get()._subscription?.unsubscribe();
    set({ _subscription: null });
  },
}));
```

### 4. `src/stores/inventoryStore.ts`

```typescript
import { create } from 'zustand';
import type { Subscription } from 'rxjs';

interface InventoryStore {
  products: unknown[];
  serviceItems: unknown[];
  loading: boolean;
  error: Error | null;
  _productSubscription: Subscription | null;
  _serviceSubscription: Subscription | null;

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

  subscribe: () => { /* implemented in AMSPOS-41 */ },
  unsubscribe: () => {
    get()._productSubscription?.unsubscribe();
    get()._serviceSubscription?.unsubscribe();
    set({ _productSubscription: null, _serviceSubscription: null });
  },
}));
```

### 5. `src/stores/catalogStore.ts`

```typescript
import { create } from 'zustand';
import type { Subscription } from 'rxjs';

interface CatalogStore {
  categories: unknown[];
  suppliers: unknown[];
  addOns: unknown[];
  error: Error | null;
  _subscription: Subscription | null;

  subscribe: () => void;
  unsubscribe: () => void;
}

export const useCatalogStore = create<CatalogStore>((set, get) => ({
  categories: [],
  suppliers: [],
  addOns: [],
  error: null,
  _subscription: null,

  subscribe: () => { /* implemented in AMSPOS-42 */ },
  unsubscribe: () => {
    get()._subscription?.unsubscribe();
    set({ _subscription: null });
  },
}));
```

### 6. `src/stores/userStore.ts`

```typescript
import { create } from 'zustand';
import type { Subscription } from 'rxjs';

interface UserStore {
  users: unknown[];
  loading: boolean;
  error: Error | null;
  _subscription: Subscription | null;

  subscribe: () => void;
  unsubscribe: () => void;
}

export const useUserStore = create<UserStore>((set, get) => ({
  users: [],
  loading: true,
  error: null,
  _subscription: null,

  subscribe: () => { /* implemented in AMSPOS-40 */ },
  unsubscribe: () => {
    get()._subscription?.unsubscribe();
    set({ _subscription: null });
  },
}));
```

### 7. `src/stores/settingsStore.ts`

```typescript
import { create } from 'zustand';

interface SettingsStore {
  settings: null; // will be typed as AppSettings | null in AMSPOS-43
  error: Error | null;

  subscribe: () => void;
  unsubscribe: () => void;
  updateSettings: (patch: Record<string, unknown>) => Promise<void>;
}

export const useSettingsStore = create<SettingsStore>((set) => ({
  settings: null,
  error: null,

  subscribe: () => { /* implemented in AMSPOS-43 */ },
  unsubscribe: () => {},
  updateSettings: async (_patch) => {},
}));
```

### 8. `src/stores/index.ts`

```typescript
export { useSessionStore } from './sessionStore';
export { useTransactionDraftStore } from './transactionDraftStore';
export { useOpenTransactionsStore } from './openTransactionsStore';
export { useInventoryStore } from './inventoryStore';
export { useCatalogStore } from './catalogStore';
export { useUserStore } from './userStore';
export { useSettingsStore } from './settingsStore';
```

---

## Acceptance Criteria

- [ ] All 7 store files exist in `src/stores/`
- [ ] Each store uses `create<Interface>` with typed state and action signatures
- [ ] Internal subscription fields are prefixed with `_` (e.g., `_subscription`)
- [ ] `src/stores/index.ts` re-exports all stores
- [ ] No TypeScript errors

## Definition of Done

- All acceptance criteria are met
- `npx tsc --noEmit` passes
- Code committed to `main`
