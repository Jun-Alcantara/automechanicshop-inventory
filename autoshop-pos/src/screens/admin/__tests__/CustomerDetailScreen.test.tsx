import React from 'react';
import { render, act, fireEvent } from '@testing-library/react-native';
import { CustomerDetailScreen } from '../CustomerDetailScreen';

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockVehicleSub = { unsubscribe: jest.fn() };
const mockTxSub = { unsubscribe: jest.fn() };

jest.mock('@services/vehicleService', () => ({
  observeVehiclesForCustomer: jest.fn(() => ({
    subscribe: jest.fn((cb: (v: unknown[]) => void) => {
      cb([]);
      return mockVehicleSub;
    }),
  })),
}));

jest.mock('@services/transactionService', () => ({
  observeTransactionsForCustomer: jest.fn(() => ({
    subscribe: jest.fn((cb: (t: unknown[]) => void) => {
      cb([]);
      return mockTxSub;
    }),
  })),
}));

jest.mock('@services/database', () => ({
  database: {
    get: jest.fn(() => ({
      find: jest.fn().mockResolvedValue(null),
    })),
  },
}));

jest.mock('@react-navigation/native', () => ({
  useFocusEffect: (cb: () => (() => void) | void) => {
    const React = require('react');
    React.useEffect(cb, []);
  },
}));

jest.mock('@components/layout/ScreenWrapper', () => ({
  ScreenWrapper: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

jest.mock('@components/layout/SectionHeader', () => ({
  SectionHeader: ({ title, rightElement }: { title: string; rightElement?: React.ReactNode }) => {
    const { View, Text } = require('react-native');
    return (
      <View>
        <Text testID={`section-header-${title}`}>{title}</Text>
        {rightElement ?? null}
      </View>
    );
  },
}));

jest.mock('@components/common/AppBadge', () => ({
  AppBadge: ({ label }: { label: string }) => {
    const { Text } = require('react-native');
    return <Text testID={`badge-${label}`}>{label}</Text>;
  },
}));

jest.mock('@components/common/AppButton', () => ({
  AppButton: ({ label, onPress }: { label: string; onPress: () => void }) => {
    const { Text } = require('react-native');
    return <Text testID={`btn-${label}`} onPress={onPress}>{label}</Text>;
  },
}));

jest.mock('@components/common/EmptyState', () => ({
  EmptyState: ({ title }: { title: string }) => {
    const { Text } = require('react-native');
    return <Text testID={`empty-${title}`}>{title}</Text>;
  },
}));

import { observeVehiclesForCustomer } from '@services/vehicleService';
import { observeTransactionsForCustomer } from '@services/transactionService';
import { database } from '@services/database';

const mockObserveVehicles = observeVehiclesForCustomer as jest.Mock;
const mockObserveTxns = observeTransactionsForCustomer as jest.Mock;
const mockDatabase = database as jest.Mocked<typeof database>;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeNavigation(overrides: Record<string, jest.Mock> = {}) {
  return { navigate: jest.fn(), goBack: jest.fn(), ...overrides };
}

function makeRoute(customerId = 'cust-1') {
  return { params: { customerId } };
}

function makeCustomerModel(overrides: Record<string, unknown> = {}) {
  return {
    id: 'cust-1',
    type: 'NAMED',
    name: 'Juan dela Cruz',
    phone: '09171234567',
    email: 'juan@example.com',
    isActive: true,
    createdAt: new Date('2025-01-01'),
    createdBy: 'user-1',
    ...overrides,
  };
}

function makeVehicleModel(overrides: Record<string, unknown> = {}) {
  return {
    id: 'veh-1',
    customerId: 'cust-1',
    make: 'Toyota',
    model: 'Vios',
    color: 'White',
    plateNumber: 'ABC 1234',
    createdAt: new Date('2025-01-01'),
    createdBy: 'user-1',
    ...overrides,
  };
}

function makeTxnModel(overrides: Record<string, unknown> = {}) {
  return {
    id: 'txn-1',
    status: 'FINALIZED',
    customerId: 'cust-1',
    vehicleId: '',
    cashierId: 'user-1',
    subtotal: 1000,
    totalVat: 0,
    totalAmount: 1000,
    changeDue: 0,
    hasReturn: false,
    originalTransactionId: '',
    voidReason: '',
    voidedBy: '',
    voidedAt: 0,
    returnReason: '',
    returnedBy: '',
    returnedAt: 0,
    createdAt: new Date('2025-01-15'),
    createdBy: 'user-1',
    finalizedAt: new Date('2025-01-15').getTime(),
    finalizedBy: 'user-1',
    ...overrides,
  };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('CustomerDetailScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    (mockDatabase.get as jest.Mock).mockReturnValue({
      find: jest.fn().mockRejectedValue(new Error('not found')),
    });

    mockObserveVehicles.mockReturnValue({
      subscribe: jest.fn((cb: (v: unknown[]) => void) => { cb([]); return mockVehicleSub; }),
    });

    mockObserveTxns.mockReturnValue({
      subscribe: jest.fn((cb: (t: unknown[]) => void) => { cb([]); return mockTxSub; }),
    });
  });

  describe('loading state', () => {
    it('shows ActivityIndicator while loading', () => {
      (mockDatabase.get as jest.Mock).mockReturnValue({
        find: jest.fn(() => new Promise(() => {})),
      });
      const { getByTestId } = render(
        <CustomerDetailScreen route={makeRoute() as any} navigation={makeNavigation() as any} />
      );
      expect(getByTestId('loading-indicator')).toBeTruthy();
    });

    it('shows error text when customer is not found', async () => {
      (mockDatabase.get as jest.Mock).mockReturnValue({
        find: jest.fn().mockRejectedValue(new Error('not found')),
      });
      const { getByText } = render(
        <CustomerDetailScreen route={makeRoute() as any} navigation={makeNavigation() as any} />
      );
      await act(async () => {});
      expect(getByText('Customer not found.')).toBeTruthy();
    });
  });

  describe('customer info section', () => {
    it('displays customer name and Named badge', async () => {
      (mockDatabase.get as jest.Mock).mockReturnValue({
        find: jest.fn().mockResolvedValue(makeCustomerModel({ type: 'NAMED', name: 'Juan dela Cruz' })),
      });
      const { getByText, getByTestId } = render(
        <CustomerDetailScreen route={makeRoute() as any} navigation={makeNavigation() as any} />
      );
      await act(async () => {});
      expect(getByText('Juan dela Cruz')).toBeTruthy();
      expect(getByTestId('badge-Named')).toBeTruthy();
    });

    it('displays Walk-in badge for WALKIN customer type', async () => {
      (mockDatabase.get as jest.Mock).mockReturnValue({
        find: jest.fn().mockResolvedValue(makeCustomerModel({ type: 'WALKIN', name: 'Walk-in Customer' })),
      });
      const { getByTestId } = render(
        <CustomerDetailScreen route={makeRoute() as any} navigation={makeNavigation() as any} />
      );
      await act(async () => {});
      expect(getByTestId('badge-Walk-in')).toBeTruthy();
    });

    it('shows phone and email when present', async () => {
      (mockDatabase.get as jest.Mock).mockReturnValue({
        find: jest.fn().mockResolvedValue(makeCustomerModel({ phone: '09171234567', email: 'juan@example.com' })),
      });
      const { getByText } = render(
        <CustomerDetailScreen route={makeRoute() as any} navigation={makeNavigation() as any} />
      );
      await act(async () => {});
      expect(getByText('09171234567')).toBeTruthy();
      expect(getByText('juan@example.com')).toBeTruthy();
    });

    it('navigates to CustomerForm with customerId on Edit button press', async () => {
      (mockDatabase.get as jest.Mock).mockReturnValue({
        find: jest.fn().mockResolvedValue(makeCustomerModel()),
      });
      const navigate = jest.fn();
      const { getByTestId } = render(
        <CustomerDetailScreen route={makeRoute('cust-1') as any} navigation={makeNavigation({ navigate }) as any} />
      );
      await act(async () => {});
      fireEvent.press(getByTestId('btn-Edit'));
      expect(navigate).toHaveBeenCalledWith('CustomerForm', { customerId: 'cust-1' });
    });
  });

  describe('vehicles section', () => {
    it('shows EmptyState when no vehicles', async () => {
      (mockDatabase.get as jest.Mock).mockReturnValue({
        find: jest.fn().mockResolvedValue(makeCustomerModel()),
      });
      mockObserveVehicles.mockReturnValue({
        subscribe: jest.fn((cb: (v: unknown[]) => void) => { cb([]); return mockVehicleSub; }),
      });
      const { getByTestId } = render(
        <CustomerDetailScreen route={makeRoute() as any} navigation={makeNavigation() as any} />
      );
      await act(async () => {});
      expect(getByTestId('empty-No Vehicles')).toBeTruthy();
    });

    it('renders vehicle rows with make, model, color, and plate', async () => {
      (mockDatabase.get as jest.Mock).mockReturnValue({
        find: jest.fn().mockResolvedValue(makeCustomerModel()),
      });
      mockObserveVehicles.mockReturnValue({
        subscribe: jest.fn((cb: (v: unknown[]) => void) => {
          cb([makeVehicleModel()]);
          return mockVehicleSub;
        }),
      });
      const { getByText } = render(
        <CustomerDetailScreen route={makeRoute() as any} navigation={makeNavigation() as any} />
      );
      await act(async () => {});
      expect(getByText('Toyota Vios (White) — ABC 1234')).toBeTruthy();
    });

    it('navigates to VehicleDetail on vehicle row press', async () => {
      (mockDatabase.get as jest.Mock).mockReturnValue({
        find: jest.fn().mockResolvedValue(makeCustomerModel()),
      });
      mockObserveVehicles.mockReturnValue({
        subscribe: jest.fn((cb: (v: unknown[]) => void) => {
          cb([makeVehicleModel({ id: 'veh-99' })]);
          return mockVehicleSub;
        }),
      });
      const navigate = jest.fn();
      const { getByText } = render(
        <CustomerDetailScreen route={makeRoute() as any} navigation={makeNavigation({ navigate }) as any} />
      );
      await act(async () => {});
      fireEvent.press(getByText('Toyota Vios (White) — ABC 1234'));
      expect(navigate).toHaveBeenCalledWith('VehicleDetail', { vehicleId: 'veh-99' });
    });

    it('navigates to VehicleForm with customerId on Add Vehicle press', async () => {
      (mockDatabase.get as jest.Mock).mockReturnValue({
        find: jest.fn().mockResolvedValue(makeCustomerModel()),
      });
      const navigate = jest.fn();
      const { getByTestId } = render(
        <CustomerDetailScreen route={makeRoute('cust-1') as any} navigation={makeNavigation({ navigate }) as any} />
      );
      await act(async () => {});
      fireEvent.press(getByTestId('btn-Add Vehicle'));
      expect(navigate).toHaveBeenCalledWith('VehicleForm', { customerId: 'cust-1' });
    });
  });

  describe('transaction history section', () => {
    it('shows EmptyState when no transactions', async () => {
      (mockDatabase.get as jest.Mock).mockReturnValue({
        find: jest.fn().mockResolvedValue(makeCustomerModel()),
      });
      mockObserveTxns.mockReturnValue({
        subscribe: jest.fn((cb: (t: unknown[]) => void) => { cb([]); return mockTxSub; }),
      });
      const { getByTestId } = render(
        <CustomerDetailScreen route={makeRoute() as any} navigation={makeNavigation() as any} />
      );
      await act(async () => {});
      expect(getByTestId('empty-No Transactions')).toBeTruthy();
    });

    it('renders FINALIZED transaction row with total and status badge', async () => {
      (mockDatabase.get as jest.Mock).mockReturnValue({
        find: jest.fn().mockResolvedValue(makeCustomerModel()),
      });
      mockObserveTxns.mockReturnValue({
        subscribe: jest.fn((cb: (t: unknown[]) => void) => {
          cb([makeTxnModel({ status: 'FINALIZED', totalAmount: 1500 })]);
          return mockTxSub;
        }),
      });
      const { getByTestId } = render(
        <CustomerDetailScreen route={makeRoute() as any} navigation={makeNavigation() as any} />
      );
      await act(async () => {});
      expect(getByTestId('badge-Finalized')).toBeTruthy();
    });

    it('filters out IN_PROGRESS transactions', async () => {
      (mockDatabase.get as jest.Mock).mockReturnValue({
        find: jest.fn().mockResolvedValue(makeCustomerModel()),
      });
      mockObserveTxns.mockReturnValue({
        subscribe: jest.fn((cb: (t: unknown[]) => void) => {
          cb([makeTxnModel({ status: 'IN_PROGRESS' })]);
          return mockTxSub;
        }),
      });
      const { getByTestId, queryByTestId } = render(
        <CustomerDetailScreen route={makeRoute() as any} navigation={makeNavigation() as any} />
      );
      await act(async () => {});
      expect(queryByTestId('badge-In Progress')).toBeNull();
      expect(getByTestId('empty-No Transactions')).toBeTruthy();
    });

    it('navigates to TransactionHistoryDetail on transaction row press', async () => {
      (mockDatabase.get as jest.Mock).mockReturnValue({
        find: jest.fn().mockResolvedValue(makeCustomerModel()),
      });
      mockObserveTxns.mockReturnValue({
        subscribe: jest.fn((cb: (t: unknown[]) => void) => {
          cb([makeTxnModel({ id: 'txn-xyz', status: 'FINALIZED' })]);
          return mockTxSub;
        }),
      });
      const navigate = jest.fn();
      const { getByTestId } = render(
        <CustomerDetailScreen route={makeRoute() as any} navigation={makeNavigation({ navigate }) as any} />
      );
      await act(async () => {});
      fireEvent.press(getByTestId('txn-row-txn-xyz'));
      expect(navigate).toHaveBeenCalledWith('Transactions', {
        screen: 'TransactionHistoryDetail',
        params: { transactionId: 'txn-xyz' },
      });
    });
  });

  describe('subscriptions', () => {
    it('unsubscribes from observables on unmount', async () => {
      (mockDatabase.get as jest.Mock).mockReturnValue({
        find: jest.fn().mockResolvedValue(makeCustomerModel()),
      });
      const { unmount } = render(
        <CustomerDetailScreen route={makeRoute() as any} navigation={makeNavigation() as any} />
      );
      await act(async () => {});
      unmount();
      expect(mockVehicleSub.unsubscribe).toHaveBeenCalled();
      expect(mockTxSub.unsubscribe).toHaveBeenCalled();
    });
  });
});
