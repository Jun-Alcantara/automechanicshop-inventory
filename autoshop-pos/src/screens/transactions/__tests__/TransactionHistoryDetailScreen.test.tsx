import React from 'react';
import { render, act, fireEvent } from '@testing-library/react-native';
import { TransactionHistoryDetailScreen } from '../TransactionHistoryDetailScreen';

// ─── Mocks ────────────────────────────────────────────────────────────────────

jest.mock('@services/transactionService', () => ({
  getTransactionById: jest.fn(),
}));

jest.mock('@services/database', () => ({
  database: {
    get: jest.fn(() => ({
      find: jest.fn().mockResolvedValue(null),
    })),
  },
}));

jest.mock('@hooks/useHasPermission', () => ({
  useHasPermission: jest.fn(),
}));

jest.mock('@components/layout/ScreenWrapper', () => ({
  ScreenWrapper: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

jest.mock('@components/common/AppBadge', () => ({
  AppBadge: ({ label }: { label: string }) => {
    const { Text } = require('react-native');
    return <Text testID="app-badge">{label}</Text>;
  },
}));

jest.mock('@components/common/AppButton', () => ({
  AppButton: ({ label, onPress, disabled }: { label: string; onPress: () => void; disabled?: boolean }) => {
    const { View, Text } = require('react-native');
    return (
      <View
        testID={`btn-${label}`}
        accessibilityState={{ disabled: !!disabled }}
        onStartShouldSetResponder={() => true}
      >
        <Text onPress={!disabled ? onPress : undefined}>{label}</Text>
      </View>
    );
  },
}));

jest.mock('@components/transaction/LineItemRow', () => ({
  LineItemRow: ({ item }: { item: { name: string } }) => {
    const { Text } = require('react-native');
    return <Text testID={`line-item-${item.name}`}>{item.name}</Text>;
  },
}));

import { getTransactionById } from '@services/transactionService';
import { useHasPermission } from '@hooks/useHasPermission';
import { database } from '@services/database';

const mockGetTransactionById = getTransactionById as jest.Mock;
const mockUseHasPermission = useHasPermission as jest.Mock;
const mockDatabase = database as jest.Mocked<typeof database>;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeNavigation(overrides: Record<string, jest.Mock> = {}) {
  return {
    navigate: jest.fn(),
    goBack: jest.fn(),
    ...overrides,
  };
}

function makeRoute(transactionId = 'txn-abc-12345') {
  return { params: { transactionId } };
}

function makeLineItem(overrides: Record<string, unknown> = {}) {
  return {
    id: 'li-1',
    transactionId: 'txn-abc-12345',
    type: 'PRODUCT' as const,
    refId: 'prod-1',
    name: 'Engine Oil',
    unitPrice: 500,
    quantity: 2,
    vatType: 'VAT_INCLUSIVE',
    discountType: '',
    discountValue: 0,
    subtotal: 1000,
    vatAmount: 0,
    discountAmount: 0,
    total: 1000,
    addOns: [],
    ...overrides,
  };
}

function makePayment(overrides: Record<string, unknown> = {}) {
  return {
    id: 'pay-1',
    transactionId: 'txn-abc-12345',
    method: 'CASH' as const,
    amount: 1000,
    referenceNumber: '',
    receiptPhotoUri: '',
    ...overrides,
  };
}

function makeTransaction(overrides: Record<string, unknown> = {}) {
  return {
    id: 'txn-abc-12345',
    status: 'FINALIZED' as const,
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
    createdAt: new Date('2025-01-15T10:00:00'),
    createdBy: 'user-1',
    finalizedAt: new Date('2025-01-15T10:30:00').getTime(),
    finalizedBy: 'user-1',
    lineItems: [makeLineItem()],
    payments: [makePayment()],
    ...overrides,
  };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('TransactionHistoryDetailScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseHasPermission.mockReturnValue(false);
    (mockDatabase.get as jest.Mock).mockReturnValue({
      find: jest.fn().mockRejectedValue(new Error('not found')),
    });
  });

  describe('loading state', () => {
    it('shows ActivityIndicator while loading', () => {
      mockGetTransactionById.mockReturnValue(new Promise(() => {}));
      const { getByTestId } = render(
        <TransactionHistoryDetailScreen
          route={makeRoute() as any}
          navigation={makeNavigation() as any}
        />
      );
      expect(getByTestId('loading-indicator')).toBeTruthy();
    });
  });

  describe('transaction header', () => {
    it('displays transaction ID in #TXN-XXXXX format', async () => {
      mockGetTransactionById.mockResolvedValue(makeTransaction());
      const { getByText } = render(
        <TransactionHistoryDetailScreen
          route={makeRoute('txn-abc-12345') as any}
          navigation={makeNavigation() as any}
        />
      );
      await act(async () => {});
      expect(getByText('#TXN-12345')).toBeTruthy();
    });

    it('displays status badge', async () => {
      mockGetTransactionById.mockResolvedValue(makeTransaction({ status: 'FINALIZED' }));
      const { getByTestId } = render(
        <TransactionHistoryDetailScreen
          route={makeRoute() as any}
          navigation={makeNavigation() as any}
        />
      );
      await act(async () => {});
      expect(getByTestId('app-badge')).toBeTruthy();
    });

    it('shows Walk-in when no customer is resolved', async () => {
      mockGetTransactionById.mockResolvedValue(makeTransaction({ customerId: '' }));
      (mockDatabase.get as jest.Mock).mockReturnValue({
        find: jest.fn().mockRejectedValue(new Error('not found')),
      });
      const { getByText } = render(
        <TransactionHistoryDetailScreen
          route={makeRoute() as any}
          navigation={makeNavigation() as any}
        />
      );
      await act(async () => {});
      expect(getByText('Walk-in')).toBeTruthy();
    });
  });

  describe('line items', () => {
    it('renders each line item in read-only mode', async () => {
      const lineItems = [
        makeLineItem({ id: 'li-1', name: 'Engine Oil' }),
        makeLineItem({ id: 'li-2', name: 'Brake Pad' }),
      ];
      mockGetTransactionById.mockResolvedValue(makeTransaction({ lineItems }));
      const { getByTestId } = render(
        <TransactionHistoryDetailScreen
          route={makeRoute() as any}
          navigation={makeNavigation() as any}
        />
      );
      await act(async () => {});
      expect(getByTestId('line-item-Engine Oil')).toBeTruthy();
      expect(getByTestId('line-item-Brake Pad')).toBeTruthy();
    });
  });

  describe('totals', () => {
    it('shows subtotal, VAT, and total', async () => {
      const lineItems = [makeLineItem({ subtotal: 1000, vatAmount: 120, total: 1120 })];
      mockGetTransactionById.mockResolvedValue(makeTransaction({ lineItems }));
      const { getByText } = render(
        <TransactionHistoryDetailScreen
          route={makeRoute() as any}
          navigation={makeNavigation() as any}
        />
      );
      await act(async () => {});
      expect(getByText('Subtotal')).toBeTruthy();
      expect(getByText('VAT (12%)')).toBeTruthy();
      expect(getByText('Total')).toBeTruthy();
    });
  });

  describe('payments', () => {
    it('renders each payment record', async () => {
      const payments = [
        makePayment({ id: 'pay-1', method: 'CASH', amount: 500 }),
        makePayment({ id: 'pay-2', method: 'GCASH', amount: 500, referenceNumber: 'REF123' }),
      ];
      mockGetTransactionById.mockResolvedValue(makeTransaction({ payments }));
      const { getByText } = render(
        <TransactionHistoryDetailScreen
          route={makeRoute() as any}
          navigation={makeNavigation() as any}
        />
      );
      await act(async () => {});
      expect(getByText('Cash')).toBeTruthy();
      expect(getByText('GCash')).toBeTruthy();
      expect(getByText('Ref: REF123')).toBeTruthy();
    });

    it('does not render payments section when there are no payments', async () => {
      mockGetTransactionById.mockResolvedValue(makeTransaction({ payments: [] }));
      const { queryByText } = render(
        <TransactionHistoryDetailScreen
          route={makeRoute() as any}
          navigation={makeNavigation() as any}
        />
      );
      await act(async () => {});
      expect(queryByText('Payments')).toBeNull();
    });
  });

  describe('action buttons', () => {
    it('does not show action buttons when user lacks VOID_TRANSACTIONS permission', async () => {
      mockUseHasPermission.mockReturnValue(false);
      mockGetTransactionById.mockResolvedValue(makeTransaction());
      const { queryByTestId } = render(
        <TransactionHistoryDetailScreen
          route={makeRoute() as any}
          navigation={makeNavigation() as any}
        />
      );
      await act(async () => {});
      expect(queryByTestId('btn-Void Transaction')).toBeNull();
      expect(queryByTestId('btn-Process Return')).toBeNull();
    });

    it('shows Void Transaction and Process Return buttons when user has VOID_TRANSACTIONS permission', async () => {
      mockUseHasPermission.mockReturnValue(true);
      mockGetTransactionById.mockResolvedValue(makeTransaction({ hasReturn: false }));
      const { getByTestId } = render(
        <TransactionHistoryDetailScreen
          route={makeRoute() as any}
          navigation={makeNavigation() as any}
        />
      );
      await act(async () => {});
      expect(getByTestId('btn-Void Transaction')).toBeTruthy();
      expect(getByTestId('btn-Process Return')).toBeTruthy();
    });

    it('disables Void Transaction button when has_return is true', async () => {
      mockUseHasPermission.mockReturnValue(true);
      mockGetTransactionById.mockResolvedValue(makeTransaction({ hasReturn: true }));
      const { getByTestId, getByText } = render(
        <TransactionHistoryDetailScreen
          route={makeRoute() as any}
          navigation={makeNavigation() as any}
        />
      );
      await act(async () => {});
      expect(getByTestId('btn-Void Transaction').props.accessibilityState.disabled).toBe(true);
      expect(getByText(/Cannot void/)).toBeTruthy();
    });

    it('navigates to VoidTransaction screen on Void button press', async () => {
      mockUseHasPermission.mockReturnValue(true);
      mockGetTransactionById.mockResolvedValue(makeTransaction({ hasReturn: false }));
      const navigate = jest.fn();
      const { getByText } = render(
        <TransactionHistoryDetailScreen
          route={makeRoute('txn-abc-12345') as any}
          navigation={makeNavigation({ navigate }) as any}
        />
      );
      await act(async () => {});
      fireEvent.press(getByText('Void Transaction'));
      expect(navigate).toHaveBeenCalledWith('VoidTransaction', { transactionId: 'txn-abc-12345' });
    });

    it('navigates to ReturnTransaction screen on Process Return button press', async () => {
      mockUseHasPermission.mockReturnValue(true);
      mockGetTransactionById.mockResolvedValue(makeTransaction({ hasReturn: false }));
      const navigate = jest.fn();
      const { getByText } = render(
        <TransactionHistoryDetailScreen
          route={makeRoute('txn-abc-12345') as any}
          navigation={makeNavigation({ navigate }) as any}
        />
      );
      await act(async () => {});
      fireEvent.press(getByText('Process Return'));
      expect(navigate).toHaveBeenCalledWith('ReturnTransaction', { transactionId: 'txn-abc-12345' });
    });
  });
});
