import { database } from './database';
import { Q } from '@nozbe/watermelondb';
import { CategoryModel } from '../models/CategoryModel';
import { SupplierModel } from '../models/SupplierModel';
import { AddOnModel } from '../models/AddOnModel';
import { ProductModel } from '../models/ProductModel';
import type { Category, Supplier, AddOn, User } from '../types';

// ─── Mappers ──────────────────────────────────────────────────────────────────

const mapCategoryModel = (m: CategoryModel): Category => ({
  id: m.id,
  name: m.name,
  createdAt: m.createdAt,
  createdBy: m.createdBy,
});

const mapSupplierModel = (m: SupplierModel): Supplier => ({
  id: m.id,
  name: m.name,
  contactInfo: m.contactInfo,
  createdAt: m.createdAt,
  createdBy: m.createdBy,
});

const mapAddOnModel = (m: AddOnModel): AddOn => ({
  id: m.id,
  name: m.name,
  amount: m.amount,
  isActive: m.isActive,
  createdAt: m.createdAt,
  createdBy: m.createdBy,
});

// ─── Observables ─────────────────────────────────────────────────────────────

/**
 * Observable query for all categories sorted alphabetically.
 * Subscribed to by category picker components.
 */
export const observeCategories = () =>
  database
    .get<CategoryModel>('categories')
    .query(Q.sortBy('name', Q.asc))
    .observe();

/**
 * Observable query for all suppliers sorted alphabetically.
 * Subscribed to by supplier picker components.
 */
export const observeSuppliers = () =>
  database
    .get<SupplierModel>('suppliers')
    .query(Q.sortBy('name', Q.asc))
    .observe();

/**
 * Observable query for all active add-ons sorted alphabetically.
 * Subscribed to by the add-on picker on the transaction line item sheet.
 */
export const observeAddOns = () =>
  database
    .get<AddOnModel>('add_ons')
    .query(Q.where('is_active', true), Q.sortBy('name', Q.asc))
    .observe();

// ─── Categories ───────────────────────────────────────────────────────────────

/**
 * Creates a new category. No audit log (not in audit matrix).
 */
export const createCategory = async (
  name: string,
  actingUser: User
): Promise<Category> => {
  let created: Category | null = null;

  await database.write(async () => {
    const model = await database.get<CategoryModel>('categories').create((c) => {
      c.name = name;
      c.createdAt = new Date();
      c.createdBy = actingUser.id;
    });

    created = mapCategoryModel(model);
  });

  return created!;
};

/**
 * Hard-deletes a category. Throws if any active or inactive products are
 * linked to this category — the caller must reassign or deactivate those
 * products first.
 */
export const deleteCategory = async (id: string): Promise<void> => {
  const linkedProducts = await database
    .get<ProductModel>('products')
    .query(Q.where('category_id', id))
    .fetch();

  if (linkedProducts.length > 0) {
    throw new Error(
      `Cannot delete category: ${linkedProducts.length} product(s) are linked to it. ` +
        'Reassign or deactivate those products first.'
    );
  }

  const model = await database.get<CategoryModel>('categories').find(id);

  await database.write(async () => {
    await model.destroyPermanently();
  });
};

// ─── Suppliers ────────────────────────────────────────────────────────────────

/**
 * Creates a new supplier. No audit log (not in audit matrix).
 */
export const createSupplier = async (
  input: { name: string; contactInfo: string },
  actingUser: User
): Promise<Supplier> => {
  let created: Supplier | null = null;

  await database.write(async () => {
    const model = await database.get<SupplierModel>('suppliers').create((s) => {
      s.name = input.name;
      s.contactInfo = input.contactInfo;
      s.createdAt = new Date();
      s.createdBy = actingUser.id;
    });

    created = mapSupplierModel(model);
  });

  return created!;
};

/**
 * Applies a partial patch to an existing supplier. No audit log (not in audit matrix).
 */
export const updateSupplier = async (
  id: string,
  patch: { name?: string; contactInfo?: string },
  actingUser: User
): Promise<void> => {
  const model = await database.get<SupplierModel>('suppliers').find(id);

  await database.write(async () => {
    await model.update((s) => {
      if (patch.name !== undefined) {
        s.name = patch.name;
      }
      if (patch.contactInfo !== undefined) {
        s.contactInfo = patch.contactInfo;
      }
    });
  });
};

// ─── Add-Ons ──────────────────────────────────────────────────────────────────

/**
 * Creates a new add-on. No audit log (not in audit matrix).
 */
export const createAddOn = async (
  input: { name: string; amount: number },
  actingUser: User
): Promise<AddOn> => {
  let created: AddOn | null = null;

  await database.write(async () => {
    const model = await database.get<AddOnModel>('add_ons').create((a) => {
      a.name = input.name;
      a.amount = input.amount;
      a.isActive = true;
      a.createdAt = new Date();
      a.createdBy = actingUser.id;
    });

    created = mapAddOnModel(model);
  });

  return created!;
};

/**
 * Applies a partial patch to an existing add-on. No audit log (not in audit matrix).
 */
export const updateAddOn = async (
  id: string,
  patch: { name?: string; amount?: number },
  actingUser: User
): Promise<void> => {
  const model = await database.get<AddOnModel>('add_ons').find(id);

  await database.write(async () => {
    await model.update((a) => {
      if (patch.name !== undefined) {
        a.name = patch.name;
      }
      if (patch.amount !== undefined) {
        a.amount = patch.amount;
      }
    });
  });
};

/**
 * Soft-deletes an add-on by setting isActive to false.
 * No audit log (not in audit matrix).
 */
export const deactivateAddOn = async (
  id: string,
  actingUser: User
): Promise<void> => {
  const model = await database.get<AddOnModel>('add_ons').find(id);

  await database.write(async () => {
    await model.update((a) => {
      a.isActive = false;
    });
  });
};
