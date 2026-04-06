import { Subject } from 'rxjs';
import { useInventoryStore } from '../inventoryStore';

// ─── Mocks ────────────────────────────────────────────────────────────────────

jest.mock('../../services/productService', () => ({
  observeProducts: jest.fn(),
}));

jest.mock('../../services/serviceItemService', () => ({
  observeServiceItems: jest.fn(),
}));

import { observeProducts } from '../../services/productService';
import { observeServiceItems } from '../../services/serviceItemService';

const mockObserveProducts = observeProducts as jest.Mock;
const mockObserveServiceItems = observeServiceItems as jest.Mock;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeProductModel(overrides: Record<string, unknown> = {}) {
  return {
    id: 'prod-1',
    name: 'Engine Oil',
    barcode: '1234567890',
    sellingPrice: 500,
    costPrice: 300,
    unitOfMeasure: 'liter',
    stockAvailable: 20,
    stockReserved: 2,
    lowStockThreshold: 5,
    categoryId: 'cat-1',
    supplierId: 'sup-1',
    isActive: true,
    createdAt: new Date('2024-01-01'),
    createdBy: 'user-1',
    updatedAt: new Date('2024-01-02'),
    updatedBy: 'user-1',
    ...overrides,
  };
}

function makeServiceModel(overrides: Record<string, unknown> = {}) {
  return {
    id: 'svc-1',
    name: 'Oil Change',
    basePrice: 800,
    isActive: true,
    createdAt: new Date('2024-01-01'),
    createdBy: 'user-1',
    updatedAt: new Date('2024-01-02'),
    updatedBy: 'user-1',
    ...overrides,
  };
}

function resetStore() {
  useInventoryStore.setState({
    products: [],
    serviceItems: [],
    loading: true,
    error: null,
    _productSubscription: null,
    _serviceSubscription: null,
  });
}

// ─── subscribe ────────────────────────────────────────────────────────────────

describe('subscribe', () => {
  let productSubject: Subject<any[]>;
  let serviceSubject: Subject<any[]>;

  beforeEach(() => {
    jest.clearAllMocks();
    resetStore();
    productSubject = new Subject();
    serviceSubject = new Subject();
    mockObserveProducts.mockReturnValue(productSubject.asObservable());
    mockObserveServiceItems.mockReturnValue(serviceSubject.asObservable());
  });

  afterEach(() => {
    useInventoryStore.getState().unsubscribe();
  });

  it('populates products when observable emits', () => {
    useInventoryStore.getState().subscribe();

    const model = makeProductModel();
    productSubject.next([model]);

    const { products } = useInventoryStore.getState();
    expect(products).toHaveLength(1);
    expect(products[0]).toMatchObject({
      id: 'prod-1',
      name: 'Engine Oil',
      barcode: '1234567890',
      sellingPrice: 500,
    });
  });

  it('starts with loading true and sets loading false after first products emission', () => {
    useInventoryStore.getState().subscribe();
    expect(useInventoryStore.getState().loading).toBe(true);

    productSubject.next([makeProductModel()]);

    expect(useInventoryStore.getState().loading).toBe(false);
  });

  it('populates serviceItems when observable emits', () => {
    useInventoryStore.getState().subscribe();

    serviceSubject.next([makeServiceModel()]);

    const { serviceItems } = useInventoryStore.getState();
    expect(serviceItems).toHaveLength(1);
    expect(serviceItems[0]).toMatchObject({
      id: 'svc-1',
      name: 'Oil Change',
      basePrice: 800,
    });
  });

  it('sets error and loading false when products observable errors', () => {
    useInventoryStore.getState().subscribe();

    const err = new Error('DB failure');
    productSubject.error(err);

    const state = useInventoryStore.getState();
    expect(state.error).toBe(err);
    expect(state.loading).toBe(false);
  });

  it('sets error when serviceItems observable errors', () => {
    useInventoryStore.getState().subscribe();

    const err = new Error('Service DB failure');
    serviceSubject.error(err);

    expect(useInventoryStore.getState().error).toBe(err);
  });

  it('does not double-subscribe when called twice', () => {
    useInventoryStore.getState().subscribe();
    useInventoryStore.getState().subscribe();

    expect(mockObserveProducts).toHaveBeenCalledTimes(1);
  });

  it('stores subscription references after subscribing', () => {
    useInventoryStore.getState().subscribe();

    const { _productSubscription, _serviceSubscription } = useInventoryStore.getState();
    expect(_productSubscription).not.toBeNull();
    expect(_serviceSubscription).not.toBeNull();
  });

  it('maps all Product fields correctly', () => {
    useInventoryStore.getState().subscribe();

    const model = makeProductModel();
    productSubject.next([model]);

    const product = useInventoryStore.getState().products[0]!;
    expect(product.id).toBe(model.id);
    expect(product.costPrice).toBe(model.costPrice);
    expect(product.unitOfMeasure).toBe(model.unitOfMeasure);
    expect(product.stockAvailable).toBe(model.stockAvailable);
    expect(product.stockReserved).toBe(model.stockReserved);
    expect(product.lowStockThreshold).toBe(model.lowStockThreshold);
    expect(product.categoryId).toBe(model.categoryId);
    expect(product.supplierId).toBe(model.supplierId);
    expect(product.createdAt).toBe(model.createdAt);
    expect(product.createdBy).toBe(model.createdBy);
    expect(product.updatedAt).toBe(model.updatedAt);
    expect(product.updatedBy).toBe(model.updatedBy);
  });

  it('maps all ServiceItem fields correctly', () => {
    useInventoryStore.getState().subscribe();

    const model = makeServiceModel();
    serviceSubject.next([model]);

    const item = useInventoryStore.getState().serviceItems[0]!;
    expect(item.id).toBe(model.id);
    expect(item.basePrice).toBe(model.basePrice);
    expect(item.isActive).toBe(model.isActive);
    expect(item.createdAt).toBe(model.createdAt);
    expect(item.createdBy).toBe(model.createdBy);
    expect(item.updatedAt).toBe(model.updatedAt);
    expect(item.updatedBy).toBe(model.updatedBy);
  });
});

// ─── unsubscribe ──────────────────────────────────────────────────────────────

describe('unsubscribe', () => {
  let productSubject: Subject<any[]>;
  let serviceSubject: Subject<any[]>;

  beforeEach(() => {
    jest.clearAllMocks();
    resetStore();
    productSubject = new Subject();
    serviceSubject = new Subject();
    mockObserveProducts.mockReturnValue(productSubject.asObservable());
    mockObserveServiceItems.mockReturnValue(serviceSubject.asObservable());
  });

  it('clears subscriptions and resets state', () => {
    useInventoryStore.getState().subscribe();
    productSubject.next([makeProductModel()]);
    serviceSubject.next([makeServiceModel()]);

    useInventoryStore.getState().unsubscribe();

    const state = useInventoryStore.getState();
    expect(state._productSubscription).toBeNull();
    expect(state._serviceSubscription).toBeNull();
    expect(state.products).toEqual([]);
    expect(state.serviceItems).toEqual([]);
    expect(state.loading).toBe(true);
  });
});
