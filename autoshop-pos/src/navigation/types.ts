import type { StackScreenProps } from '@react-navigation/stack';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { CompositeScreenProps, NavigatorScreenParams } from '@react-navigation/native';

// ─── Root Stack ───────────────────────────────────────────────────────────────

export type RootStackParamList = {
  InitSetup: undefined;
  PinLock: undefined;
  MainTabs: NavigatorScreenParams<MainTabParamList>;
  BarcodeScanner: undefined;
  CustomerSearch: undefined;
  DiscountPicker: {
    currentDiscountType?: 'FIXED' | 'PERCENTAGE';
    currentDiscountValue?: number;
  };
  AddOnPicker: undefined;
};

// ─── Main Tab Navigator ───────────────────────────────────────────────────────

export type MainTabParamList = {
  Dashboard: undefined;
  Transactions: NavigatorScreenParams<TransactionsStackParamList>;
  Inventory: NavigatorScreenParams<InventoryStackParamList>;
  Admin: NavigatorScreenParams<AdminStackParamList>;
};

// ─── Transactions Stack ───────────────────────────────────────────────────────

export type TransactionsStackParamList = {
  TransactionList: undefined;
  NewTransaction: undefined;
  CustomerSearch: undefined;
  CustomerForm: { customerId?: string };
  VehicleSelection: { customerId: string; customerName: string };
  TransactionDetail: { transactionId: string };
  Payment: { transactionId: string };
  Receipt: { transactionId: string };
  TransactionHistoryDetail: { transactionId: string };
  VoidTransaction: { transactionId: string };
  ReturnTransaction: { transactionId: string };
};

// ─── Inventory Stack ──────────────────────────────────────────────────────────

export type InventoryStackParamList = {
  InventoryList: undefined;
  ProductForm: { productId?: string };    // undefined = create; string = edit
  ServiceForm: { serviceId?: string };
  CategoryList: undefined;
  SupplierList: undefined;
  AddOnCatalog: undefined;
};

// ─── Admin Stack ──────────────────────────────────────────────────────────────

export type AdminStackParamList = {
  AdminMenu: undefined;
  Reports: undefined;
  AuditLog: undefined;
  CustomerList: undefined;
  CustomerDetail: { customerId: string };
  CustomerForm: { customerId?: string };
  VehicleDetail: { vehicleId: string };
  VehicleForm: { vehicleId?: string; customerId: string };
  UserList: undefined;
  UserForm: { userId?: string };
  Settings: undefined;
  ChangeOwnPin: undefined;
};

// ─── Modal Screens (presented over any stack) ────────────────────────────────

export type ModalParamList = {
  BarcodeScanner: {
    onScan: (barcode: string) => void;
  };
  DiscountPicker: {
    lineItemId: string;
    currentDiscountType: string;
    currentDiscountValue: number;
    onApply: (type: 'FIXED' | 'PERCENTAGE', value: number) => void;
  };
  AddOnPicker: {
    lineItemId: string;
    onApply: (name: string, amount: number, isOnTheFly: boolean, addOnId?: string) => void;
  };
  CustomerSearch: {
    onSelect: (customerId: string, vehicleId?: string) => void;
  };
};

// ─── Screen prop helpers ──────────────────────────────────────────────────────

export type RootStackScreenProps<T extends keyof RootStackParamList> =
  StackScreenProps<RootStackParamList, T>;

export type TransactionsStackScreenProps<T extends keyof TransactionsStackParamList> =
  CompositeScreenProps<
    StackScreenProps<TransactionsStackParamList, T>,
    CompositeScreenProps<
      BottomTabScreenProps<MainTabParamList>,
      StackScreenProps<RootStackParamList>
    >
  >;

export type InventoryStackScreenProps<T extends keyof InventoryStackParamList> =
  CompositeScreenProps<
    StackScreenProps<InventoryStackParamList, T>,
    CompositeScreenProps<
      BottomTabScreenProps<MainTabParamList>,
      StackScreenProps<RootStackParamList>
    >
  >;

export type AdminStackScreenProps<T extends keyof AdminStackParamList> =
  CompositeScreenProps<
    StackScreenProps<AdminStackParamList, T>,
    CompositeScreenProps<
      BottomTabScreenProps<MainTabParamList>,
      StackScreenProps<RootStackParamList>
    >
  >;
