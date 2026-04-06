import { useTransactionDraftStore } from '../transactionDraftStore';

// ─── Mocks ────────────────────────────────────────────────────────────────────

jest.mock('../../services/transactionService', () => ({
  addLineItem: jest.fn(),
  removeLineItem: jest.fn(),
  updateLineItemQty: jest.fn(),
  applyDiscount: jest.fn(),
  removeDiscount: jest.fn(),
  applyAddOn: jest.fn(),
  removeAddOn: jest.fn(),
}));

jest.mock('../../services/database', () => ({
  database: {
    get: jest.fn(),
  },
}));

jest.mock('@nozbe/watermelondb', () => ({
  Q: {
    where: jest.fn((col: string, val: string) => ({ col, val })),
  },
}));

import {
  addLineItem as svcAddLineItem,
  removeLineItem as svcRemoveLineItem,
  updateLineItemQty as svcUpdateLineItemQty,
  applyDiscount as svcApplyDiscount,
  removeDiscount as svcRemoveDiscount,
  applyAddOn as svcApplyAddOn,
  removeAddOn as svcRemoveAddOn,
} from '../../services/transactionService';
import { database } from '../../services/database';

const mockSvcAddLineItem = svcAddLineItem as jest.Mock;
const mockSvcRemoveLineItem = svcRemoveLineItem as jest.Mock;
const mockSvcUpdateLineItemQty = svcUpdateLineItemQty as jest.Mock;
const mockSvcApplyDiscount = svcApplyDiscount as jest.Mock;
const mockSvcRemoveDiscount = svcRemoveDiscount as jest.Mock;
const mockSvcApplyAddOn = svcApplyAddOn as jest.Mock;
const mockSvcRemoveAddOn = svcRemoveAddOn as jest.Mock;
const mockDatabaseGet = database.get as jest.Mock;

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

function makeLineItemModel(overrides: Record<string, unknown> = {}) {
  return {
    id: 'li-1',
    transactionId: 'tx-1',
    type: 'PRODUCT',
    refId: 'prod-1',
    name: 'Engine Oil',
    unitPrice: 500,
    quantity: 2,
    vatType: 'VAT',
    discountType: '',
    discountValue: 0,
    subtotal: 1000,
    vatAmount: 120,
    discountAmount: 0,
    total: 1000,
    ...overrides,
  };
}

function makeUser() {
  return {
    id: 'user-1',
    displayName: 'Test User',
    pinHash: '',
    pinSalt: '',
    permissions: [],
    isMainAdmin: false,
    isActive: true,
    createdAt: new Date(),
    createdBy: '',
    updatedAt: new Date(),
    updatedBy: '',
  };
}

function setupDatabaseMock(txModel = makeTransactionModel(), liModels = [makeLineItemModel()]) {
  mockDatabaseGet.mockImplementation((table: string) => {
    if (table === 'transactions') {
      return { find: jest.fn().mockResolvedValue(txModel) };
    }
    if (table === 'line_items') {
      return {
        query: jest.fn().mockReturnValue({
          fetch: jest.fn().mockResolvedValue(liModels),
        }),
      };
    }
    return {};
  });
}

function resetStore() {
  useTransactionDraftStore.setState({
    draft: null,
    lineItems: [],
    loading: false,
  });
}

// ─── openDraft ────────────────────────────────────────────────────────────────

describe('openDraft', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetStore();
    setupDatabaseMock();
  });

  it('sets loading true during fetch then false after', async () => {
    const loadingStates: boolean[] = [];
    const unsub = useTransactionDraftStore.subscribe((s) => loadingStates.push(s.loading));

    await useTransactionDraftStore.getState().openDraft('tx-1');

    unsub();
    expect(loadingStates).toContain(true);
    expect(useTransactionDraftStore.getState().loading).toBe(false);
  });

  it('sets draft and lineItems from DB', async () => {
    await useTransactionDraftStore.getState().openDraft('tx-1');

    const { draft, lineItems } = useTransactionDraftStore.getState();
    expect(draft).not.toBeNull();
    expect(draft!.id).toBe('tx-1');
    expect(draft!.status).toBe('IN_PROGRESS');
    expect(lineItems).toHaveLength(1);
    expect(lineItems[0]!.id).toBe('li-1');
  });

  it('maps all Transaction fields correctly', async () => {
    const txModel = makeTransactionModel();
    setupDatabaseMock(txModel);

    await useTransactionDraftStore.getState().openDraft('tx-1');

    const { draft } = useTransactionDraftStore.getState();
    expect(draft!.customerId).toBe(txModel.customerId);
    expect(draft!.vehicleId).toBe(txModel.vehicleId);
    expect(draft!.cashierId).toBe(txModel.cashierId);
    expect(draft!.subtotal).toBe(txModel.subtotal);
    expect(draft!.totalVat).toBe(txModel.totalVat);
    expect(draft!.totalAmount).toBe(txModel.totalAmount);
    expect(draft!.createdAt).toBe(txModel.createdAt);
    expect(draft!.lineItems).toEqual([]);
    expect(draft!.payments).toEqual([]);
  });

  it('maps all LineItem fields correctly', async () => {
    const liModel = makeLineItemModel();
    setupDatabaseMock(makeTransactionModel(), [liModel]);

    await useTransactionDraftStore.getState().openDraft('tx-1');

    const li = useTransactionDraftStore.getState().lineItems[0]!;
    expect(li.transactionId).toBe(liModel.transactionId);
    expect(li.type).toBe(liModel.type);
    expect(li.refId).toBe(liModel.refId);
    expect(li.name).toBe(liModel.name);
    expect(li.unitPrice).toBe(liModel.unitPrice);
    expect(li.quantity).toBe(liModel.quantity);
    expect(li.subtotal).toBe(liModel.subtotal);
    expect(li.total).toBe(liModel.total);
    expect(li.addOns).toEqual([]);
  });
});

// ─── refreshDraft ─────────────────────────────────────────────────────────────

describe('refreshDraft', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetStore();
  });

  it('updates draft and lineItems without touching loading', async () => {
    setupDatabaseMock(makeTransactionModel({ subtotal: 2000 }), [makeLineItemModel({ quantity: 4 })]);

    await useTransactionDraftStore.getState().refreshDraft('tx-1');

    const { draft, lineItems, loading } = useTransactionDraftStore.getState();
    expect(draft!.subtotal).toBe(2000);
    expect(lineItems[0]!.quantity).toBe(4);
    expect(loading).toBe(false);
  });
});

// ─── addLineItem ──────────────────────────────────────────────────────────────

describe('addLineItem', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetStore();
    mockSvcAddLineItem.mockResolvedValue(undefined);
    setupDatabaseMock();
  });

  it('calls svcAddLineItem with correct args then refreshes state', async () => {
    const item = { id: 'prod-1', name: 'Engine Oil', sellingPrice: 500 } as any;
    const user = makeUser();

    await useTransactionDraftStore.getState().addLineItem('tx-1', item, 2, user);

    expect(mockSvcAddLineItem).toHaveBeenCalledWith('tx-1', item, 2, user);
    expect(useTransactionDraftStore.getState().draft).not.toBeNull();
    expect(useTransactionDraftStore.getState().lineItems).toHaveLength(1);
  });
});

// ─── removeLineItem ───────────────────────────────────────────────────────────

describe('removeLineItem', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetStore();
    mockSvcRemoveLineItem.mockResolvedValue(undefined);
    setupDatabaseMock(makeTransactionModel(), []);
  });

  it('calls svcRemoveLineItem then refreshes state', async () => {
    const user = makeUser();

    await useTransactionDraftStore.getState().removeLineItem('li-1', 'tx-1', user);

    expect(mockSvcRemoveLineItem).toHaveBeenCalledWith('li-1', user);
    expect(useTransactionDraftStore.getState().lineItems).toHaveLength(0);
  });
});

// ─── updateLineItemQty ────────────────────────────────────────────────────────

describe('updateLineItemQty', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetStore();
    mockSvcUpdateLineItemQty.mockResolvedValue(undefined);
    setupDatabaseMock(makeTransactionModel(), [makeLineItemModel({ quantity: 5 })]);
  });

  it('calls svcUpdateLineItemQty then refreshes state', async () => {
    const user = makeUser();

    await useTransactionDraftStore.getState().updateLineItemQty('li-1', 'tx-1', 5, user);

    expect(mockSvcUpdateLineItemQty).toHaveBeenCalledWith('li-1', 5, user);
    expect(useTransactionDraftStore.getState().lineItems[0]!.quantity).toBe(5);
  });
});

// ─── applyDiscount ────────────────────────────────────────────────────────────

describe('applyDiscount', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetStore();
    mockSvcApplyDiscount.mockResolvedValue(undefined);
    setupDatabaseMock(makeTransactionModel(), [makeLineItemModel({ discountType: 'FIXED', discountValue: 100 })]);
  });

  it('calls svcApplyDiscount then refreshes state', async () => {
    const user = makeUser();

    await useTransactionDraftStore.getState().applyDiscount('li-1', 'tx-1', 'FIXED', 100, user);

    expect(mockSvcApplyDiscount).toHaveBeenCalledWith('li-1', 'FIXED', 100, user);
    expect(useTransactionDraftStore.getState().lineItems[0]!.discountType).toBe('FIXED');
  });
});

// ─── removeDiscount ───────────────────────────────────────────────────────────

describe('removeDiscount', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetStore();
    mockSvcRemoveDiscount.mockResolvedValue(undefined);
    setupDatabaseMock(makeTransactionModel(), [makeLineItemModel({ discountType: '', discountValue: 0 })]);
  });

  it('calls svcRemoveDiscount then refreshes state', async () => {
    const user = makeUser();

    await useTransactionDraftStore.getState().removeDiscount('li-1', 'tx-1', user);

    expect(mockSvcRemoveDiscount).toHaveBeenCalledWith('li-1', user);
    expect(useTransactionDraftStore.getState().lineItems[0]!.discountValue).toBe(0);
  });
});

// ─── applyAddOn ───────────────────────────────────────────────────────────────

describe('applyAddOn', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetStore();
    mockSvcApplyAddOn.mockResolvedValue(undefined);
    setupDatabaseMock();
  });

  it('calls svcApplyAddOn then refreshes state', async () => {
    const user = makeUser();
    const input = { addOnId: 'ao-1', name: 'Polish', amount: 200, isOnTheFly: false };

    await useTransactionDraftStore.getState().applyAddOn('li-1', 'tx-1', input, user);

    expect(mockSvcApplyAddOn).toHaveBeenCalledWith('li-1', input, user);
    expect(useTransactionDraftStore.getState().draft).not.toBeNull();
  });
});

// ─── removeAddOn ─────────────────────────────────────────────────────────────

describe('removeAddOn', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetStore();
    mockSvcRemoveAddOn.mockResolvedValue(undefined);
    setupDatabaseMock();
  });

  it('calls svcRemoveAddOn then refreshes state', async () => {
    const user = makeUser();

    await useTransactionDraftStore.getState().removeAddOn('ao-record-1', 'li-1', 'tx-1', user);

    expect(mockSvcRemoveAddOn).toHaveBeenCalledWith('ao-record-1', 'li-1', user);
    expect(useTransactionDraftStore.getState().draft).not.toBeNull();
  });
});

// ─── clearDraft ───────────────────────────────────────────────────────────────

describe('clearDraft', () => {
  it('resets draft, lineItems, and loading', async () => {
    setupDatabaseMock();
    await useTransactionDraftStore.getState().openDraft('tx-1');

    useTransactionDraftStore.getState().clearDraft();

    const { draft, lineItems, loading } = useTransactionDraftStore.getState();
    expect(draft).toBeNull();
    expect(lineItems).toEqual([]);
    expect(loading).toBe(false);
  });
});
