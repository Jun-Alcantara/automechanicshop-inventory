import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ScreenWrapper } from '@components/layout/ScreenWrapper';
import { AppButton } from '@components/common/AppButton';
import { AppInput } from '@components/common/AppInput';
import { usePermissionGuard } from '@hooks/usePermissionGuard';
import { useSessionStore } from '@stores/sessionStore';
import { setCustomerSearchCallback } from '@screens/modals/CustomerSearchModal';
import { createTransaction } from '@services/transactionService';
import { searchCustomers, createCustomer } from '@services/customerService';
import { Colors, Spacing, Typography, BorderRadius } from '@constants/theme';
import { PERMISSIONS } from '@constants/permissions';

export const NewTransactionScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const isAuthorized = usePermissionGuard(PERMISSIONS.CREATE_TRANSACTIONS);

  const user = useSessionStore((s) => s.user);

  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [selectedCustomerName, setSelectedCustomerName] = useState<string | null>(null);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const [walkInNickname, setWalkInNickname] = useState('');
  const [showWalkInInput, setShowWalkInInput] = useState(false);
  const [walkInLoading, setWalkInLoading] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!isAuthorized) return null;

  // ─── Customer search ───────────────────────────────────────────────────────

  const handleSearchCustomer = () => {
    setCustomerSearchCallback(async (customerId, vehicleId) => {
      setSelectedCustomerId(customerId);
      const results = await searchCustomers('');
      const found = results.find((c) => c.id === customerId);
      setSelectedCustomerName(found?.name ?? customerId);
      setSelectedVehicleId(vehicleId ?? null);
    });
    navigation.navigate('CustomerSearch');
  };

  // ─── Walk-in ───────────────────────────────────────────────────────────────

  const handleWalkIn = async () => {
    const nickname = walkInNickname.trim();
    if (!nickname || !user) return;

    setWalkInLoading(true);
    try {
      const existing = await searchCustomers(nickname);
      const match = existing.find(
        (c) =>
          c.type === 'WALKIN' &&
          c.name.toLowerCase() === nickname.toLowerCase()
      );

      if (match) {
        Alert.alert('Existing Walk-in', `Link to existing record "${match.name}"?`, [
          {
            text: 'Yes',
            onPress: () => {
              setSelectedCustomerId(match.id);
              setSelectedCustomerName(match.name);
              setShowWalkInInput(false);
              setWalkInNickname('');
            },
          },
          {
            text: 'No, New',
            onPress: async () => {
              const created = await createCustomer(
                { type: 'WALKIN', name: nickname },
                user
              );
              setSelectedCustomerId(created.id);
              setSelectedCustomerName(created.name);
              setShowWalkInInput(false);
              setWalkInNickname('');
            },
          },
        ]);
      } else {
        const created = await createCustomer(
          { type: 'WALKIN', name: nickname },
          user
        );
        setSelectedCustomerId(created.id);
        setSelectedCustomerName(created.name);
        setShowWalkInInput(false);
        setWalkInNickname('');
      }
    } finally {
      setWalkInLoading(false);
    }
  };

  // ─── Start transaction ─────────────────────────────────────────────────────

  const handleStart = async () => {
    if (!selectedCustomerId || !user) return;
    setLoading(true);
    try {
      const input: { customerId: string; cashierId: string; vehicleId?: string } = {
        customerId: selectedCustomerId,
        cashierId: user.id,
      };
      if (selectedVehicleId) input.vehicleId = selectedVehicleId;
      const transaction = await createTransaction(input, user);
      navigation.replace('TransactionDetail', { transactionId: transaction.id });
    } finally {
      setLoading(false);
    }
  };

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <ScreenWrapper>
      <View style={styles.container}>

        {/* Customer section */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Customer</Text>

          {selectedCustomerName ? (
            <View style={styles.selectedRow}>
              <Text style={styles.selectedName} numberOfLines={1}>
                {selectedCustomerName}
              </Text>
              <TouchableOpacity onPress={handleSearchCustomer} style={styles.changeBtn}>
                <Text style={styles.changeBtnText}>Change</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.customerActions}>
              <AppButton
                label="Search Customer"
                onPress={handleSearchCustomer}
                style={styles.customerBtn}
              />
              <AppButton
                label={showWalkInInput ? 'Cancel Walk-in' : 'Walk-in Customer'}
                variant="secondary"
                onPress={() => {
                  setShowWalkInInput((v) => !v);
                  setWalkInNickname('');
                }}
                style={styles.customerBtn}
              />
            </View>
          )}

          {/* Walk-in inline input */}
          {showWalkInInput && (
            <View style={styles.walkInBox}>
              <AppInput
                placeholder="Nickname / Walk-in label"
                value={walkInNickname}
                onChangeText={setWalkInNickname}
                autoFocus
              />
              <AppButton
                label={walkInLoading ? 'Saving…' : 'Confirm'}
                onPress={handleWalkIn}
                disabled={walkInLoading || walkInNickname.trim().length === 0}
                style={styles.walkInConfirmBtn}
              />
            </View>
          )}
        </View>

        {/* Vehicle section — only shown after customer selected */}
        {selectedCustomerId ? (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Vehicle (optional)</Text>
            <TouchableOpacity
              style={styles.vehicleRow}
              onPress={handleSearchCustomer}
              activeOpacity={0.7}
            >
              <Text style={styles.vehicleRowText}>
                {selectedVehicleId ? `Vehicle selected` : 'Select vehicle (optional)'}
              </Text>
              <Text style={styles.vehicleRowChevron}>›</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {/* Start button */}
        <View style={styles.footer}>
          <AppButton
            label="Start Transaction"
            onPress={handleStart}
            disabled={!selectedCustomerId || loading}
            loading={loading}
          />
        </View>
      </View>
    </ScreenWrapper>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: {
    fontSize: Typography.xl,
    fontWeight: Typography.semiBold,
    color: Colors.black,
  },
  section: {
    backgroundColor: Colors.surface,
    marginTop: Spacing.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.sm,
  },
  sectionLabel: {
    fontSize: Typography.sm,
    fontWeight: Typography.medium,
    color: Colors.gray500,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  customerActions: {
    gap: Spacing.sm,
  },
  customerBtn: {
    width: '100%',
  },
  selectedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
  },
  selectedName: {
    flex: 1,
    fontSize: Typography.base,
    fontWeight: Typography.medium,
    color: Colors.black,
  },
  changeBtn: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  changeBtnText: {
    fontSize: Typography.sm,
    color: Colors.primary,
    fontWeight: Typography.medium,
  },
  walkInBox: {
    gap: Spacing.sm,
    backgroundColor: Colors.primaryLight,
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  walkInConfirmBtn: {
    alignSelf: 'flex-end',
  },
  vehicleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
  },
  vehicleRowText: {
    fontSize: Typography.base,
    color: Colors.gray500,
  },
  vehicleRowChevron: {
    fontSize: Typography.xl,
    color: Colors.gray300,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: Spacing.md,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
});
