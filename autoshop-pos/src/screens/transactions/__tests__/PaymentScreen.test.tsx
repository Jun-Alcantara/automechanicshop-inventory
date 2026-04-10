import React from 'react';
import { render, act, fireEvent, waitFor } from '@testing-library/react-native';
import { PaymentScreen } from '../PaymentScreen';

// ─── Mocks ────────────────────────────────────────────────────────────────────

jest.mock('@services/transactionService', () => ({
  getTransactionById: jest.fn(),
  finalizeTransaction: jest.fn(),
}));

jest.mock('@stores/sessionStore', () => ({
  useSessionStore: jest.fn(),
}));

jest.mock('@stores/transactionDraftStore', () => ({
  useTransactionDraftStore: jest.fn(),
}));

jest.mock('@components/layout/ScreenWrapper', () => ({
  ScreenWrapper: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

jest.mock('@components/common/LoadingOverlay', () => ({
  LoadingOverlay: ({ visible }: { visible: boolean }) => {
    const { View } = require('react-native');
    return visible ? <View testID="loading-overlay" /> : null;
  },
}));

jest.mock('@components/common/AppButton', () => ({
  AppButton: ({
    label,
    onPress,
    disabled,
  }: {
    label: string;
    onPress: () => void;
    disabled?: boolean;
  }) => {
    const { View, Text } = require('react-native');
    return (
      <View testID={`btn-${label}`} accessibilityState={{ disabled: !!disabled }}>
        <Text onPress={!disabled ? onPress : undefined}>{label}</Text>
      </View>
    );
  },
}));

jest.mock('expo-image-picker', () => ({
  requestMediaLibraryPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  launchImageLibraryAsync: jest.fn().mockResolvedValue({ canceled: true, assets: [] }),
}));

import { getTransactionById, finalizeTransaction } from '@services/transactionService';
import { useSessionStore } from '@stores/sessionStore';
import { useTransactionDraftStore } from '@stores/transactionDraftStore';

const mockGetTransaction = getTransactionById as jest.Mock;
const mockFinalizeTransaction = finalizeTransaction as jest.Mock;
const mockUseSessionStore = useSessionStore as unknown as jest.Mock;
const mockUseTransactionDraftStore = useTransactionDraftStore as unknown as jest.Mock;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeNavigation(overrides: Record<string, jest.Mock> = {}) {
  return {
    navigate: jest.fn(),
    goBack: jest.fn(),
    replace: jest.fn(),
    ...overrides,
  };
}

function makeRoute(transactionId = 'txn-001') {
  return { params: { transactionId } };
}

function makeUser() {
  return {
    id: 'user-1',
    displayName: 'Cashier',
    permissions: [],
    isMainAdmin: false,
    isActive: true,
  };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('PaymentScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockUseSessionStore.mockImplementation((selector: any) =>
      selector({ user: makeUser(), status: 'ACTIVE' })
    );

    mockUseTransactionDraftStore.mockReturnValue({
      draft: null,
      openDraft: jest.fn().mockResolvedValue(undefined),
    });

    mockGetTransaction.mockResolvedValue({
      id: 'txn-001',
      totalAmount: 1000,
      status: 'OPEN',
    });

    mockFinalizeTransaction.mockResolvedValue(undefined);
  });

  describe('total display', () => {
    it('shows the transaction total fetched from service', async () => {
      const { getByTestId } = render(
        <PaymentScreen route={makeRoute() as any} navigation={makeNavigation() as any} />
      );
      await act(async () => {});
      expect(getByTestId('total-amount').props.children).toContain('1,000');
    });

    it('uses draft totalAmount when draft is already loaded', async () => {
      mockUseTransactionDraftStore.mockReturnValue({
        draft: { id: 'txn-001', totalAmount: 2500 },
        openDraft: jest.fn(),
      });
      const { getByTestId } = render(
        <PaymentScreen route={makeRoute() as any} navigation={makeNavigation() as any} />
      );
      await act(async () => {});
      expect(getByTestId('total-amount').props.children).toContain('2,500');
    });
  });

  describe('payment method selector', () => {
    it('renders Cash, GCash, and Maya method buttons', async () => {
      const { getByTestId } = render(
        <PaymentScreen route={makeRoute() as any} navigation={makeNavigation() as any} />
      );
      await act(async () => {});
      expect(getByTestId('method-CASH')).toBeTruthy();
      expect(getByTestId('method-GCASH')).toBeTruthy();
      expect(getByTestId('method-MAYA')).toBeTruthy();
    });

    it('hides reference number and photo when Cash is selected', async () => {
      const { queryByTestId } = render(
        <PaymentScreen route={makeRoute() as any} navigation={makeNavigation() as any} />
      );
      await act(async () => {});
      expect(queryByTestId('reference-input')).toBeNull();
      expect(queryByTestId('attach-photo-btn')).toBeNull();
    });

    it('shows reference number and photo fields when GCash is selected', async () => {
      const { getByTestId } = render(
        <PaymentScreen route={makeRoute() as any} navigation={makeNavigation() as any} />
      );
      await act(async () => {});
      fireEvent.press(getByTestId('method-GCASH'));
      expect(getByTestId('reference-input')).toBeTruthy();
      expect(getByTestId('attach-photo-btn')).toBeTruthy();
    });

    it('shows reference number and photo fields when Maya is selected', async () => {
      const { getByTestId } = render(
        <PaymentScreen route={makeRoute() as any} navigation={makeNavigation() as any} />
      );
      await act(async () => {});
      fireEvent.press(getByTestId('method-MAYA'));
      expect(getByTestId('reference-input')).toBeTruthy();
      expect(getByTestId('attach-photo-btn')).toBeTruthy();
    });
  });

  describe('Add Payment button', () => {
    it('is disabled when amount is empty', async () => {
      const { getByTestId } = render(
        <PaymentScreen route={makeRoute() as any} navigation={makeNavigation() as any} />
      );
      await act(async () => {});
      expect(getByTestId('btn-Add Payment').props.accessibilityState.disabled).toBe(true);
    });

    it('is enabled when Cash method has a valid amount', async () => {
      const { getByTestId } = render(
        <PaymentScreen route={makeRoute() as any} navigation={makeNavigation() as any} />
      );
      await act(async () => {});
      fireEvent.changeText(getByTestId('amount-input'), '500');
      expect(getByTestId('btn-Add Payment').props.accessibilityState.disabled).toBe(false);
    });

    it('is disabled for GCash without a reference number', async () => {
      const { getByTestId } = render(
        <PaymentScreen route={makeRoute() as any} navigation={makeNavigation() as any} />
      );
      await act(async () => {});
      fireEvent.press(getByTestId('method-GCASH'));
      fireEvent.changeText(getByTestId('amount-input'), '500');
      expect(getByTestId('btn-Add Payment').props.accessibilityState.disabled).toBe(true);
    });

    it('is enabled for GCash when amount and reference number are provided', async () => {
      const { getByTestId } = render(
        <PaymentScreen route={makeRoute() as any} navigation={makeNavigation() as any} />
      );
      await act(async () => {});
      fireEvent.press(getByTestId('method-GCASH'));
      fireEvent.changeText(getByTestId('amount-input'), '500');
      fireEvent.changeText(getByTestId('reference-input'), 'REF123');
      expect(getByTestId('btn-Add Payment').props.accessibilityState.disabled).toBe(false);
    });
  });

  describe('adding payments', () => {
    it('adds a Cash payment and shows it in the list', async () => {
      const { getByTestId, getByText } = render(
        <PaymentScreen route={makeRoute() as any} navigation={makeNavigation() as any} />
      );
      await act(async () => {});
      fireEvent.changeText(getByTestId('amount-input'), '500');
      fireEvent.press(getByText('Add Payment'));
      expect(getByTestId('payment-row-0')).toBeTruthy();
      expect(getByTestId('payment-row-0')).toBeTruthy();
    });

    it('clears input fields after adding payment', async () => {
      const { getByTestId, getByText } = render(
        <PaymentScreen route={makeRoute() as any} navigation={makeNavigation() as any} />
      );
      await act(async () => {});
      fireEvent.changeText(getByTestId('amount-input'), '500');
      fireEvent.press(getByText('Add Payment'));
      expect(getByTestId('amount-input').props.value).toBe('');
    });

    it('removes a payment row when × is pressed', async () => {
      const { getByTestId, getByText, queryByTestId } = render(
        <PaymentScreen route={makeRoute() as any} navigation={makeNavigation() as any} />
      );
      await act(async () => {});
      fireEvent.changeText(getByTestId('amount-input'), '500');
      fireEvent.press(getByText('Add Payment'));
      expect(getByTestId('payment-row-0')).toBeTruthy();
      fireEvent.press(getByTestId('remove-payment-0'));
      expect(queryByTestId('payment-row-0')).toBeNull();
    });

    it('shows reference number in payment row for GCash', async () => {
      const { getByTestId, getByText } = render(
        <PaymentScreen route={makeRoute() as any} navigation={makeNavigation() as any} />
      );
      await act(async () => {});
      fireEvent.press(getByTestId('method-GCASH'));
      fireEvent.changeText(getByTestId('amount-input'), '500');
      fireEvent.changeText(getByTestId('reference-input'), 'REF-XYZ');
      fireEvent.press(getByText('Add Payment'));
      expect(getByText('Ref: REF-XYZ')).toBeTruthy();
    });
  });

  describe('remaining balance', () => {
    it('decreases as payments are added', async () => {
      const { getByTestId, getByText } = render(
        <PaymentScreen route={makeRoute() as any} navigation={makeNavigation() as any} />
      );
      await act(async () => {});
      fireEvent.changeText(getByTestId('amount-input'), '600');
      fireEvent.press(getByText('Add Payment'));
      const remaining = getByTestId('remaining-balance').props.children;
      expect(remaining).toContain('400');
    });
  });

  describe('cash change', () => {
    it('shows cash change row only when cash payments exist', async () => {
      const { getByTestId, getByText, queryByTestId } = render(
        <PaymentScreen route={makeRoute() as any} navigation={makeNavigation() as any} />
      );
      await act(async () => {});
      expect(queryByTestId('cash-change')).toBeNull();
      fireEvent.changeText(getByTestId('amount-input'), '1200');
      fireEvent.press(getByText('Add Payment'));
      expect(getByTestId('cash-change')).toBeTruthy();
      expect(getByTestId('cash-change').props.children).toContain('200');
    });
  });

  describe('Finalize button', () => {
    it('is disabled when total paid is less than total amount', async () => {
      const { getByTestId } = render(
        <PaymentScreen route={makeRoute() as any} navigation={makeNavigation() as any} />
      );
      await act(async () => {});
      expect(getByTestId('btn-Finalize').props.accessibilityState.disabled).toBe(true);
    });

    it('is enabled when total paid meets total amount', async () => {
      const { getByTestId, getByText } = render(
        <PaymentScreen route={makeRoute() as any} navigation={makeNavigation() as any} />
      );
      await act(async () => {});
      fireEvent.changeText(getByTestId('amount-input'), '1000');
      fireEvent.press(getByText('Add Payment'));
      expect(getByTestId('btn-Finalize').props.accessibilityState.disabled).toBe(false);
    });

    it('calls finalizeTransaction and navigates to Receipt on success', async () => {
      const replace = jest.fn();
      const { getByTestId, getByText } = render(
        <PaymentScreen
          route={makeRoute() as any}
          navigation={makeNavigation({ replace }) as any}
        />
      );
      await act(async () => {});
      fireEvent.changeText(getByTestId('amount-input'), '1000');
      fireEvent.press(getByText('Add Payment'));
      await act(async () => {
        fireEvent.press(getByText('Finalize'));
      });
      expect(mockFinalizeTransaction).toHaveBeenCalledWith(
        'txn-001',
        expect.arrayContaining([expect.objectContaining({ method: 'CASH', amount: 1000 })]),
        0,
        makeUser()
      );
      expect(replace).toHaveBeenCalledWith('Receipt', { transactionId: 'txn-001' });
    });

    it('shows LoadingOverlay during finalize', async () => {
      mockFinalizeTransaction.mockImplementation(() => new Promise(() => {}));
      const { getByTestId, getByText } = render(
        <PaymentScreen route={makeRoute() as any} navigation={makeNavigation() as any} />
      );
      await act(async () => {});
      fireEvent.changeText(getByTestId('amount-input'), '1000');
      fireEvent.press(getByText('Add Payment'));
      fireEvent.press(getByText('Finalize'));
      await waitFor(() => expect(getByTestId('loading-overlay')).toBeTruthy());
    });
  });

  describe('session lock guard', () => {
    it('navigates back when session becomes LOCKED', async () => {
      const goBack = jest.fn();
      mockUseSessionStore.mockImplementation((selector: any) =>
        selector({ user: makeUser(), status: 'LOCKED' })
      );
      render(
        <PaymentScreen
          route={makeRoute() as any}
          navigation={makeNavigation({ goBack }) as any}
        />
      );
      await act(async () => {});
      expect(goBack).toHaveBeenCalled();
    });
  });
});
