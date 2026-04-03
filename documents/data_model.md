# WatermelonDB Data Model - AutoShop POS

## Tables Overview

| Table | Description |
|---|---|
| `users` | App user accounts with hashed PINs and permissions |
| `categories` | Product categories |
| `suppliers` | Supplier records |
| `add_ons` | Predefined add-on catalog |
| `products` | Inventory items with stock tracking |
| `services` | Service items with base pricing |
| `customers` | Named and walk-in customer profiles |
| `vehicles` | Vehicle records linked to customers |
| `transactions` | Transaction headers with status and totals |
| `line_items` | Individual line items belonging to a transaction |
| `line_item_add_ons` | Add-on charges applied to a specific line item |
| `payments` | Payment records belonging to a transaction |
| `audit_logs` | Audit trail for all user actions |

> **Auto-generated `id`**: WatermelonDB automatically generates a unique string UUID `id` for every record. You do not define `id` in the schema — it is always present on every model instance as `record.id`.

> **Timestamp fields**: All `created_at` and `updated_at` fields use the `@date` decorator, which stores values as Unix milliseconds (integer) in SQLite and exposes them as JavaScript `Date` objects on the model.

---

## `users`

| Field | Type | Decorator | Description |
|---|---|---|---|
| `display_name` | string | `@text` | User's display name |
| `pin_hash` | string | `@text` | Hashed 6-digit numeric PIN (PBKDF2) |
| `pin_salt` | string | `@text` | Per-user random salt used for PBKDF2 hashing |
| `permissions` | string | `@json` | JSON-serialized string array of granted permissions (see below) |
| `is_main_admin` | boolean | `@field` | True only for the single Main Admin account |
| `is_active` | boolean | `@field` | False = deactivated, cannot log in |
| `created_at` | Date | `@date` | |
| `created_by` | string | `@text` | userId |
| `updated_at` | Date | `@date` | |
| `updated_by` | string | `@text` | userId |

**Permission values**: `MANAGE_USERS`, `MANAGE_INVENTORY`, `CREATE_TRANSACTIONS`, `APPLY_DISCOUNTS`, `VOID_TRANSACTIONS`, `CANCEL_TRANSACTIONS`, `VIEW_REPORTS`, `MANAGE_SETTINGS`

> **Design Note**: `is_main_admin: true` bypasses all permission checks. The `permissions` array on the Main Admin record is kept in sync but is never the authority — `is_main_admin` is. This prevents accidental lockout if the array is somehow corrupted.
>
> **`permissions` as JSON**: WatermelonDB does not natively support array columns. The `permissions` field is stored as a JSON string (e.g., `'["MANAGE_INVENTORY","CREATE_TRANSACTIONS"]'`) and serialized/deserialized in the model class using the `@json` decorator with a sanitizer function. The model exposes `permissions` as a `string[]` to consumers — the JSON encoding is an implementation detail of the storage layer.

```typescript
// schema excerpt
tableSchema({
  name: 'users',
  columns: [
    { name: 'display_name', type: 'string' },
    { name: 'pin_hash', type: 'string' },
    { name: 'pin_salt', type: 'string' },
    { name: 'permissions', type: 'string' },    // JSON array string
    { name: 'is_main_admin', type: 'boolean' },
    { name: 'is_active', type: 'boolean' },
    { name: 'created_at', type: 'number' },
    { name: 'created_by', type: 'string' },
    { name: 'updated_at', type: 'number' },
    { name: 'updated_by', type: 'string' },
  ],
})
```

---

## `categories`

| Field | Type | Decorator | Description |
|---|---|---|---|
| `name` | string | `@text` | Category name (e.g., "Oils", "Brakes") |
| `created_at` | Date | `@date` | |
| `created_by` | string | `@text` | userId |

```typescript
tableSchema({
  name: 'categories',
  columns: [
    { name: 'name', type: 'string' },
    { name: 'created_at', type: 'number' },
    { name: 'created_by', type: 'string' },
  ],
})
```

---

## `suppliers`

| Field | Type | Decorator | Description |
|---|---|---|---|
| `name` | string | `@text` | Supplier name |
| `contact_info` | string | `@text` | Optional contact details (empty string if not set) |
| `created_at` | Date | `@date` | |
| `created_by` | string | `@text` | userId |

```typescript
tableSchema({
  name: 'suppliers',
  columns: [
    { name: 'name', type: 'string' },
    { name: 'contact_info', type: 'string', isOptional: true },
    { name: 'created_at', type: 'number' },
    { name: 'created_by', type: 'string' },
  ],
})
```

---

## `add_ons`

Predefined catalog of add-on charges. On-the-fly add-ons created during a transaction are **not** saved here — they are stored as `line_item_add_ons` rows with `is_on_the_fly: true` and a null `add_on_id`.

| Field | Type | Decorator | Description |
|---|---|---|---|
| `name` | string | `@text` | Add-on label (e.g., "Disposal Fee") |
| `amount` | number | `@field` | Default charge amount in PHP |
| `is_active` | boolean | `@field` | Soft-delete flag |
| `created_at` | Date | `@date` | |
| `created_by` | string | `@text` | userId |

```typescript
tableSchema({
  name: 'add_ons',
  columns: [
    { name: 'name', type: 'string' },
    { name: 'amount', type: 'number' },
    { name: 'is_active', type: 'boolean' },
    { name: 'created_at', type: 'number' },
    { name: 'created_by', type: 'string' },
  ],
})
```

---

## `products`

| Field | Type | Decorator | Description |
|---|---|---|---|
| `name` | string | `@text` | Product name |
| `barcode` | string | `@text` | Optional barcode value (empty string if not set) |
| `selling_price` | number | `@field` | Selling price in PHP |
| `cost_price` | number | `@field` | Cost price in PHP |
| `unit_of_measure` | string | `@text` | e.g., `"piece"`, `"liter"`, `"set"` |
| `stock_available` | number | `@field` | Units available for new transactions |
| `stock_reserved` | number | `@field` | Units reserved by In Progress transactions |
| `low_stock_threshold` | number | `@field` | Visual alert fires when `stock_available <= threshold` |
| `category_id` | string | `@text` | Foreign key to `categories` (empty string if unset) |
| `supplier_id` | string | `@text` | Foreign key to `suppliers` (empty string if unset) |
| `is_active` | boolean | `@field` | Soft-delete flag |
| `created_at` | Date | `@date` | |
| `created_by` | string | `@text` | userId |
| `updated_at` | Date | `@date` | |
| `updated_by` | string | `@text` | userId |

> **Design Note — Stock Reservation**: Stock is split into `stock_available` and `stock_reserved`. When a product is added to an In Progress transaction, `stock_available` is decremented and `stock_reserved` is incremented within a single `database.write()` call alongside the creation of the `line_items` row. Because all operations within one `database.write()` execute inside a single SQLite transaction, this is fully atomic — if any step fails, all changes are rolled back automatically. There is no network dependency whatsoever. This is a material advantage over the previous Firestore approach, which required `runTransaction` and a network round-trip, preventing stock reservation when the device was offline.
>
> On Finalize, `stock_reserved` is decremented (stock is committed). On Cancel, Void, or Return, both fields are reversed. The low-stock threshold check applies to `stock_available` only.

```typescript
tableSchema({
  name: 'products',
  columns: [
    { name: 'name', type: 'string' },
    { name: 'barcode', type: 'string', isOptional: true },
    { name: 'selling_price', type: 'number' },
    { name: 'cost_price', type: 'number' },
    { name: 'unit_of_measure', type: 'string' },
    { name: 'stock_available', type: 'number' },
    { name: 'stock_reserved', type: 'number' },
    { name: 'low_stock_threshold', type: 'number' },
    { name: 'category_id', type: 'string', isOptional: true },
    { name: 'supplier_id', type: 'string', isOptional: true },
    { name: 'is_active', type: 'boolean' },
    { name: 'created_at', type: 'number' },
    { name: 'created_by', type: 'string' },
    { name: 'updated_at', type: 'number' },
    { name: 'updated_by', type: 'string' },
  ],
})
```

---

## `services`

| Field | Type | Decorator | Description |
|---|---|---|---|
| `name` | string | `@text` | Service name (e.g., "Oil Change") |
| `base_price` | number | `@field` | Standard base price in PHP |
| `is_active` | boolean | `@field` | Soft-delete flag |
| `created_at` | Date | `@date` | |
| `created_by` | string | `@text` | userId |
| `updated_at` | Date | `@date` | |
| `updated_by` | string | `@text` | userId |

```typescript
tableSchema({
  name: 'services',
  columns: [
    { name: 'name', type: 'string' },
    { name: 'base_price', type: 'number' },
    { name: 'is_active', type: 'boolean' },
    { name: 'created_at', type: 'number' },
    { name: 'created_by', type: 'string' },
    { name: 'updated_at', type: 'number' },
    { name: 'updated_by', type: 'string' },
  ],
})
```

---

## `customers`

Covers both named customers and walk-in customers.

| Field | Type | Decorator | Description |
|---|---|---|---|
| `type` | string | `@text` | `"NAMED"` or `"WALKIN"` |
| `name` | string | `@text` | Full name for named; nickname for walk-in |
| `phone` | string | `@text` | Optional (named customers only; empty string if not set) |
| `email` | string | `@text` | Optional (named customers only; empty string if not set) |
| `is_active` | boolean | `@field` | Soft-delete flag |
| `created_at` | Date | `@date` | |
| `created_by` | string | `@text` | userId |

> **Design Note**: Walk-in customers use the same table as named customers, differentiated by `type`. This keeps customer search (`name`, `phone`) in a single query. Walk-in `name` is the nickname, included in all customer search results.

```typescript
tableSchema({
  name: 'customers',
  columns: [
    { name: 'type', type: 'string' },
    { name: 'name', type: 'string' },
    { name: 'phone', type: 'string', isOptional: true },
    { name: 'email', type: 'string', isOptional: true },
    { name: 'is_active', type: 'boolean' },
    { name: 'created_at', type: 'number' },
    { name: 'created_by', type: 'string' },
  ],
})
```

---

## `vehicles`

Flat table (not nested under `customers`) to enable plate number search across all customers.

| Field | Type | Decorator | Description |
|---|---|---|---|
| `customer_id` | string | `@relation('customers', 'customer_id')` | Foreign key to `customers` |
| `make` | string | `@text` | Required (e.g., "Toyota") |
| `model` | string | `@text` | Optional (e.g., "Vios"; empty string if not set) |
| `color` | string | `@text` | Optional (empty string if not set) |
| `plate_number` | string | `@text` | Optional (empty string if not set) |
| `created_at` | Date | `@date` | |
| `created_by` | string | `@text` | userId |

```typescript
tableSchema({
  name: 'vehicles',
  columns: [
    { name: 'customer_id', type: 'string', isIndexed: true },
    { name: 'make', type: 'string' },
    { name: 'model', type: 'string', isOptional: true },
    { name: 'color', type: 'string', isOptional: true },
    { name: 'plate_number', type: 'string', isOptional: true },
    { name: 'created_at', type: 'number' },
    { name: 'created_by', type: 'string' },
  ],
})
```

---

## `transactions`

The transaction header. Line items and payments are stored in separate related tables (`line_items` and `payments`) rather than as embedded arrays, because SQLite does not support nested objects. Separate tables are queried efficiently via foreign keys and are fully observable.

| Field | Type | Decorator | Description |
|---|---|---|---|
| `status` | string | `@text` | `"IN_PROGRESS"`, `"FINALIZED"`, `"VOIDED"`, `"CANCELLED"`, `"RETURNED"` |
| `customer_id` | string | `@text` | Foreign key to `customers` (empty string if no customer linked) |
| `vehicle_id` | string | `@text` | Foreign key to `vehicles` (empty string if none) |
| `cashier_id` | string | `@text` | userId of the user who created the transaction |
| `subtotal` | number | `@field` | Sum of all line item totals before VAT |
| `total_vat` | number | `@field` | Total VAT across all line items |
| `total_amount` | number | `@field` | Final amount due |
| `change_due` | number | `@field` | Cash change due to customer |
| `has_return` | boolean | `@field` | True if a Return has been processed; blocks Void |
| `original_transaction_id` | string | `@text` | Populated on `RETURNED` type transactions (empty string if not a return) |
| `void_reason` | string | `@text` | Required when status is `VOIDED` (empty string otherwise) |
| `voided_by` | string | `@text` | userId (empty string if not voided) |
| `voided_at` | number | `@field` | Unix ms timestamp (0 if not voided) |
| `return_reason` | string | `@text` | Required when status is `RETURNED` (empty string otherwise) |
| `returned_by` | string | `@text` | userId (empty string if not returned) |
| `returned_at` | number | `@field` | Unix ms timestamp (0 if not returned) |
| `created_at` | Date | `@date` | |
| `created_by` | string | `@text` | userId |
| `finalized_at` | number | `@field` | Unix ms timestamp (0 if not finalized) |
| `finalized_by` | string | `@text` | userId (empty string if not finalized) |

```typescript
tableSchema({
  name: 'transactions',
  columns: [
    { name: 'status', type: 'string', isIndexed: true },
    { name: 'customer_id', type: 'string', isOptional: true, isIndexed: true },
    { name: 'vehicle_id', type: 'string', isOptional: true, isIndexed: true },
    { name: 'cashier_id', type: 'string' },
    { name: 'subtotal', type: 'number' },
    { name: 'total_vat', type: 'number' },
    { name: 'total_amount', type: 'number' },
    { name: 'change_due', type: 'number' },
    { name: 'has_return', type: 'boolean' },
    { name: 'original_transaction_id', type: 'string', isOptional: true },
    { name: 'void_reason', type: 'string', isOptional: true },
    { name: 'voided_by', type: 'string', isOptional: true },
    { name: 'voided_at', type: 'number', isOptional: true },
    { name: 'return_reason', type: 'string', isOptional: true },
    { name: 'returned_by', type: 'string', isOptional: true },
    { name: 'returned_at', type: 'number', isOptional: true },
    { name: 'created_at', type: 'number' },
    { name: 'created_by', type: 'string' },
    { name: 'finalized_at', type: 'number', isOptional: true },
    { name: 'finalized_by', type: 'string', isOptional: true },
  ],
})
```

---

## `line_items`

Each row represents one line item in a transaction. Related to `transactions` via `transaction_id`.

| Field | Type | Decorator | Description |
|---|---|---|---|
| `transaction_id` | string | `@relation('transactions', 'transaction_id')` | Foreign key to `transactions` |
| `type` | string | `@text` | `"PRODUCT"` or `"SERVICE"` |
| `ref_id` | string | `@text` | `productId` or `serviceId` at time of add |
| `name` | string | `@text` | **Snapshot** of name at time of add |
| `unit_price` | number | `@field` | **Snapshot** of price at time of add |
| `quantity` | number | `@field` | |
| `vat_type` | string | `@text` | `"NO_VAT"`, `"VAT_EXCLUSIVE"`, `"VAT_INCLUSIVE"` |
| `discount_type` | string | `@text` | `"FIXED"`, `"PERCENTAGE"`, or empty string if none |
| `discount_value` | number | `@field` | Amount or percentage value (0 if no discount) |
| `subtotal` | number | `@field` | Computed: unit_price × quantity |
| `vat_amount` | number | `@field` | Computed based on vat_type |
| `discount_amount` | number | `@field` | Computed discount deduction |
| `total` | number | `@field` | Computed: subtotal + vat_amount − discount_amount + add-ons total |

> **Design Note**: Line items are stored as separate rows (not embedded in the transaction document) because WatermelonDB/SQLite does not support nested objects. This is not a limitation — separate rows are queryable, observable, and efficient. `name` and `unit_price` are **snapshots** to preserve historical accuracy when products are later edited. The `@children` decorator on the Transaction model exposes its line items as an Observable collection.

```typescript
tableSchema({
  name: 'line_items',
  columns: [
    { name: 'transaction_id', type: 'string', isIndexed: true },
    { name: 'type', type: 'string' },
    { name: 'ref_id', type: 'string' },
    { name: 'name', type: 'string' },
    { name: 'unit_price', type: 'number' },
    { name: 'quantity', type: 'number' },
    { name: 'vat_type', type: 'string' },
    { name: 'discount_type', type: 'string', isOptional: true },
    { name: 'discount_value', type: 'number' },
    { name: 'subtotal', type: 'number' },
    { name: 'vat_amount', type: 'number' },
    { name: 'discount_amount', type: 'number' },
    { name: 'total', type: 'number' },
  ],
})
```

---

## `line_item_add_ons`

Each row represents one add-on charge applied to a specific line item. Related to `line_items` via `line_item_id`.

| Field | Type | Decorator | Description |
|---|---|---|---|
| `line_item_id` | string | `@relation('line_items', 'line_item_id')` | Foreign key to `line_items` |
| `add_on_id` | string | `@text` | Foreign key to `add_ons` catalog; empty string if on-the-fly |
| `name` | string | `@text` | **Snapshot** of add-on name |
| `amount` | number | `@field` | **Snapshot** of add-on amount |
| `is_on_the_fly` | boolean | `@field` | True = created during transaction, not in catalog |

```typescript
tableSchema({
  name: 'line_item_add_ons',
  columns: [
    { name: 'line_item_id', type: 'string', isIndexed: true },
    { name: 'add_on_id', type: 'string', isOptional: true },
    { name: 'name', type: 'string' },
    { name: 'amount', type: 'number' },
    { name: 'is_on_the_fly', type: 'boolean' },
  ],
})
```

---

## `payments`

Each row represents one payment method entry for a transaction. A transaction may have multiple payment rows (split payments).

| Field | Type | Decorator | Description |
|---|---|---|---|
| `transaction_id` | string | `@relation('transactions', 'transaction_id')` | Foreign key to `transactions` |
| `method` | string | `@text` | `"CASH"`, `"GCASH"`, `"MAYA"` |
| `amount` | number | `@field` | Amount paid via this method |
| `reference_number` | string | `@text` | E-wallet reference number (empty string if not applicable) |
| `receipt_photo_uri` | string | `@text` | Local device file URI of optional e-wallet receipt photo (empty string if none) |

> **Design Note**: `receipt_photo_uri` stores a local filesystem URI (e.g., `file:///data/user/0/com.autoshop.pos/files/receipts/photo_123.jpg`) managed by `expo-file-system`. This replaces the previous `receiptPhotoUrl` field which was a cloud storage URL. Since this is a single-device, offline-only app, all photos are stored locally on the device.

```typescript
tableSchema({
  name: 'payments',
  columns: [
    { name: 'transaction_id', type: 'string', isIndexed: true },
    { name: 'method', type: 'string' },
    { name: 'amount', type: 'number' },
    { name: 'reference_number', type: 'string', isOptional: true },
    { name: 'receipt_photo_uri', type: 'string', isOptional: true },
  ],
})
```

---

## `audit_logs`

Append-only audit trail for all user actions.

| Field | Type | Decorator | Description |
|---|---|---|---|
| `timestamp` | Date | `@date` | When the action occurred |
| `user_id` | string | `@text` | Who performed the action |
| `user_name` | string | `@text` | **Snapshot** of display name at time of action |
| `action_type` | string | `@text` | See action types below |
| `entity_type` | string | `@text` | `"TRANSACTION"`, `"PRODUCT"`, `"SERVICE"`, `"USER"`, `"SESSION"`, `"SETTINGS"` |
| `entity_id` | string | `@text` | ID of the affected record |
| `before` | string | `@json` | JSON string of changed fields before the action (null if not applicable) |
| `after` | string | `@json` | JSON string of changed fields after the action (null if not applicable) |
| `note` | string | `@text` | Free-text reason (e.g., void/return reason, removal reason; empty string if not applicable) |

**Action types**: `LOGIN`, `LOGOUT`, `CREATE_TRANSACTION`, `FINALIZE_TRANSACTION`, `VOID_TRANSACTION`, `CANCEL_TRANSACTION`, `RETURN_TRANSACTION`, `ADD_ITEM`, `REMOVE_ITEM`, `EDIT_ITEM_QTY`, `APPLY_DISCOUNT`, `CREATE_PRODUCT`, `EDIT_PRODUCT`, `DEACTIVATE_PRODUCT`, `CREATE_SERVICE`, `EDIT_SERVICE`, `CREATE_USER`, `EDIT_USER`, `DEACTIVATE_USER`, `RESET_PIN`, `CHANGE_PIN`, `EDIT_SETTINGS`

> **Design Note — Immutability**: Without a server enforcing security rules, audit log immutability is enforced at the **application layer only**. No service function exposes an `update` or `delete` operation on `audit_logs` — the only permitted operation is `database.get('audit_logs').create(...)`. Code review must ensure this constraint is never violated. There is no technical mechanism at the SQLite level preventing a determined developer from issuing a raw `UPDATE` query, but this is considered an acceptable trade-off for a single-device, internal-use POS that has no external attack surface.
>
> **`before`/`after` scope**: These fields store only the fields that were changed (the write patch), not the full entity. For `FINALIZE_TRANSACTION` and similar high-level state changes where no field-level diff exists, `before` and `after` may be omitted (stored as null) and the `note` field used instead.

```typescript
tableSchema({
  name: 'audit_logs',
  columns: [
    { name: 'timestamp', type: 'number', isIndexed: true },
    { name: 'user_id', type: 'string', isIndexed: true },
    { name: 'user_name', type: 'string' },
    { name: 'action_type', type: 'string', isIndexed: true },
    { name: 'entity_type', type: 'string', isIndexed: true },
    { name: 'entity_id', type: 'string' },
    { name: 'before', type: 'string', isOptional: true },
    { name: 'after', type: 'string', isOptional: true },
    { name: 'note', type: 'string', isOptional: true },
  ],
})
```

---

## SQLite Indexes

WatermelonDB automatically creates a SQLite index for every column declared with `isIndexed: true` in the schema. No separate index configuration file is needed.

The following columns are marked `isIndexed: true` to support the app's primary query patterns:

| Table | Indexed Column | Query use case |
|---|---|---|
| `transactions` | `status` | List In Progress transactions; daily sales report filter |
| `transactions` | `customer_id` | Customer transaction history |
| `transactions` | `vehicle_id` | Vehicle service history |
| `line_items` | `transaction_id` | Fetch all line items for a transaction |
| `line_item_add_ons` | `line_item_id` | Fetch all add-ons for a line item |
| `payments` | `transaction_id` | Fetch all payments for a transaction |
| `vehicles` | `customer_id` | List vehicles for a customer |
| `audit_logs` | `timestamp` | Date-range filtering of audit log |
| `audit_logs` | `user_id` | Filter audit log by user |
| `audit_logs` | `action_type` | Filter audit log by action type |
| `audit_logs` | `entity_type` | Filter audit log by entity type |

> **Note on `created_at` sorting**: WatermelonDB queries can use `Q.sortBy('created_at', Q.desc)` without a dedicated index for small-to-medium datasets. If the `transactions` table grows large enough to cause noticeable sort latency, add `isIndexed: true` to the `created_at` column in a schema migration.
