import { database } from './database';
import { Q } from '@nozbe/watermelondb';
import type { Customer, User } from '../types';
import { CustomerModel } from '../models/CustomerModel';

interface CreateCustomerInput {
  type: 'NAMED' | 'WALKIN';
  name: string;
  phone?: string;
  email?: string;
}

// ─── Mapper ───────────────────────────────────────────────────────────────────

const mapCustomerModel = (m: CustomerModel): Customer => ({
  id: m.id,
  type: m.type,
  name: m.name,
  phone: m.phone,
  email: m.email,
  isActive: m.isActive,
  createdAt: m.createdAt,
  createdBy: m.createdBy,
});

// ─── Observables ─────────────────────────────────────────────────────────────

/**
 * Observable query for all active customers sorted by name ascending.
 * Subscribed to by the customer picker on the new transaction screen.
 */
export const observeCustomers = () =>
  database.get<CustomerModel>('customers')
    .query(Q.where('is_active', true), Q.sortBy('name', Q.asc))
    .observe();

// ─── Reads ────────────────────────────────────────────────────────────────────

/**
 * Returns customers whose name or phone contains the given query string
 * (case-insensitive partial match). Uses Q.sanitizeLikeString to escape
 * special LIKE characters and prevent SQL injection.
 */
export const searchCustomers = async (query: string): Promise<Customer[]> => {
  const sanitized = Q.sanitizeLikeString(query);
  const models = await database.get<CustomerModel>('customers')
    .query(
      Q.where('is_active', true),
      Q.or(
        Q.where('name', Q.like(`%${sanitized}%`)),
        Q.where('phone', Q.like(`%${sanitized}%`))
      )
    )
    .fetch();
  return models.map(mapCustomerModel);
};

// ─── Writes ───────────────────────────────────────────────────────────────────

/**
 * Creates a customer record and writes a CREATE_CUSTOMER audit log entry
 * in the same atomic write block.
 */
export const createCustomer = async (
  input: CreateCustomerInput,
  actingUser: User
): Promise<Customer> => {
  let created: Customer | null = null;

  await database.write(async () => {
    const model = await database.get<CustomerModel>('customers').create((c) => {
      c.type = input.type;
      c.name = input.name;
      c.phone = input.phone ?? '';
      c.email = input.email ?? '';
      c.isActive = true;
      c.createdAt = new Date();
      c.createdBy = actingUser.id;
    });

    await database.get('audit_logs').create((log: any) => {
      log.timestamp = new Date();
      log.userId = actingUser.id;
      log.userName = actingUser.displayName;
      log.actionType = 'CREATE_CUSTOMER';
      log.entityType = 'CUSTOMER';
      log.entityId = model.id;
      log.before = '';
      log.after = JSON.stringify({ name: input.name, type: input.type });
      log.note = '';
    });

    created = mapCustomerModel(model);
  });

  return created!;
};

/**
 * Applies a partial patch to a customer and writes an EDIT_CUSTOMER audit log
 * entry with before/after values in the same atomic write block.
 */
export const updateCustomer = async (
  id: string,
  patch: Partial<CreateCustomerInput>,
  actingUser: User
): Promise<void> => {
  const model = await database.get<CustomerModel>('customers').find(id);

  await database.write(async () => {
    const before: Record<string, unknown> = {};
    const after: Record<string, unknown> = {};

    await model.update((c) => {
      if (patch.name !== undefined) {
        before.name = c.name;
        after.name = patch.name;
        c.name = patch.name;
      }
      if (patch.phone !== undefined) {
        before.phone = c.phone;
        after.phone = patch.phone;
        c.phone = patch.phone;
      }
      if (patch.email !== undefined) {
        before.email = c.email;
        after.email = patch.email;
        c.email = patch.email;
      }
    });

    await database.get('audit_logs').create((log: any) => {
      log.timestamp = new Date();
      log.userId = actingUser.id;
      log.userName = actingUser.displayName;
      log.actionType = 'EDIT_CUSTOMER';
      log.entityType = 'CUSTOMER';
      log.entityId = id;
      log.before = JSON.stringify(before);
      log.after = JSON.stringify(after);
      log.note = '';
    });
  });
};
