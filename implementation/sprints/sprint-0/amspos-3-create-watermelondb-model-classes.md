# AMSPOS-3: Create WatermelonDB Model Classes

**Sprint**: Sprint 0 — Foundation Infrastructure
**Effort**: 1 day
**Dependencies**: AMSPOS-2
**Phase**: Foundation

---

## Description

Create one WatermelonDB Model class per table. Each model class uses decorators (`@text`, `@field`, `@date`, `@json`, `@relation`, `@children`) to map SQLite columns to typed JavaScript properties. Register all models in `database.ts`.

Create a `src/models/` directory for all model files.

---

## Instructions

### 1. Create `src/models/UserModel.ts`

```typescript
import { Model } from '@nozbe/watermelondb';
import { text, field, date, json } from '@nozbe/watermelondb/decorators';
import { Permission } from '../types';

const sanitizePermissions = (raw: unknown): Permission[] => {
  if (!Array.isArray(raw)) return [];
  return raw.filter((p): p is Permission => typeof p === 'string');
};

export class UserModel extends Model {
  static table = 'users';

  @text('display_name') displayName!: string;
  @text('pin_hash') pinHash!: string;
  @text('pin_salt') pinSalt!: string;
  @json('permissions', sanitizePermissions) permissions!: Permission[];
  @field('is_main_admin') isMainAdmin!: boolean;
  @field('is_active') isActive!: boolean;
  @date('created_at') createdAt!: Date;
  @text('created_by') createdBy!: string;
  @date('updated_at') updatedAt!: Date;
  @text('updated_by') updatedBy!: string;
}
```

### 2. Create remaining model files

Follow the same pattern for each table. Key decorator rules:
- `@text` → string columns
- `@field` → boolean and number columns
- `@date` → timestamp columns (stored as number, exposed as Date)
- `@json(col, sanitizer)` → JSON string columns that deserialize to typed values
- `@relation('table', 'foreign_key_col')` → belongs-to relationships
- `@children('table')` → has-many relationships (returns Observable collection)

**`src/models/CategoryModel.ts`**
```typescript
export class CategoryModel extends Model {
  static table = 'categories';
  @text('name') name!: string;
  @date('created_at') createdAt!: Date;
  @text('created_by') createdBy!: string;
}
```

**`src/models/SupplierModel.ts`**
```typescript
export class SupplierModel extends Model {
  static table = 'suppliers';
  @text('name') name!: string;
  @text('contact_info') contactInfo!: string;
  @date('created_at') createdAt!: Date;
  @text('created_by') createdBy!: string;
}
```

**`src/models/AddOnModel.ts`**
```typescript
export class AddOnModel extends Model {
  static table = 'add_ons';
  @text('name') name!: string;
  @field('amount') amount!: number;
  @field('is_active') isActive!: boolean;
  @date('created_at') createdAt!: Date;
  @text('created_by') createdBy!: string;
}
```

**`src/models/ProductModel.ts`**
```typescript
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
  @date('created_at') createdAt!: Date;
  @text('created_by') createdBy!: string;
  @date('updated_at') updatedAt!: Date;
  @text('updated_by') updatedBy!: string;
}
```

**`src/models/ServiceModel.ts`**
```typescript
export class ServiceModel extends Model {
  static table = 'services';
  @text('name') name!: string;
  @field('base_price') basePrice!: number;
  @field('is_active') isActive!: boolean;
  @date('created_at') createdAt!: Date;
  @text('created_by') createdBy!: string;
  @date('updated_at') updatedAt!: Date;
  @text('updated_by') updatedBy!: string;
}
```

**`src/models/CustomerModel.ts`**
```typescript
export class CustomerModel extends Model {
  static table = 'customers';
  @text('type') type!: 'NAMED' | 'WALKIN';
  @text('name') name!: string;
  @text('phone') phone!: string;
  @text('email') email!: string;
  @field('is_active') isActive!: boolean;
  @date('created_at') createdAt!: Date;
  @text('created_by') createdBy!: string;
}
```

**`src/models/VehicleModel.ts`**
```typescript
export class VehicleModel extends Model {
  static table = 'vehicles';
  @text('customer_id') customerId!: string;
  @text('make') make!: string;
  @text('model') model!: string;
  @text('color') color!: string;
  @text('plate_number') plateNumber!: string;
  @date('created_at') createdAt!: Date;
  @text('created_by') createdBy!: string;
}
```

**`src/models/TransactionModel.ts`**
```typescript
import { children } from '@nozbe/watermelondb/decorators';
export class TransactionModel extends Model {
  static table = 'transactions';
  static associations = {
    line_items: { type: 'has_many', foreignKey: 'transaction_id' },
    payments: { type: 'has_many', foreignKey: 'transaction_id' },
  } as const;

  @text('status') status!: string;
  @text('customer_id') customerId!: string;
  @text('vehicle_id') vehicleId!: string;
  @text('cashier_id') cashierId!: string;
  @field('subtotal') subtotal!: number;
  @field('total_vat') totalVat!: number;
  @field('total_amount') totalAmount!: number;
  @field('change_due') changeDue!: number;
  @field('has_return') hasReturn!: boolean;
  @text('original_transaction_id') originalTransactionId!: string;
  @text('void_reason') voidReason!: string;
  @text('voided_by') voidedBy!: string;
  @field('voided_at') voidedAt!: number;
  @text('return_reason') returnReason!: string;
  @text('returned_by') returnedBy!: string;
  @field('returned_at') returnedAt!: number;
  @date('created_at') createdAt!: Date;
  @text('created_by') createdBy!: string;
  @field('finalized_at') finalizedAt!: number;
  @text('finalized_by') finalizedBy!: string;

  @children('line_items') lineItems!: any;
  @children('payments') payments!: any;
}
```

**`src/models/LineItemModel.ts`**
```typescript
export class LineItemModel extends Model {
  static table = 'line_items';
  static associations = {
    transactions: { type: 'belongs_to', key: 'transaction_id' },
    line_item_add_ons: { type: 'has_many', foreignKey: 'line_item_id' },
  } as const;

  @text('transaction_id') transactionId!: string;
  @text('type') type!: 'PRODUCT' | 'SERVICE';
  @text('ref_id') refId!: string;
  @text('name') name!: string;
  @field('unit_price') unitPrice!: number;
  @field('quantity') quantity!: number;
  @text('vat_type') vatType!: string;
  @text('discount_type') discountType!: string;
  @field('discount_value') discountValue!: number;
  @field('subtotal') subtotal!: number;
  @field('vat_amount') vatAmount!: number;
  @field('discount_amount') discountAmount!: number;
  @field('total') total!: number;

  @children('line_item_add_ons') addOns!: any;
}
```

**`src/models/LineItemAddOnModel.ts`**
```typescript
export class LineItemAddOnModel extends Model {
  static table = 'line_item_add_ons';
  static associations = {
    line_items: { type: 'belongs_to', key: 'line_item_id' },
  } as const;

  @text('line_item_id') lineItemId!: string;
  @text('add_on_id') addOnId!: string;
  @text('name') name!: string;
  @field('amount') amount!: number;
  @field('is_on_the_fly') isOnTheFly!: boolean;
}
```

**`src/models/PaymentModel.ts`**
```typescript
export class PaymentModel extends Model {
  static table = 'payments';
  static associations = {
    transactions: { type: 'belongs_to', key: 'transaction_id' },
  } as const;

  @text('transaction_id') transactionId!: string;
  @text('method') method!: 'CASH' | 'GCASH' | 'MAYA';
  @field('amount') amount!: number;
  @text('reference_number') referenceNumber!: string;
  @text('receipt_photo_uri') receiptPhotoUri!: string;
}
```

**`src/models/AuditLogModel.ts`**
```typescript
export class AuditLogModel extends Model {
  static table = 'audit_logs';
  @date('timestamp') timestamp!: Date;
  @text('user_id') userId!: string;
  @text('user_name') userName!: string;
  @text('action_type') actionType!: string;
  @text('entity_type') entityType!: string;
  @text('entity_id') entityId!: string;
  @text('before') before!: string;
  @text('after') after!: string;
  @text('note') note!: string;
}
```

### 3. Create `src/models/index.ts`

```typescript
export { UserModel } from './UserModel';
export { CategoryModel } from './CategoryModel';
export { SupplierModel } from './SupplierModel';
export { AddOnModel } from './AddOnModel';
export { ProductModel } from './ProductModel';
export { ServiceModel } from './ServiceModel';
export { CustomerModel } from './CustomerModel';
export { VehicleModel } from './VehicleModel';
export { TransactionModel } from './TransactionModel';
export { LineItemModel } from './LineItemModel';
export { LineItemAddOnModel } from './LineItemAddOnModel';
export { PaymentModel } from './PaymentModel';
export { AuditLogModel } from './AuditLogModel';
```

### 4. Register models in `database.ts`

Update `src/services/database.ts` to import all models and pass them to `modelClasses`:

```typescript
import { UserModel, CategoryModel, SupplierModel, AddOnModel, ProductModel,
  ServiceModel, CustomerModel, VehicleModel, TransactionModel,
  LineItemModel, LineItemAddOnModel, PaymentModel, AuditLogModel } from '../models';

export const database = new Database({
  adapter,
  modelClasses: [
    UserModel, CategoryModel, SupplierModel, AddOnModel, ProductModel,
    ServiceModel, CustomerModel, VehicleModel, TransactionModel,
    LineItemModel, LineItemAddOnModel, PaymentModel, AuditLogModel,
  ],
});
```

---

## Acceptance Criteria

- [ ] One model class file per table (13 total) in `src/models/`
- [ ] All columns from `documents/data_model.md` are decorated on each model
- [ ] `UserModel.permissions` uses `@json` with a typed sanitizer
- [ ] `TransactionModel` has `@children` for `line_items` and `payments`
- [ ] `LineItemModel` has `@children` for `line_item_add_ons`
- [ ] All models are registered in `database.ts` `modelClasses` array
- [ ] `src/models/index.ts` re-exports all models
- [ ] No TypeScript errors

## Definition of Done

- All acceptance criteria are met
- `npx tsc --noEmit` passes
- Code committed to `main`
