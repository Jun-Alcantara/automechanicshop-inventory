# Functional Requirements - AutoShop POS

## 1. User Roles and Authentication

### 1.1 Authentication

*   **Method**: Every user logs in using a **6-digit numeric PIN** that is unique across all accounts.
*   **PIN Management**:
    *   The Main Admin sets their own PIN during first-time setup (system initialization).
    *   Any user with the **Manage Users** permission can reset another user's PIN. A user can change their own PIN at any time.
    *   PINs are stored hashed locally in the WatermelonDB SQLite database so that authentication works fully **offline**.
*   **Session Management**:
    *   A session begins when a PIN is successfully entered and ends on manual logout or after **5 minutes of inactivity** (configurable by the Main Admin).
    *   The lock screen (PIN prompt) is shown when the session expires; in-progress work (open transactions) is preserved.
    *   There is no multi-session support — only one user session is active on the terminal at a time.

### 1.2 User Roles

*   **Main Admin**:
    *   A single, pre-seeded account created during system initialization.
    *   Holds all permissions permanently. Individual permissions **cannot be removed** from this account.
    *   This account **cannot be deleted or deactivated** by anyone, including other admins.
    *   Is the only account that can grant or revoke the **Manage Users** permission on other accounts.
*   **Additional Users**:
    *   Created and managed by any user holding the **Manage Users** permission.
    *   Each user is assigned a display name, a PIN, and an explicit set of permissions (see §1.3).
    *   All permissions — including **Create Transactions** — must be explicitly assigned. No permission is granted by default.
    *   A user account can be **deactivated** (preventing login) but not deleted, preserving audit history.

### 1.3 Permission Matrix

Each permission below is individually assignable to any user account. No permission is granted by default — every permission must be explicitly assigned at account creation or by a subsequent edit.

| Permission | Description |
|---|---|
| **Manage Users** | Create, deactivate, and edit other user accounts; reset PINs. Cannot grant this permission to others (only Main Admin can). |
| **Manage Inventory** | Add, edit, and deactivate products; manage categories, suppliers, and add-on definitions; configure low-stock thresholds. |
| **Create Transactions** | Open new transactions, add items, and create new customer/vehicle records during transaction creation. |
| **Apply Discounts** | Apply fixed-amount or percentage discounts to items within a transaction. |
| **Void Transactions** | Void a finalized transaction or process a Return; must supply a reason in both cases. |
| **Cancel Transactions** | Cancel an In Progress transaction. Also governs removing individual items from an In Progress transaction; each removal is recorded in the audit log and reserved stock is immediately released. |
| **View Reports** | Access the admin reports screen (daily sales summaries, inventory status, audit logs). |
| **Manage Settings** | Configure system-wide settings (e.g., VAT defaults, inactivity timeout, receipt header, printer setup). |

> **Note:** The Main Admin permanently holds all permissions. When a user with **Manage Users** creates another user, they may assign any permissions *except* **Manage Users** itself — only the Main Admin can delegate that permission.

### 1.4 Audit Logging

*   An audit event is recorded for every action listed in the permission matrix, plus login, logout, and Return events.
*   Each audit record captures: **timestamp**, **user who performed the action**, **action type**, **affected entity** (e.g., Transaction ID, Product ID), and **before/after values** for edits.
*   Audit logs are **read-only** and cannot be deleted or modified by any user, including the Main Admin.
*   Audit logs are accessible only to users with the **View Reports** permission, via the Reports screen.

## 2. Inventory & Service Management
*   **Product Management**:
    *   **Manual Entry**: Products are added manually.
    *   **Product Fields**: Name, Barcode, Selling Price, Cost Price, Unit of Measure (e.g., piece, liter), Stock, Category, and Supplier.
    *   **Categorization**: Products are grouped into categories (e.g., Oils, Brakes, Filters).
    *   **Barcode Workflow**:
        *   Scanning a known barcode pre-fills the product's details for quick lookup or addition.
        *   **Unknown Barcode Handling**: If the scanned barcode does not match any existing product, the system displays an alert. The alert offers two options:
            1.  **Cancel**: Dismiss and do nothing.
            2.  **Create Product**: Open the "New Product" form with the scanned barcode pre-filled, allowing the user to complete the remaining details and save the product. Upon saving, the newly created product is immediately added to the current transaction (if applicable).
        *   When triggered from the **Inventory screen** (outside a transaction), the same alert is shown but the "add to transaction" step is skipped.
    *   **Supplier Tracking**: Record and track the supplier for each product.
    *   **Low Stock Alerts**: Visual indicators when a product's stock falls below its configured threshold. The threshold is set **per product** in the product edit form; requires **Manage Inventory** permission.
    *   **Negative Stock**: If a product is added to a transaction when its available stock is 0, the system displays a **non-blocking warning** ("Stock is 0. Continue anyway?"). The cashier may confirm to proceed (stock goes negative) or cancel. This is intentional — the shop may sell parts before a delivery is logged. The warning fires only at exactly 0; the low-stock visual indicator covers stock above 0.
*   **Service Management**:
    *   **Pre-defined Pricing**: Services have a standard base price.
    *   **Price Adjustments**: Prices can be modified via applied discounts or "Add-ons".
    *   **Add-ons**: A predefined catalog of sub-services/charges that can be applied to any service or product item in a transaction to increase its cost. New add-ons can be created on the fly during a transaction by any user with the **Create Transactions** permission; on-the-fly add-ons are **per-transaction only** — they are embedded in that transaction's line item record and are not saved to the catalog.
*   **Stock Reservation**: When a product is added to an "In Progress" transaction, its stock is immediately **reserved** (decremented from available inventory). Reserved stock is committed on Finalize, or released back to inventory on Cancel, Void, or Return.

## 3. Customer & Vehicle Management
*   **Customer Profiles**: Basic contact info linked to one or more vehicle records.
    *   **Walk-in Customers**: Anonymous/walk-in transactions are allowed. The transacting user must add a nickname for internal identification. Walk-in records are included in the general customer search (partial match, case-insensitive on nickname). When creating a new walk-in transaction, if the entered nickname matches an existing walk-in nickname, the system prompts the user to link to that existing record.
*   **Vehicle Records**:
    *   **Fields**: Make (required, free text), Model, Color, and Plate Number.
    *   **Service History**: Detailed log of all past transactions, services, and parts associated with the vehicle.
*   **Search Functionality**: Users can search for customers or vehicles by **Name / Nickname**, **Phone Number**, or **Plate Number** (partial match, case-insensitive). Walk-in records are included in this search by nickname.

## 4. Order & Transaction Lifecycle
*   **Concurrent Transactions**: Multiple transactions can be "In Progress" simultaneously (e.g., multiple vehicles being serviced over several days).
*   **Transaction Ownership**: Transactions are shop-owned, not user-owned. Any user with the relevant permissions may interact with any In Progress transaction regardless of who created it.
*   **Transaction Flow**:
    1.  **Create (In Progress)**: Initialize order for a customer/vehicle or a walk-in nickname. The transaction is immediately set to "In Progress". Creating a new customer or vehicle record during this step requires the **Create Transactions** permission.
    2.  **Add Items**: Add Products or Services. Adding a product immediately reserves its stock.
        *   **Item Removal**: Individual items may be removed from an In Progress transaction by a user with the **Cancel Transactions** permission. Removal is recorded as an audit event, and any reserved stock for the removed item is immediately released back to inventory. Quantity edits (increasing or decreasing the quantity of an existing line item) follow the same rule: the stock delta is applied immediately and the change is audit-logged.
    3.  **Discounts**:
        *   Applied to specific items or groups of items.
        *   **Fixed Amount**: Subtotal of selected items minus the fixed discount amount.
        *   **Percentage**: Subtotal of selected items minus the percentage discount.
        *   **Mutual Exclusivity**: Fixed Amount and Percentage discounts **cannot both be applied to the same line item**. Different line items within the same transaction may carry different discount types.
    4.  **Taxation (Philippines Standard)**:
        *   **Types**: No-VAT, VAT-Exclusive (Price + 12%), and VAT-Inclusive (Price already includes 12%).
        *   **Scope**: VAT type is set **per item/service**.
        *   **Default**: VAT-Inclusive 12%.
        *   **Automatic Calculation**: System computes tax based on each item's selected VAT type.
    5.  **Payment**:
        *   **Methods**: Cash and E-wallets (GCash, Maya).
        *   **E-Wallet Flow**: E-wallet payments occur entirely outside the app (the customer sends payment directly to the shop's GCash/Maya account). The cashier records the transaction's **reference number** and may optionally attach a photo of the digital receipt. No in-app payment processing occurs.
        *   **Split Payments**: Support for paying one transaction using multiple methods (e.g., part Cash, part GCash). When splitting:
            *   E-wallet amounts are capped at the remaining unpaid balance — they cannot exceed the outstanding amount.
            *   Change is computed on the **cash portion only**. The system displays the cash change due after all other payment method amounts have been entered.
            *   Payment entry is non-persistent across session timeouts. If the session locks mid-payment, all entered payment amounts are discarded and the cashier restarts payment entry after re-authentication.
    6.  **Finalize or Cancel**:
        *   An "In Progress" transaction can only be canceled or finalized.
        *   **Immutability**: Once finalized, a transaction **cannot be edited**.
        *   **Voiding**: To correct errors, a finalized transaction must be **Voided** by a user with the **Void Transactions** permission. The user is required to enter a "Reason" for auditing purposes. Voided transactions remain **visible** in reports and history. When voiding a transaction that was paid via split methods, the void screen displays a per-method refund breakdown (e.g., "Return ₱500 cash / Reverse ₱200 GCash") to guide the cashier. The app does not automate the e-wallet reversal — it surfaces the amounts for the cashier to action manually.
        *   **Stock Reversion**: When a transaction is voided or canceled, all reserved/committed product stock is automatically returned to inventory.
        *   **Output**: Generate and optionally print an unofficial, non-BIR-mandated receipt. **Printing is optional** — the user may skip it.
        *   **Post-Action**: Return user to the Dashboard.
*   **Returns**:
    *   A **Return** is a customer-initiated, post-finalization event and is distinct from a Void (which is an error correction). Returns are recorded as a separate transaction type referencing the original transaction ID.
    *   **Scope**: Full-transaction returns only. Partial line-item returns are out of scope for the initial release.
    *   **Authorization**: Requires the **Void Transactions** permission. The user must enter a reason.
    *   **Guard**: If a Return has already been processed against a transaction, that transaction **cannot be Voided**. The system blocks the Void and displays: "A return has already been processed for this transaction."
    *   **Stock**: All product stock from the original transaction is reversed (returned to inventory) on Return.
    *   **Refund guidance**: The return screen displays the per-method refund breakdown from the original transaction (same behavior as voiding a split-payment transaction).
    *   Returns remain visible in reports and history, reported separately from Voids.
*   **Currency & Language**:
    *   **Language**: English only.
    *   **Currency**: Philippine Peso (₱ / PHP).

## 5. Offline Capabilities & Data Synchronization
*   **Offline-First**: The app operates with full local functionality using WatermelonDB (SQLite). All data is stored on-device. There is no network dependency for any database read or write operation — the app functions identically whether the device has connectivity or not.
*   **Single Terminal**: The system operates on a single device. Multi-terminal support is out of scope for now.
*   **No Cloud Sync**: This app operates on a single device with no server backend. All data is local-only. There is no background synchronization, no conflict resolution, and no remote state to reconcile. Connectivity status has no bearing on any data operation.
*   **Atomic operations**: All writes — including stock reservation, line item creation, payment recording, and audit logging — are wrapped in WatermelonDB's `database.write()`, which maps directly to a SQLite transaction. If any step within a write block fails, the entire operation is rolled back automatically. Stock can never be decremented without a corresponding line item being created, and no transaction state change can occur without its audit entry, regardless of connectivity.

## 6. Hardware Integrations (Printers & Scanners)
*   **Target Platform**: The app runs on a **mobile phone** (Android). All hardware integration is mobile-native.
*   **Receipt Printing**:
    *   **Connection**: Bluetooth thermal printers only. Wi-Fi printers are out of scope.
    *   **Printer Setup**: The user selects and saves a paired Bluetooth printer once in the **Manage Settings** screen (requires Manage Settings permission). The app remembers the printer and reconnects automatically on subsequent sessions.
    *   **Paper Size**: **80mm** thermal paper.
    *   **Receipt Contents**: Shop name/header, date & time, transaction ID, cashier name, customer name & vehicle plate (or walk-in nickname), itemized list (product/service name, qty, unit price), subtotal, VAT breakdown, total, payment method(s) with amounts, change due. Void and return receipts include a notice referencing the original transaction ID.
    *   **Print Failure**: If the printer is unreachable at print time, the app shows a non-blocking error: *"Printer unavailable. Retry or skip?"* The user may retry or skip without affecting the transaction.
    *   **Digital Receipt Fallback**: If no printer is connected, the user is offered the option to **download the receipt as a PDF** to the device instead of printing.
*   **Barcode Scanning**:
    *   Scanning is performed using the **device camera only** via `expo-camera`'s built-in barcode scanning. External Bluetooth scanners are out of scope.
    *   Scanning is intentionally triggered by the user (tap a scan button). It is only available on screens where it is contextually applicable — accidental out-of-context scans are not a concern.
    *   **Available on three screens**:
        1.  **Transaction screen (Add Items)**: Scanning a known barcode triggers an "Add to Cart" confirmation modal; unknown barcode triggers the Unknown Barcode flow (see §2).
        2.  **Inventory screen**: Scanning a barcode looks up the product and displays its details (name, stock, price). If the barcode is unknown, the Unknown Barcode flow is triggered but the "add to transaction" step is skipped.
        3.  **New Product form**: Scanning pre-fills the barcode field.

## 7. Reporting & Analytics
*   **Dashboard View**:
    *   Key Metrics: **Total Sales Today**, **Number of Orders Today**, **Top Selling Parts**, **Low Stock Alerts**.
    *   All dashboard figures are **shop-wide** — all users see the same data regardless of who performed the transactions.
    *   **Top Selling Parts**: Top 5 products ranked by **quantity sold today**. Consistent with the "today" scope of the other dashboard metrics.
*   **Admin Reports**: View-only reports (daily sales summaries, inventory status) filterable by a selected date range. Export is out of scope for now.
