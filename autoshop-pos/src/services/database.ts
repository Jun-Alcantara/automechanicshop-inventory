import { Database } from '@nozbe/watermelondb';
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite';
import { schema } from './schema';
import { migrations } from './migrations';
import {
  UserModel, CategoryModel, SupplierModel, AddOnModel, ProductModel,
  ServiceModel, CustomerModel, VehicleModel, TransactionModel,
  LineItemModel, LineItemAddOnModel, PaymentModel, AuditLogModel,
} from '../models';

const adapter = new SQLiteAdapter({
  schema,
  migrations,
  jsi: true,
  onSetUpError: (error) => {
    console.error('WatermelonDB setup error:', error);
  },
});

export const database = new Database({
  adapter,
  modelClasses: [
    UserModel, CategoryModel, SupplierModel, AddOnModel, ProductModel,
    ServiceModel, CustomerModel, VehicleModel, TransactionModel,
    LineItemModel, LineItemAddOnModel, PaymentModel, AuditLogModel,
  ],
});
