import { Permission } from '@constants/permissions';
import { TransactionStatus } from '@constants/transactionStatus';
import { VatType } from '@constants/vatTypes';

export type { Permission } from '@constants/permissions';
export type { TransactionStatus } from '@constants/transactionStatus';
export type { VatType } from '@constants/vatTypes';

// ─── Users ───────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  displayName: string;
  pinHash: string;
  pinSalt: string;
  permissions: Permission[];
  isMainAdmin: boolean;
  isActive: boolean;
  createdAt: Date;
  createdBy: string;
  updatedAt: Date;
  updatedBy: string;
}

// ─── Catalog ─────────────────────────────────────────────────────────────────

export interface Category {
  id: string;
  name: string;
  createdAt: Date;
  createdBy: string;
}

export interface Supplier {
  id: string;
  name: string;
  contactInfo: string;
  createdAt: Date;
  createdBy: string;
}

export interface AddOn {
  id: string;
  name: string;
  amount: number;
  isActive: boolean;
  createdAt: Date;
  createdBy: string;
}

// ─── Inventory ───────────────────────────────────────────────────────────────

export interface Product {
  id: string;
  name: string;
  barcode: string;
  sellingPrice: number;
  costPrice: number;
  unitOfMeasure: string;
  stockAvailable: number;
  stockReserved: number;
  lowStockThreshold: number;
  categoryId: string;
  supplierId: string;
  isActive: boolean;
  createdAt: Date;
  createdBy: string;
  updatedAt: Date;
  updatedBy: string;
}

export interface ServiceItem {
  id: string;
  name: string;
  basePrice: number;
  isActive: boolean;
  createdAt: Date;
  createdBy: string;
  updatedAt: Date;
  updatedBy: string;
}

// ─── Customers ───────────────────────────────────────────────────────────────

export type CustomerType = 'NAMED' | 'WALKIN';

export interface Customer {
  id: string;
  type: CustomerType;
  name: string;
  phone: string;
  email: string;
  isActive: boolean;
  createdAt: Date;
  createdBy: string;
}

export interface Vehicle {
  id: string;
  customerId: string;
  make: string;
  model: string;
  color: string;
  plateNumber: string;
  createdAt: Date;
  createdBy: string;
}

// ─── Transactions ─────────────────────────────────────────────────────────────

export type PaymentMethod = 'CASH' | 'GCASH' | 'MAYA';
export type LineItemType = 'PRODUCT' | 'SERVICE';
export type DiscountType = 'FIXED' | 'PERCENTAGE';

export interface LineItemAddOn {
  id: string;
  lineItemId: string;
  addOnId: string;
  name: string;
  amount: number;
  isOnTheFly: boolean;
}

export interface LineItem {
  id: string;
  transactionId: string;
  type: LineItemType;
  refId: string;
  name: string;
  unitPrice: number;
  quantity: number;
  vatType: VatType;
  discountType: string;
  discountValue: number;
  subtotal: number;
  vatAmount: number;
  discountAmount: number;
  total: number;
  addOns: LineItemAddOn[];
}

export interface Payment {
  id: string;
  transactionId: string;
  method: PaymentMethod;
  amount: number;
  referenceNumber: string;
  receiptPhotoUri: string;
}

export interface Transaction {
  id: string;
  status: TransactionStatus;
  customerId: string;
  vehicleId: string;
  cashierId: string;
  subtotal: number;
  totalVat: number;
  totalAmount: number;
  changeDue: number;
  hasReturn: boolean;
  originalTransactionId: string;
  voidReason: string;
  voidedBy: string;
  voidedAt: number;
  returnReason: string;
  returnedBy: string;
  returnedAt: number;
  createdAt: Date;
  createdBy: string;
  finalizedAt: number;
  finalizedBy: string;
  lineItems: LineItem[];
  payments: Payment[];
}

// ─── Settings ────────────────────────────────────────────────────────────────

export interface AppSettings {
  defaultVatType: VatType;
  inactivityTimeoutMinutes: number;
  receiptHeader: string;
  printerDeviceId: string;
}

// ─── Audit ───────────────────────────────────────────────────────────────────

export type AuditEntityType = 'TRANSACTION' | 'PRODUCT' | 'SERVICE' | 'USER' | 'SESSION' | 'SETTINGS';

export type AuditActionType =
  | 'LOGIN' | 'LOGOUT'
  | 'CREATE_TRANSACTION' | 'FINALIZE_TRANSACTION' | 'VOID_TRANSACTION'
  | 'CANCEL_TRANSACTION' | 'RETURN_TRANSACTION'
  | 'ADD_ITEM' | 'REMOVE_ITEM' | 'EDIT_ITEM_QTY'
  | 'APPLY_DISCOUNT'
  | 'CREATE_PRODUCT' | 'EDIT_PRODUCT' | 'DEACTIVATE_PRODUCT'
  | 'CREATE_SERVICE' | 'EDIT_SERVICE'
  | 'CREATE_USER' | 'EDIT_USER' | 'DEACTIVATE_USER' | 'RESET_PIN' | 'CHANGE_PIN'
  | 'EDIT_SETTINGS';

export interface AuditLog {
  id: string;
  timestamp: Date;
  userId: string;
  userName: string;
  actionType: AuditActionType;
  entityType: AuditEntityType;
  entityId: string;
  before: string;
  after: string;
  note: string;
}

// ─── Input types (for service function parameters) ───────────────────────────

export interface AddOnInput {
  addOnId: string;
  name: string;
  amount: number;
  isOnTheFly: boolean;
}

export interface PaymentInput {
  method: PaymentMethod;
  amount: number;
  referenceNumber?: string;
  receiptPhotoUri?: string;
}
