import { create } from 'zustand';
import { database } from '../services/database';
import { Q } from '@nozbe/watermelondb';
import {
  addLineItem as svcAddLineItem,
  removeLineItem as svcRemoveLineItem,
  updateLineItemQty as svcUpdateLineItemQty,
  applyDiscount as svcApplyDiscount,
  removeDiscount as svcRemoveDiscount,
  applyAddOn as svcApplyAddOn,
  removeAddOn as svcRemoveAddOn,
} from '../services/transactionService';
import type { Transaction, LineItem, Product, ServiceItem, User, AddOnInput, TransactionStatus, VatType } from '../types';
import type { TransactionModel } from '../models/TransactionModel';
import type { LineItemModel } from '../models/LineItemModel';

interface TransactionDraftStore {
  draft: Transaction | null;
  lineItems: LineItem[];
  loading: boolean;

  openDraft: (transactionId: string) => Promise<void>;
  refreshDraft: (transactionId: string) => Promise<void>;
  addLineItem: (transactionId: string, item: Product | ServiceItem, quantity: number, actingUser: User) => Promise<void>;
  removeLineItem: (lineItemId: string, transactionId: string, actingUser: User) => Promise<void>;
  updateLineItemQty: (lineItemId: string, transactionId: string, qty: number, actingUser: User) => Promise<void>;
  applyDiscount: (lineItemId: string, transactionId: string, type: 'FIXED' | 'PERCENTAGE', value: number, actingUser: User) => Promise<void>;
  removeDiscount: (lineItemId: string, transactionId: string, actingUser: User) => Promise<void>;
  applyAddOn: (lineItemId: string, transactionId: string, input: AddOnInput, actingUser: User) => Promise<void>;
  removeAddOn: (addOnId: string, lineItemId: string, transactionId: string, actingUser: User) => Promise<void>;
  clearDraft: () => void;
}

const fetchDraftData = async (transactionId: string): Promise<{ draft: Transaction; lineItems: LineItem[] }> => {
  const txModel = await database.get<TransactionModel>('transactions').find(transactionId);
  const liModels = await database.get<LineItemModel>('line_items')
    .query(Q.where('transaction_id', transactionId))
    .fetch();

  const draft: Transaction = {
    id: txModel.id,
    status: txModel.status as TransactionStatus,
    customerId: txModel.customerId,
    vehicleId: txModel.vehicleId,
    cashierId: txModel.cashierId,
    subtotal: txModel.subtotal,
    totalVat: txModel.totalVat,
    totalAmount: txModel.totalAmount,
    changeDue: txModel.changeDue,
    hasReturn: txModel.hasReturn,
    originalTransactionId: txModel.originalTransactionId,
    voidReason: txModel.voidReason,
    voidedBy: txModel.voidedBy,
    voidedAt: txModel.voidedAt,
    returnReason: txModel.returnReason,
    returnedBy: txModel.returnedBy,
    returnedAt: txModel.returnedAt,
    createdAt: txModel.createdAt,
    createdBy: txModel.createdBy,
    finalizedAt: txModel.finalizedAt,
    finalizedBy: txModel.finalizedBy,
    lineItems: [],
    payments: [],
  };

  const lineItems: LineItem[] = liModels.map((li) => ({
    id: li.id,
    transactionId: li.transactionId,
    type: li.type,
    refId: li.refId,
    name: li.name,
    unitPrice: li.unitPrice,
    quantity: li.quantity,
    vatType: li.vatType as VatType,
    discountType: li.discountType,
    discountValue: li.discountValue,
    subtotal: li.subtotal,
    vatAmount: li.vatAmount,
    discountAmount: li.discountAmount,
    total: li.total,
    addOns: [],
  }));

  return { draft, lineItems };
};

export const useTransactionDraftStore = create<TransactionDraftStore>((set) => ({
  draft: null,
  lineItems: [],
  loading: false,

  openDraft: async (transactionId) => {
    set({ loading: true });
    const { draft, lineItems } = await fetchDraftData(transactionId);
    set({ draft, lineItems, loading: false });
  },

  refreshDraft: async (transactionId) => {
    const { draft, lineItems } = await fetchDraftData(transactionId);
    set({ draft, lineItems });
  },

  addLineItem: async (transactionId, item, quantity, actingUser) => {
    await svcAddLineItem(transactionId, item, quantity, actingUser);
    const { draft, lineItems } = await fetchDraftData(transactionId);
    set({ draft, lineItems });
  },

  removeLineItem: async (lineItemId, transactionId, actingUser) => {
    await svcRemoveLineItem(lineItemId, actingUser);
    const { draft, lineItems } = await fetchDraftData(transactionId);
    set({ draft, lineItems });
  },

  updateLineItemQty: async (lineItemId, transactionId, qty, actingUser) => {
    await svcUpdateLineItemQty(lineItemId, qty, actingUser);
    const { draft, lineItems } = await fetchDraftData(transactionId);
    set({ draft, lineItems });
  },

  applyDiscount: async (lineItemId, transactionId, type, value, actingUser) => {
    await svcApplyDiscount(lineItemId, type, value, actingUser);
    const { draft, lineItems } = await fetchDraftData(transactionId);
    set({ draft, lineItems });
  },

  removeDiscount: async (lineItemId, transactionId, actingUser) => {
    await svcRemoveDiscount(lineItemId, actingUser);
    const { draft, lineItems } = await fetchDraftData(transactionId);
    set({ draft, lineItems });
  },

  applyAddOn: async (lineItemId, transactionId, input, actingUser) => {
    await svcApplyAddOn(lineItemId, input, actingUser);
    const { draft, lineItems } = await fetchDraftData(transactionId);
    set({ draft, lineItems });
  },

  removeAddOn: async (addOnId, lineItemId, transactionId, actingUser) => {
    await svcRemoveAddOn(addOnId, lineItemId, actingUser);
    const { draft, lineItems } = await fetchDraftData(transactionId);
    set({ draft, lineItems });
  },

  clearDraft: () => set({ draft: null, lineItems: [], loading: false }),
}));
