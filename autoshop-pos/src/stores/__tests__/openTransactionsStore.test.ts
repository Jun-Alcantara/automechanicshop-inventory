import { Subject } from 'rxjs';
import { useOpenTransactionsStore } from '../openTransactionsStore';

// ─── Mocks ────────────────────────────────────────────────────────────────────

jest.mock('../../services/transactionService', () => ({
  observeOpenTransactions: jest.fn(),
}));

import { observeOpenTransactions } from '../../services/transactionService';

const mockObserveOpenTransactions = observeOpenTransactions as jest.Mock;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeTransactionModel(overrides: Record<string, unknown> = {}) {
  return {
    id: 'tx-1',
    status: 'IN_PROGRESS',
    customerId: 'cust-1',
    vehicleId: 'veh-1',
    cashierId: 'user-1',
    subtotal: 1000,
    totalVat: 120,
    totalAmount: 1120,
    changeDue: 0,
    hasReturn: false,
    originalTransactionId: '',
    voidReason: '',
    voidedBy: '',
    voidedAt: 0,
    returnReason: '',
    returnedBy: '',
    returnedAt: 0,
    createdAt: new Date('2024-01-01'),
    createdBy: 'user-1',
    finalizedAt: 0,
    finalizedBy: '',
    ...overrides,
  };
}

function resetStore() {
  useOpenTransactionsStore.setState({
    transactions: [],
    loading: true,
    error: null,
    _subscription: null,
  });
}

// ─── subscribe ────────────────────────────────────────────────────────────────

describe('subscribe', () => {
  let subject: Subject<any[]>;

  beforeEach(() => {
    jest.clearAllMocks();
    resetStore();
    subject = new Subject();
    mockObserveOpenTransactions.mockReturnValue(subject.asObservable());
  });

  afterEach(() => {
    useOpenTransactionsStore.getState().unsubscribe();
  });

  it('populates transactions when observable emits', () => {
    useOpenTransactionsStore.getState().subscribe();

    subject.next([makeTransactionModel()]);

    const { transactions } = useOpenTransactionsStore.getState();
    expect(transactions).toHaveLength(1);
    expect(transactions[0]).toMatchObject({
      id: 'tx-1',
      status: 'IN_PROGRESS',
      customerId: 'cust-1',
      cashierId: 'user-1',
    });
  });

  it('starts with loading true and sets loading false after first emission', () => {
    useOpenTransactionsStore.getState().subscribe();
    expect(useOpenTransactionsStore.getState().loading).toBe(true);

    subject.next([makeTransactionModel()]);

    expect(useOpenTransactionsStore.getState().loading).toBe(false);
  });

  it('sets error and loading false when observable errors', () => {
    useOpenTransactionsStore.getState().subscribe();

    const err = new Error('DB failure');
    subject.error(err);

    const state = useOpenTransactionsStore.getState();
    expect(state.error).toBe(err);
    expect(state.loading).toBe(false);
  });

  it('does not double-subscribe when called twice', () => {
    useOpenTransactionsStore.getState().subscribe();
    useOpenTransactionsStore.getState().subscribe();

    expect(mockObserveOpenTransactions).toHaveBeenCalledTimes(1);
  });

  it('stores subscription reference after subscribing', () => {
    useOpenTransactionsStore.getState().subscribe();
    expect(useOpenTransactionsStore.getState()._subscription).not.toBeNull();
  });

  it('maps all Transaction fields correctly', () => {
    useOpenTransactionsStore.getState().subscribe();

    const model = makeTransactionModel();
    subject.next([model]);

    const tx = useOpenTransactionsStore.getState().transactions[0]!;
    expect(tx.id).toBe(model.id);
    expect(tx.status).toBe(model.status);
    expect(tx.customerId).toBe(model.customerId);
    expect(tx.vehicleId).toBe(model.vehicleId);
    expect(tx.cashierId).toBe(model.cashierId);
    expect(tx.subtotal).toBe(model.subtotal);
    expect(tx.totalVat).toBe(model.totalVat);
    expect(tx.totalAmount).toBe(model.totalAmount);
    expect(tx.changeDue).toBe(model.changeDue);
    expect(tx.hasReturn).toBe(model.hasReturn);
    expect(tx.createdAt).toBe(model.createdAt);
    expect(tx.createdBy).toBe(model.createdBy);
    expect(tx.lineItems).toEqual([]);
    expect(tx.payments).toEqual([]);
  });

  it('reflects multiple transactions from a single emission', () => {
    useOpenTransactionsStore.getState().subscribe();

    subject.next([
      makeTransactionModel({ id: 'tx-1' }),
      makeTransactionModel({ id: 'tx-2' }),
    ]);

    expect(useOpenTransactionsStore.getState().transactions).toHaveLength(2);
  });
});

// ─── unsubscribe ──────────────────────────────────────────────────────────────

describe('unsubscribe', () => {
  let subject: Subject<any[]>;

  beforeEach(() => {
    jest.clearAllMocks();
    resetStore();
    subject = new Subject();
    mockObserveOpenTransactions.mockReturnValue(subject.asObservable());
  });

  it('clears subscription and resets state', () => {
    useOpenTransactionsStore.getState().subscribe();
    subject.next([makeTransactionModel()]);

    useOpenTransactionsStore.getState().unsubscribe();

    const state = useOpenTransactionsStore.getState();
    expect(state._subscription).toBeNull();
    expect(state.transactions).toEqual([]);
    expect(state.loading).toBe(true);
  });
});
