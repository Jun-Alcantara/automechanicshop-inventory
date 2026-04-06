import { Subject } from 'rxjs';
import { useCatalogStore } from '../catalogStore';

// ─── Mocks ────────────────────────────────────────────────────────────────────

jest.mock('../../services/catalogService', () => ({
  observeCategories: jest.fn(),
  observeSuppliers: jest.fn(),
  observeAddOns: jest.fn(),
}));

import { observeCategories, observeSuppliers, observeAddOns } from '../../services/catalogService';

const mockObserveCategories = observeCategories as jest.Mock;
const mockObserveSuppliers = observeSuppliers as jest.Mock;
const mockObserveAddOns = observeAddOns as jest.Mock;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeCategoryModel(overrides: Record<string, unknown> = {}) {
  return {
    id: 'cat-1',
    name: 'Lubricants',
    createdAt: new Date('2024-01-01'),
    createdBy: 'user-1',
    ...overrides,
  };
}

function makeSupplierModel(overrides: Record<string, unknown> = {}) {
  return {
    id: 'sup-1',
    name: 'AutoParts Co.',
    contactInfo: '09171234567',
    createdAt: new Date('2024-01-01'),
    createdBy: 'user-1',
    ...overrides,
  };
}

function makeAddOnModel(overrides: Record<string, unknown> = {}) {
  return {
    id: 'addon-1',
    name: 'Tire Rotation',
    amount: 150,
    isActive: true,
    createdAt: new Date('2024-01-01'),
    createdBy: 'user-1',
    ...overrides,
  };
}

function resetStore() {
  useCatalogStore.setState({
    categories: [],
    suppliers: [],
    addOns: [],
    loading: true,
    error: null,
    _categorySubscription: null,
    _supplierSubscription: null,
    _addOnSubscription: null,
  });
}

// ─── subscribe ────────────────────────────────────────────────────────────────

describe('subscribe', () => {
  let categorySubject: Subject<any[]>;
  let supplierSubject: Subject<any[]>;
  let addOnSubject: Subject<any[]>;

  beforeEach(() => {
    jest.clearAllMocks();
    resetStore();
    categorySubject = new Subject();
    supplierSubject = new Subject();
    addOnSubject = new Subject();
    mockObserveCategories.mockReturnValue(categorySubject.asObservable());
    mockObserveSuppliers.mockReturnValue(supplierSubject.asObservable());
    mockObserveAddOns.mockReturnValue(addOnSubject.asObservable());
  });

  afterEach(() => {
    useCatalogStore.getState().unsubscribe();
  });

  it('populates categories when observable emits', () => {
    useCatalogStore.getState().subscribe();

    categorySubject.next([makeCategoryModel()]);

    const { categories } = useCatalogStore.getState();
    expect(categories).toHaveLength(1);
    expect(categories[0]).toMatchObject({ id: 'cat-1', name: 'Lubricants' });
  });

  it('starts with loading true and sets loading false after first categories emission', () => {
    useCatalogStore.getState().subscribe();
    expect(useCatalogStore.getState().loading).toBe(true);

    categorySubject.next([makeCategoryModel()]);

    expect(useCatalogStore.getState().loading).toBe(false);
  });

  it('populates suppliers when observable emits', () => {
    useCatalogStore.getState().subscribe();

    supplierSubject.next([makeSupplierModel()]);

    const { suppliers } = useCatalogStore.getState();
    expect(suppliers).toHaveLength(1);
    expect(suppliers[0]).toMatchObject({ id: 'sup-1', name: 'AutoParts Co.', contactInfo: '09171234567' });
  });

  it('populates addOns when observable emits', () => {
    useCatalogStore.getState().subscribe();

    addOnSubject.next([makeAddOnModel()]);

    const { addOns } = useCatalogStore.getState();
    expect(addOns).toHaveLength(1);
    expect(addOns[0]).toMatchObject({ id: 'addon-1', name: 'Tire Rotation', amount: 150 });
  });

  it('sets error and loading false when categories observable errors', () => {
    useCatalogStore.getState().subscribe();

    const err = new Error('DB failure');
    categorySubject.error(err);

    const state = useCatalogStore.getState();
    expect(state.error).toBe(err);
    expect(state.loading).toBe(false);
  });

  it('sets error when suppliers observable errors', () => {
    useCatalogStore.getState().subscribe();

    const err = new Error('Supplier DB failure');
    supplierSubject.error(err);

    expect(useCatalogStore.getState().error).toBe(err);
  });

  it('sets error when addOns observable errors', () => {
    useCatalogStore.getState().subscribe();

    const err = new Error('AddOn DB failure');
    addOnSubject.error(err);

    expect(useCatalogStore.getState().error).toBe(err);
  });

  it('does not double-subscribe when called twice', () => {
    useCatalogStore.getState().subscribe();
    useCatalogStore.getState().subscribe();

    expect(mockObserveCategories).toHaveBeenCalledTimes(1);
  });

  it('stores all three subscription references after subscribing', () => {
    useCatalogStore.getState().subscribe();

    const { _categorySubscription, _supplierSubscription, _addOnSubscription } =
      useCatalogStore.getState();
    expect(_categorySubscription).not.toBeNull();
    expect(_supplierSubscription).not.toBeNull();
    expect(_addOnSubscription).not.toBeNull();
  });

  it('maps all Category fields correctly', () => {
    useCatalogStore.getState().subscribe();

    const model = makeCategoryModel();
    categorySubject.next([model]);

    const category = useCatalogStore.getState().categories[0]!;
    expect(category.id).toBe(model.id);
    expect(category.name).toBe(model.name);
    expect(category.createdAt).toBe(model.createdAt);
    expect(category.createdBy).toBe(model.createdBy);
  });

  it('maps all Supplier fields correctly', () => {
    useCatalogStore.getState().subscribe();

    const model = makeSupplierModel();
    supplierSubject.next([model]);

    const supplier = useCatalogStore.getState().suppliers[0]!;
    expect(supplier.id).toBe(model.id);
    expect(supplier.name).toBe(model.name);
    expect(supplier.contactInfo).toBe(model.contactInfo);
    expect(supplier.createdAt).toBe(model.createdAt);
    expect(supplier.createdBy).toBe(model.createdBy);
  });

  it('maps all AddOn fields correctly', () => {
    useCatalogStore.getState().subscribe();

    const model = makeAddOnModel();
    addOnSubject.next([model]);

    const addOn = useCatalogStore.getState().addOns[0]!;
    expect(addOn.id).toBe(model.id);
    expect(addOn.name).toBe(model.name);
    expect(addOn.amount).toBe(model.amount);
    expect(addOn.isActive).toBe(model.isActive);
    expect(addOn.createdAt).toBe(model.createdAt);
    expect(addOn.createdBy).toBe(model.createdBy);
  });
});

// ─── unsubscribe ──────────────────────────────────────────────────────────────

describe('unsubscribe', () => {
  let categorySubject: Subject<any[]>;
  let supplierSubject: Subject<any[]>;
  let addOnSubject: Subject<any[]>;

  beforeEach(() => {
    jest.clearAllMocks();
    resetStore();
    categorySubject = new Subject();
    supplierSubject = new Subject();
    addOnSubject = new Subject();
    mockObserveCategories.mockReturnValue(categorySubject.asObservable());
    mockObserveSuppliers.mockReturnValue(supplierSubject.asObservable());
    mockObserveAddOns.mockReturnValue(addOnSubject.asObservable());
  });

  it('clears all three subscriptions and resets state', () => {
    useCatalogStore.getState().subscribe();
    categorySubject.next([makeCategoryModel()]);
    supplierSubject.next([makeSupplierModel()]);
    addOnSubject.next([makeAddOnModel()]);

    useCatalogStore.getState().unsubscribe();

    const state = useCatalogStore.getState();
    expect(state._categorySubscription).toBeNull();
    expect(state._supplierSubscription).toBeNull();
    expect(state._addOnSubscription).toBeNull();
    expect(state.categories).toEqual([]);
    expect(state.suppliers).toEqual([]);
    expect(state.addOns).toEqual([]);
    expect(state.loading).toBe(true);
  });
});
