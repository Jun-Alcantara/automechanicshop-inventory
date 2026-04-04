# AMSPOS-33: Create productService

**Sprint**: Sprint 5 — Inventory, Customer & Transaction Services
**Effort**: 1 day
**Dependencies**: AMSPOS-3, AMSPOS-8
**Phase**: Inventory

---

## Description

Create `src/services/productService.ts` with observable queries, reads, and writes for the `products` table. Provides a reactive low-stock observable for dashboard alerting, barcode and ID lookups for the POS cart, and full CRUD with soft-delete. All writes are atomic with their audit log entries using a single `database.write()` block per operation.

---

## Instructions

### 1. `src/services/productService.ts`

```typescript
import { database } from './database';
import { Q } from '@nozbe/watermelondb';
import { ProductModel } from '../models/ProductModel';
import { appendAuditLog } from './auditService';
import { VatType } from '../constants/vatTypes';
import type { Product, User } from '../types';

// ─── Mapper ───────────────────────────────────────────────────────────────────

const mapProductModel = (m: ProductModel): Product => ({
  id: m.id,
  name: m.name,
  barcode: m.barcode,
  sellingPrice: m.sellingPrice,
  costPrice: m.costPrice,
  unitOfMeasure: m.unitOfMeasure,
  stockAvailable: m.stockAvailable,
  stockReserved: m.stockReserved,
  lowStockThreshold: m.lowStockThreshold,
  categoryId: m.categoryId,
  supplierId: m.supplierId,
  isActive: m.isActive,
  createdAt: m.createdAt,
  createdBy: m.createdBy,
  updatedAt: m.updatedAt,
  updatedBy: m.updatedBy,
});

// ─── Input Types ──────────────────────────────────────────────────────────────

interface CreateProductInput {
  name: string;
  barcode: string;
  sellingPrice: number;
  costPrice: number;
  unitOfMeasure: string;
  stockAvailable: number;
  lowStockThreshold: number;
  categoryId: string;
  supplierId: string;
  vatType: VatType;
}

// ─── Observables ─────────────────────────────────────────────────────────────

/**
 * Observable query for all active products sorted alphabetically.
 * Subscribed to by useInventoryStore for the product list screen.
 */
export const observeProducts = () =>
  database
    .get<ProductModel>('products')
    .query(Q.where('is_active', true), Q.sortBy('name', Q.asc))
    .observe();

/**
 * Observable query for active products where stock_available is at or
 * below the product's own low_stock_threshold.
 * Subscribed to by the dashboard low-stock alert widget.
 */
export const observeLowStockProducts = () =>
  database
    .get<ProductModel>('products')
    .query(
      Q.where('is_active', true),
      Q.where('stock_available', Q.lte(Q.column('low_stock_threshold')))
    )
    .observe();

// ─── Reads ────────────────────────────────────────────────────────────────────

/**
 * Returns the product matching the given barcode, or null if not found.
 * Used by the barcode scanner during a POS transaction.
 */
export const getProductByBarcode = async (barcode: string): Promise<Product | null> => {
  const results = await database
    .get<ProductModel>('products')
    .query(Q.where('barcode', barcode), Q.where('is_active', true))
    .fetch();

  return results.length > 0 ? mapProductModel(results[0]) : null;
};

/**
 * Returns the product with the given ID, or null if not found.
 * Used when navigating to a product detail/edit screen.
 */
export const getProductById = async (id: string): Promise<Product | null> => {
  try {
    const model = await database.get<ProductModel>('products').find(id);
    return mapProductModel(model);
  } catch {
    return null;
  }
};

// ─── Writes ───────────────────────────────────────────────────────────────────

/**
 * Creates a new product and appends a CREATE_PRODUCT audit log entry
 * in the same atomic write block.
 */
export const createProduct = async (
  input: CreateProductInput,
  actingUser: User
): Promise<Product> => {
  let created: Product | null = null;

  await database.write(async () => {
    const model = await database.get<ProductModel>('products').create((p) => {
      p.name = input.name;
      p.barcode = input.barcode;
      p.sellingPrice = input.sellingPrice;
      p.costPrice = input.costPrice;
      p.unitOfMeasure = input.unitOfMeasure;
      p.stockAvailable = input.stockAvailable;
      p.stockReserved = 0;
      p.lowStockThreshold = input.lowStockThreshold;
      p.categoryId = input.categoryId;
      p.supplierId = input.supplierId;
      p.isActive = true;
      p.createdAt = new Date();
      p.createdBy = actingUser.id;
      p.updatedAt = new Date();
      p.updatedBy = actingUser.id;
    });

    await appendAuditLog({
      userId: actingUser.id,
      userName: actingUser.displayName,
      actionType: 'CREATE_PRODUCT',
      entityType: 'PRODUCT',
      entityId: model.id,
      after: {
        name: input.name,
        barcode: input.barcode,
        sellingPrice: input.sellingPrice,
        costPrice: input.costPrice,
        unitOfMeasure: input.unitOfMeasure,
        stockAvailable: input.stockAvailable,
        lowStockThreshold: input.lowStockThreshold,
        categoryId: input.categoryId,
        supplierId: input.supplierId,
        vatType: input.vatType,
      },
    });

    created = mapProductModel(model);
  });

  return created!;
};

/**
 * Applies a partial patch to an existing product and appends an EDIT_PRODUCT
 * audit log entry capturing the before and after values of changed fields.
 */
export const updateProduct = async (
  productId: string,
  patch: Partial<CreateProductInput>,
  actingUser: User
): Promise<void> => {
  const model = await database.get<ProductModel>('products').find(productId);

  await database.write(async () => {
    const before: Record<string, unknown> = {};
    const after: Record<string, unknown> = {};

    await model.update((p) => {
      if (patch.name !== undefined) {
        before.name = p.name;
        after.name = patch.name;
        p.name = patch.name;
      }
      if (patch.barcode !== undefined) {
        before.barcode = p.barcode;
        after.barcode = patch.barcode;
        p.barcode = patch.barcode;
      }
      if (patch.sellingPrice !== undefined) {
        before.sellingPrice = p.sellingPrice;
        after.sellingPrice = patch.sellingPrice;
        p.sellingPrice = patch.sellingPrice;
      }
      if (patch.costPrice !== undefined) {
        before.costPrice = p.costPrice;
        after.costPrice = patch.costPrice;
        p.costPrice = patch.costPrice;
      }
      if (patch.unitOfMeasure !== undefined) {
        before.unitOfMeasure = p.unitOfMeasure;
        after.unitOfMeasure = patch.unitOfMeasure;
        p.unitOfMeasure = patch.unitOfMeasure;
      }
      if (patch.stockAvailable !== undefined) {
        before.stockAvailable = p.stockAvailable;
        after.stockAvailable = patch.stockAvailable;
        p.stockAvailable = patch.stockAvailable;
      }
      if (patch.lowStockThreshold !== undefined) {
        before.lowStockThreshold = p.lowStockThreshold;
        after.lowStockThreshold = patch.lowStockThreshold;
        p.lowStockThreshold = patch.lowStockThreshold;
      }
      if (patch.categoryId !== undefined) {
        before.categoryId = p.categoryId;
        after.categoryId = patch.categoryId;
        p.categoryId = patch.categoryId;
      }
      if (patch.supplierId !== undefined) {
        before.supplierId = p.supplierId;
        after.supplierId = patch.supplierId;
        p.supplierId = patch.supplierId;
      }
      p.updatedAt = new Date();
      p.updatedBy = actingUser.id;
    });

    await appendAuditLog({
      userId: actingUser.id,
      userName: actingUser.displayName,
      actionType: 'EDIT_PRODUCT',
      entityType: 'PRODUCT',
      entityId: productId,
      before,
      after,
    });
  });
};

/**
 * Soft-deletes a product by setting isActive to false and appends a
 * DEACTIVATE_PRODUCT audit log entry in the same atomic write block.
 */
export const deactivateProduct = async (
  productId: string,
  actingUser: User
): Promise<void> => {
  const model = await database.get<ProductModel>('products').find(productId);

  await database.write(async () => {
    await model.update((p) => {
      p.isActive = false;
      p.updatedAt = new Date();
      p.updatedBy = actingUser.id;
    });

    await appendAuditLog({
      userId: actingUser.id,
      userName: actingUser.displayName,
      actionType: 'DEACTIVATE_PRODUCT',
      entityType: 'PRODUCT',
      entityId: productId,
    });
  });
};
```

---

## Acceptance Criteria

- [ ] `observeProducts()` returns a WatermelonDB Observable scoped to `is_active = true`, sorted by name ascending
- [ ] `observeLowStockProducts()` returns an Observable filtered by `is_active = true` and `stock_available <= low_stock_threshold`
- [ ] `getProductByBarcode` returns a mapped `Product` or `null`; only searches active products
- [ ] `getProductById` returns a mapped `Product` or `null`; uses try/catch around `.find()`
- [ ] `createProduct` sets `stockReserved = 0` on creation, writes product and `CREATE_PRODUCT` audit log in a single `database.write()` block
- [ ] `updateProduct` records before/after values for every changed field in the audit log
- [ ] `deactivateProduct` sets `isActive = false` and writes a `DEACTIVATE_PRODUCT` audit log entry atomically
- [ ] All writes use `appendAuditLog` (not `logEvent`) so they share the caller's `database.write()` transaction
- [ ] `mapProductModel` maps all `ProductModel` fields to the plain `Product` interface
- [ ] No TypeScript errors

## Definition of Done

- All acceptance criteria are met
- `npx tsc --noEmit` passes
- Code committed to `main`
