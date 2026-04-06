import React from 'react';
import { render, act } from '@testing-library/react-native';
import { DashboardScreen } from '../DashboardScreen';

// ─── Mocks ────────────────────────────────────────────────────────────────────

jest.mock('@react-navigation/native', () => ({
  useFocusEffect: (cb: () => void) => { cb(); },
}));

jest.mock('@services/transactionService', () => ({
  fetchTodayStats: jest.fn(),
}));

jest.mock('@stores/inventoryStore', () => ({
  useInventoryStore: jest.fn(),
}));

jest.mock('@components/layout/ScreenWrapper', () => ({
  ScreenWrapper: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

jest.mock('@stores/sessionStore', () => ({
  useSessionStore: jest.fn(() => ({ refreshActivity: jest.fn() })),
}));

import { fetchTodayStats } from '@services/transactionService';
import { useInventoryStore } from '@stores/inventoryStore';

const mockFetchTodayStats = fetchTodayStats as jest.Mock;
const mockUseInventoryStore = useInventoryStore as unknown as jest.Mock;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeProduct(overrides: Record<string, unknown> = {}) {
  return {
    id: 'prod-1',
    name: 'Engine Oil',
    stockAvailable: 3,
    lowStockThreshold: 5,
    ...overrides,
  };
}

function makeTodayStats(overrides: Partial<{
  totalSales: number;
  orderCount: number;
  topSellingParts: { refId: string; name: string; quantity: number }[];
}> = {}) {
  return {
    totalSales: 5000,
    orderCount: 3,
    topSellingParts: [
      { refId: 'p1', name: 'Engine Oil', quantity: 10 },
      { refId: 'p2', name: 'Brake Pad', quantity: 6 },
    ],
    ...overrides,
  };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('DashboardScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseInventoryStore.mockReturnValue({ products: [] });
    mockFetchTodayStats.mockResolvedValue(makeTodayStats());
  });

  describe('KPI cards', () => {
    it('shows placeholder dashes before stats load', () => {
      // fetchTodayStats never resolves so stats stay null
      mockFetchTodayStats.mockReturnValue(new Promise(() => {}));
      const { getByTestId } = render(<DashboardScreen />);
      expect(getByTestId('kpi-total-sales').props.children).toBe('—');
      expect(getByTestId('kpi-order-count').props.children).toBe('—');
    });

    it('displays formatted total sales after stats load', async () => {
      mockFetchTodayStats.mockResolvedValue(makeTodayStats({ totalSales: 5000 }));
      const { getByTestId } = render(<DashboardScreen />);
      await act(async () => {});
      expect(getByTestId('kpi-total-sales').props.children).toBe('₱5,000.00');
    });

    it('displays order count after stats load', async () => {
      mockFetchTodayStats.mockResolvedValue(makeTodayStats({ orderCount: 7 }));
      const { getByTestId } = render(<DashboardScreen />);
      await act(async () => {});
      expect(getByTestId('kpi-order-count').props.children).toBe('7');
    });

    it('displays zero order count when there are no orders', async () => {
      mockFetchTodayStats.mockResolvedValue(makeTodayStats({ orderCount: 0 }));
      const { getByTestId } = render(<DashboardScreen />);
      await act(async () => {});
      expect(getByTestId('kpi-order-count').props.children).toBe('0');
    });
  });

  describe('Top Selling Parts section', () => {
    it('shows EmptyState when there are no top parts', async () => {
      mockFetchTodayStats.mockResolvedValue(makeTodayStats({ topSellingParts: [] }));
      const { getByText } = render(<DashboardScreen />);
      await act(async () => {});
      expect(getByText('No sales today')).toBeTruthy();
    });

    it('shows EmptyState while stats have not loaded yet', () => {
      mockFetchTodayStats.mockReturnValue(new Promise(() => {}));
      const { getByText } = render(<DashboardScreen />);
      expect(getByText('No sales today')).toBeTruthy();
    });

    it('renders a row for each top selling part', async () => {
      const parts = [
        { refId: 'p1', name: 'Engine Oil', quantity: 10 },
        { refId: 'p2', name: 'Brake Pad', quantity: 6 },
        { refId: 'p3', name: 'Air Filter', quantity: 4 },
      ];
      mockFetchTodayStats.mockResolvedValue(makeTodayStats({ topSellingParts: parts }));
      const { getByTestId } = render(<DashboardScreen />);
      await act(async () => {});
      expect(getByTestId('top-part-p1')).toBeTruthy();
      expect(getByTestId('top-part-p2')).toBeTruthy();
      expect(getByTestId('top-part-p3')).toBeTruthy();
    });

    it('renders part names in the top parts list', async () => {
      const parts = [{ refId: 'p1', name: 'Engine Oil', quantity: 10 }];
      mockFetchTodayStats.mockResolvedValue(makeTodayStats({ topSellingParts: parts }));
      const { getByText } = render(<DashboardScreen />);
      await act(async () => {});
      expect(getByText('Engine Oil')).toBeTruthy();
      expect(getByText('10 sold')).toBeTruthy();
    });

    it('calls fetchTodayStats when screen comes into focus', async () => {
      render(<DashboardScreen />);
      await act(async () => {});
      expect(mockFetchTodayStats).toHaveBeenCalled();
    });
  });

  describe('Low Stock Alerts section', () => {
    it('shows EmptyState when no products are low on stock', async () => {
      mockUseInventoryStore.mockReturnValue({ products: [] });
      const { getByText } = render(<DashboardScreen />);
      await act(async () => {});
      expect(getByText('No low stock items')).toBeTruthy();
    });

    it('shows EmptyState when all products are above threshold', async () => {
      mockUseInventoryStore.mockReturnValue({
        products: [makeProduct({ stockAvailable: 20, lowStockThreshold: 5 })],
      });
      const { getByText } = render(<DashboardScreen />);
      await act(async () => {});
      expect(getByText('No low stock items')).toBeTruthy();
    });

    it('renders a row for each product at or below threshold', async () => {
      mockUseInventoryStore.mockReturnValue({
        products: [
          makeProduct({ id: 'p1', stockAvailable: 3, lowStockThreshold: 5 }),
          makeProduct({ id: 'p2', stockAvailable: 5, lowStockThreshold: 5 }),
          makeProduct({ id: 'p3', stockAvailable: 20, lowStockThreshold: 5 }),
        ],
      });
      const { getByTestId, queryByTestId } = render(<DashboardScreen />);
      await act(async () => {});
      expect(getByTestId('low-stock-p1')).toBeTruthy();
      expect(getByTestId('low-stock-p2')).toBeTruthy();
      expect(queryByTestId('low-stock-p3')).toBeNull();
    });

    it('renders the product name in each low stock row', async () => {
      mockUseInventoryStore.mockReturnValue({
        products: [makeProduct({ id: 'p1', name: 'Brake Fluid', stockAvailable: 2, lowStockThreshold: 5 })],
      });
      const { getByText } = render(<DashboardScreen />);
      await act(async () => {});
      expect(getByText('Brake Fluid')).toBeTruthy();
    });
  });
});
