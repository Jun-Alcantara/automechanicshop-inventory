# Screen Map & Navigation Structure - AutoShop POS

## 1. Screen Inventory

22 full screens + 7 modals/overlays.

### Auth / Bootstrapping

| # | Screen Name | Route | Nav Type | Permission Guard |
|---|---|---|---|---|
| 1 | Init Setup | `InitSetup` | Root Stack (conditional) | None — shown only on first launch when no users exist |
| 2 | PIN Lock Overlay | `PinLock` | Root Modal (always rendered) | None — this IS the auth gate |

### Tab: Dashboard

| # | Screen Name | Route | Nav Type | Permission Guard |
|---|---|---|---|---|
| 3 | Dashboard | `Dashboard` | Tab root | Any active session |

### Tab: Transactions

| # | Screen Name | Route | Nav Type | Permission Guard |
|---|---|---|---|---|
| 4 | Transaction List | `TransactionList` | Tab root | Any active session |
| 5 | New Transaction | `NewTransaction` | Stack push | `CREATE_TRANSACTIONS` |
| 6 | Transaction Detail | `TransactionDetail` | Stack push | `CREATE_TRANSACTIONS` |
| 7 | Payment | `Payment` | Stack push | `CREATE_TRANSACTIONS` |
| 8 | Receipt | `Receipt` | Stack push | `CREATE_TRANSACTIONS` |
| 9 | Transaction History Detail | `TransactionHistoryDetail` | Stack push | Any active session (read-only) |
| 10 | Void Transaction | `VoidTransaction` | Stack push | `VOID_TRANSACTIONS` |
| 11 | Return Transaction | `ReturnTransaction` | Stack push | `VOID_TRANSACTIONS` |

### Tab: Inventory

| # | Screen Name | Route | Nav Type | Permission Guard |
|---|---|---|---|---|
| 12 | Inventory List | `InventoryList` | Tab root | Any active session (browse only) |
| 13 | Product Form | `ProductForm` | Stack push | `MANAGE_INVENTORY` |
| 14 | Service Form | `ServiceForm` | Stack push | `MANAGE_INVENTORY` |
| 15 | Category List | `CategoryList` | Stack push | `MANAGE_INVENTORY` |
| 16 | Supplier List | `SupplierList` | Stack push | `MANAGE_INVENTORY` |
| 17 | Add-On Catalog | `AddOnCatalog` | Stack push | `MANAGE_INVENTORY` |

### Tab: Admin

| # | Screen Name | Route | Nav Type | Permission Guard |
|---|---|---|---|---|
| 18 | Admin Menu | `AdminMenu` | Tab root | ≥1 of: `VIEW_REPORTS`, `MANAGE_USERS`, `MANAGE_SETTINGS` |
| 19 | Reports | `Reports` | Stack push | `VIEW_REPORTS` |
| 20 | Audit Log | `AuditLog` | Stack push | `VIEW_REPORTS` |
| 21 | Customer List | `CustomerList` | Stack push | Any active session |
| 22 | Customer Detail | `CustomerDetail` | Stack push | Any active session |
| 23 | Customer Form | `CustomerForm` | Stack push | `CREATE_TRANSACTIONS` |
| 24 | Vehicle Detail | `VehicleDetail` | Stack push | Any active session |
| 25 | Vehicle Form | `VehicleForm` | Stack push | `CREATE_TRANSACTIONS` |
| 26 | User List | `UserList` | Stack push | `MANAGE_USERS` |
| 27 | User Form | `UserForm` | Stack push | `MANAGE_USERS` |
| 28 | Settings | `Settings` | Stack push | `MANAGE_SETTINGS` |
| 29 | Change Own PIN | `ChangeOwnPin` | Stack push | Any active session |

### Modals / Overlays

| # | Name | Route | Trigger Location(s) | Permission Guard |
|---|---|---|---|---|
| M1 | PIN Lock Overlay | `PinLock` | Inactivity timeout (anywhere), manual lock | None |
| M2 | Barcode Scanner | `BarcodeScanner` | TransactionDetail, InventoryList, ProductForm | Context-inherited |
| M3 | Discount Picker | `DiscountPicker` | TransactionDetail (per line item) | `APPLY_DISCOUNTS` |
| M4 | Add-On Picker | `AddOnPicker` | TransactionDetail (per line item) | `CREATE_TRANSACTIONS` |
| M5 | Customer Search | `CustomerSearch` | NewTransaction | `CREATE_TRANSACTIONS` |
| M6 | Unknown Barcode Alert | inline dialog | TransactionDetail, InventoryList | Context-inherited |
| M7 | Negative Stock Warning | inline dialog | TransactionDetail (on add item at stock=0) | Context-inherited |

---

## 2. Navigation Tree

```
RootStack (Native Stack)
├── InitSetup               ← conditional: only shown on first-ever launch
├── PinLock                 ← modal, always rendered on top; preserves screen state beneath
└── MainTabs (Bottom Tab Navigator)
    │
    ├── [Tab] Dashboard
    │   └── DashboardStack
    │       └── Dashboard
    │
    ├── [Tab] Transactions
    │   └── TransactionsStack
    │       ├── TransactionList
    │       ├── NewTransaction
    │       │   └── CustomerSearch  ← modal (root-level, triggered here)
    │       ├── TransactionDetail
    │       │   ├── DiscountPicker  ← modal (root-level, triggered per line item)
    │       │   ├── AddOnPicker     ← modal (root-level, triggered per line item)
    │       │   ├── BarcodeScanner  ← modal (root-level)
    │       │   ├── NegativeStockWarning  ← inline dialog
    │       │   └── UnknownBarcodeAlert   ← inline dialog
    │       ├── Payment
    │       ├── Receipt
    │       ├── TransactionHistoryDetail  ← read-only; entry from list or Reports
    │       ├── VoidTransaction           ← entry from TransactionHistoryDetail
    │       └── ReturnTransaction         ← entry from TransactionHistoryDetail
    │
    ├── [Tab] Inventory
    │   └── InventoryStack
    │       ├── InventoryList
    │       │   ├── BarcodeScanner       ← modal (root-level)
    │       │   └── UnknownBarcodeAlert  ← inline dialog
    │       ├── ProductForm     ← new & edit (param: productId?)
    │       │   └── BarcodeScanner  ← modal (root-level)
    │       ├── ServiceForm     ← new & edit (param: serviceId?)
    │       ├── CategoryList
    │       ├── SupplierList
    │       └── AddOnCatalog
    │
    └── [Tab] Admin
        └── AdminStack
            ├── AdminMenu
            ├── Reports
            │   └── AuditLog
            ├── CustomerList
            ├── CustomerDetail
            │   ├── CustomerForm   ← edit existing customer
            │   └── VehicleDetail
            │       └── VehicleForm
            ├── CustomerForm       ← new customer (param: customerId?)
            ├── UserList
            ├── UserForm           ← new & edit (param: userId?)
            ├── Settings
            └── ChangeOwnPin
```

> **Cross-stack modals** (`BarcodeScanner`, `DiscountPicker`, `AddOnPicker`, `CustomerSearch`) are registered at the RootStack level with `presentation: "modal"` so they can be pushed from any nested stack without duplicating navigator registrations.

---

## 3. Modal vs. Full-Screen Decisions

| Screen | Decision | Rationale |
|---|---|---|
| `PinLock` | Full-screen modal (root level) | Must cover the entire app, including any open modals below it |
| `BarcodeScanner` | Full-screen modal | Camera requires full viewport; temporary — dismissed immediately after a scan result |
| `DiscountPicker` | Bottom-sheet modal | Contextual to a single line item; user stays anchored to the transaction behind it |
| `AddOnPicker` | Bottom-sheet modal | Same as DiscountPicker — brief selection, no need to leave the transaction screen |
| `CustomerSearch` | Full-screen modal | Search + scroll list needs full height; triggered mid-flow so the transaction context beneath is preserved |
| `VoidTransaction` | Full-screen push | Deliberate, consequential action; dedicated screen reinforces its gravity and leaves a clear back-navigation trail |
| `ReturnTransaction` | Full-screen push | Same rationale as Void |
| `Payment` | Full-screen push | Multi-step input (method selection, amounts, split logic, change calculation); needs undivided screen space |
| `Receipt` | Full-screen push | Final step of transaction; print/download actions are the primary focus |
| `UnknownBarcodeAlert` | Inline Alert dialog | Two options (Cancel / Create Product); no need for a dedicated screen |
| `NegativeStockWarning` | Inline Alert dialog | Non-blocking confirmation; two options (Continue / Cancel) |

---

## 4. Major Flow Maps

### Flow 1 — Transaction Creation & Payment

```
TransactionList
  → [+ New Transaction]
NewTransaction
  → [Search or create customer+vehicle]  →  CustomerSearch modal
  → [Walk-in: enter nickname]            →  duplicate-nickname prompt (inline)
  → [Confirm customer/vehicle]
TransactionDetail
  → [Add item: search / browse / barcode]  →  BarcodeScanner modal (optional)
  → [Item added at stock=0]                →  NegativeStockWarning dialog
  → [Apply discount to line item]          →  DiscountPicker modal (APPLY_DISCOUNTS)
  → [Add add-on to line item]              →  AddOnPicker modal
  → [Proceed to Payment]
Payment
  → [Select method: Cash / GCash / Maya]
  → [Split: enter amounts per method]
  → [Finalize]
Receipt
  → [Print via Bluetooth]     →  PrintFailure dialog if printer unreachable
  → [Download PDF instead]    →  expo-sharing share sheet
  → [Skip]
→ navigate to Dashboard (stack cleared)
```

### Flow 2 — Void Transaction

```
TransactionHistoryDetail (FINALIZED status)
  → [Void]  →  guarded: VOID_TRANSACTIONS permission
  →  guard: if hasReturn = true, block with inline error
VoidTransaction
  → per-method refund breakdown displayed
  → [Enter reason]
  → [Confirm Void]
→ back to TransactionHistoryDetail (now VOIDED; immutable)
```

### Flow 3 — Return Transaction

```
TransactionHistoryDetail (FINALIZED status)
  → [Return]  →  guarded: VOID_TRANSACTIONS permission
  →  guard: if status = VOIDED, Return button is hidden
ReturnTransaction
  → per-method refund breakdown displayed
  → [Enter reason]
  → [Confirm Return]
→ back to TransactionHistoryDetail (now RETURNED; sets hasReturn = true on original)
```

### Flow 4 — Inventory Edit (Product)

```
InventoryList
  → [tap existing product]  →  ProductForm (edit mode, param: productId)
  → [+ New Product]         →  ProductForm (create mode)
ProductForm
  → [Scan barcode]  →  BarcodeScanner modal  →  pre-fills barcode field
  → [Save]
→ back to InventoryList (Firestore listener auto-refreshes list)
```

### Flow 5 — Unknown Barcode (from Transaction)

```
TransactionDetail  →  [scan barcode]  →  BarcodeScanner modal
  → barcode not found in products collection
UnknownBarcodeAlert dialog
  → [Cancel]           →  dismiss, remain on TransactionDetail
  → [Create Product]   →  ProductForm (create mode, barcode pre-filled)
    → [Save]           →  product created in Firestore
    → newly created product immediately added as line item to current transaction
→ return to TransactionDetail
```

### Flow 6 — Session Lock / Unlock

```
[Any screen]  →  5-min inactivity OR manual lock
PinLock overlay renders over current screen (state beneath is preserved)
  → [Enter correct PIN]  →  overlay dismissed, user returned to exact screen
  → [Wrong PIN]          →  shake animation, re-prompt
  → Payment screen mid-entry  →  all entered payment amounts discarded on lock
                                  (cashier must restart payment entry after unlock)
```

---

## 5. Permission Guard Summary

> Guards are enforced in two places: (1) hiding/disabling navigation entry points (tabs, buttons), and (2) a runtime check at screen mount that redirects unauthorized users back to Dashboard with a toast.

| Permission | Screens Gated |
|---|---|
| `CREATE_TRANSACTIONS` | NewTransaction, TransactionDetail, Payment, Receipt, CustomerForm (new), VehicleForm (new), CustomerSearch modal, AddOnPicker modal |
| `APPLY_DISCOUNTS` | DiscountPicker modal (button visible but disabled without this permission) |
| `VOID_TRANSACTIONS` | VoidTransaction, ReturnTransaction |
| `CANCEL_TRANSACTIONS` | Item removal controls within TransactionDetail |
| `MANAGE_INVENTORY` | ProductForm, ServiceForm, CategoryList, SupplierList, AddOnCatalog |
| `VIEW_REPORTS` | Reports, AuditLog |
| `MANAGE_USERS` | UserList, UserForm |
| `MANAGE_SETTINGS` | Settings |
| `isMainAdmin` | Full bypass of all guards; also sole grantor of `MANAGE_USERS` to others |
| Any active session | Dashboard, TransactionList, InventoryList (read-only), CustomerList, CustomerDetail, VehicleDetail, TransactionHistoryDetail, ChangeOwnPin |
