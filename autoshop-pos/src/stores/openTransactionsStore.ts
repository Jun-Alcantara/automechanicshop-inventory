import { create } from 'zustand';
import type { Subscription } from 'rxjs';
import { observeOpenTransactions } from '../services/transactionService';
import type { Transaction, TransactionStatus } from '../types';
import type { TransactionModel } from '../models/TransactionModel';

interface OpenTransactionsStore {
  transactions: Transaction[];
  loading: boolean;
  error: Error | null;
  _subscription: Subscription | null;

  subscribe: () => void;
  unsubscribe: () => void;
}

const mapTransaction = (m: TransactionModel): Transaction => ({
  id: m.id,
  status: m.status as TransactionStatus,
  customerId: m.customerId,
  vehicleId: m.vehicleId,
  cashierId: m.cashierId,
  subtotal: m.subtotal,
  totalVat: m.totalVat,
  totalAmount: m.totalAmount,
  changeDue: m.changeDue,
  hasReturn: m.hasReturn,
  originalTransactionId: m.originalTransactionId,
  voidReason: m.voidReason,
  voidedBy: m.voidedBy,
  voidedAt: m.voidedAt,
  returnReason: m.returnReason,
  returnedBy: m.returnedBy,
  returnedAt: m.returnedAt,
  createdAt: m.createdAt,
  createdBy: m.createdBy,
  finalizedAt: m.finalizedAt,
  finalizedBy: m.finalizedBy,
  lineItems: [],
  payments: [],
});

export const useOpenTransactionsStore = create<OpenTransactionsStore>((set, get) => ({
  transactions: [],
  loading: true,
  error: null,
  _subscription: null,

  subscribe: () => {
    if (get()._subscription) return;

    const sub = observeOpenTransactions().subscribe({
      next: (models) => set({ transactions: models.map(mapTransaction), loading: false }),
      error: (e) => set({ error: e, loading: false }),
    });
    set({ _subscription: sub });
  },

  unsubscribe: () => {
    get()._subscription?.unsubscribe();
    set({ _subscription: null, transactions: [], loading: true });
  },
}));
