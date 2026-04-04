import { create } from 'zustand';

interface TransactionDraftStore {
  draft: null; // will be typed as Transaction | null in AMSPOS-44
  openDraft: (transactionId: string) => Promise<void>;
  addLineItem: (item: unknown) => Promise<void>;
  removeLineItem: (lineItemId: string) => Promise<void>;
  updateLineItemQty: (lineItemId: string, qty: number) => Promise<void>;
  applyDiscount: (lineItemId: string, type: 'FIXED' | 'PERCENTAGE', value: number) => Promise<void>;
  removeDiscount: (lineItemId: string) => Promise<void>;
  applyAddOn: (lineItemId: string, addOn: unknown) => Promise<void>;
  removeAddOn: (lineItemId: string, addOnId: string) => Promise<void>;
  clearDraft: () => void;
}

export const useTransactionDraftStore = create<TransactionDraftStore>((set) => ({
  draft: null,
  openDraft: async (_id) => {},
  addLineItem: async (_item) => {},
  removeLineItem: async (_id) => {},
  updateLineItemQty: async (_id, _qty) => {},
  applyDiscount: async (_id, _type, _value) => {},
  removeDiscount: async (_id) => {},
  applyAddOn: async (_id, _addOn) => {},
  removeAddOn: async (_id, _addOnId) => {},
  clearDraft: () => set({ draft: null }),
}));
