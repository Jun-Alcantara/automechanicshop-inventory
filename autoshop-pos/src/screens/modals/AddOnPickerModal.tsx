import React, { useState } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ScreenWrapper } from '@components/layout/ScreenWrapper';
import { AppInput } from '@components/common/AppInput';
import { AppButton } from '@components/common/AppButton';
import { Colors, Spacing, Typography, BorderRadius } from '@constants/theme';
import { useCatalogStore } from '@stores/catalogStore';
import type { AddOn } from '@/types';

// ─── Types ────────────────────────────────────────────────────────────────────

export type AddOnPayload = {
  name: string;
  amount: number;
  isOnTheFly: boolean;
  addOnId?: string;
};

// ─── Module-level callback ref ────────────────────────────────────────────────

let _pendingOnApply: ((payload: AddOnPayload) => void) | null = null;

export const setAddOnCallback = (cb: (payload: AddOnPayload) => void) => {
  _pendingOnApply = cb;
};

// ─── Modal ────────────────────────────────────────────────────────────────────

export const AddOnPickerModal: React.FC = () => {
  const navigation = useNavigation();
  const addOns = useCatalogStore((s) => s.addOns).filter((a) => a.isActive);

  const [customName, setCustomName] = useState('');
  const [customAmount, setCustomAmount] = useState('');
  const [nameError, setNameError] = useState<string | null>(null);
  const [amountError, setAmountError] = useState<string | null>(null);

  const handleCatalogAdd = (addOn: AddOn) => {
    _pendingOnApply?.({ name: addOn.name, amount: addOn.amount, isOnTheFly: false, addOnId: addOn.id });
    _pendingOnApply = null;
    navigation.goBack();
  };

  const handleCustomAdd = () => {
    let valid = true;

    if (!customName.trim()) {
      setNameError('Name is required.');
      valid = false;
    } else {
      setNameError(null);
    }

    const amount = parseFloat(customAmount);
    if (!customAmount.trim() || isNaN(amount) || amount <= 0) {
      setAmountError('Enter a valid amount greater than 0.');
      valid = false;
    } else {
      setAmountError(null);
    }

    if (!valid) return;

    _pendingOnApply?.({ name: customName.trim(), amount, isOnTheFly: true });
    _pendingOnApply = null;
    navigation.goBack();
  };

  return (
    <ScreenWrapper>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Apply Add-On</Text>
      </View>

      <View style={styles.body}>
        {/* Section 1: From Catalog */}
        <Text style={styles.sectionLabel}>From Catalog</Text>
        {addOns.length === 0 ? (
          <Text style={styles.emptyText}>No add-ons in catalog.</Text>
        ) : (
          <FlatList
            data={addOns}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            renderItem={({ item }) => (
              <View style={styles.catalogRow}>
                <Text style={styles.catalogName}>{item.name}</Text>
                <Text style={styles.catalogAmount}>₱{item.amount.toFixed(2)}</Text>
                <AppButton
                  label="Add"
                  onPress={() => handleCatalogAdd(item)}
                />
              </View>
            )}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
          />
        )}

        {/* Section 2: Custom Add-On */}
        <Text style={[styles.sectionLabel, styles.sectionLabelSpaced]}>Custom Add-On</Text>

        <View style={styles.inputWrapper}>
          <Text style={styles.inputLabel}>Name</Text>
          <AppInput
            placeholder="Add-on name"
            value={customName}
            onChangeText={(text) => {
              setCustomName(text);
              setNameError(null);
            }}
          />
          {nameError ? <Text style={styles.errorText}>{nameError}</Text> : null}
        </View>

        <View style={styles.inputWrapper}>
          <Text style={styles.inputLabel}>Amount (₱)</Text>
          <AppInput
            placeholder="0.00"
            value={customAmount}
            onChangeText={(text) => {
              setCustomAmount(text);
              setAmountError(null);
            }}
            keyboardType="numeric"
          />
          {amountError ? <Text style={styles.errorText}>{amountError}</Text> : null}
        </View>

        <View style={styles.actions}>
          <AppButton label="Add Custom" onPress={handleCustomAdd} fullWidth />
          <AppButton
            label="Cancel"
            variant="secondary"
            onPress={() => navigation.goBack()}
            fullWidth
          />
        </View>
      </View>
    </ScreenWrapper>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  header: {
    paddingTop: Spacing.xl,
    paddingHorizontal: Spacing.md,
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
  body: {
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  sectionLabel: {
    fontSize: Typography.sm,
    fontWeight: Typography.semiBold,
    color: Colors.gray700,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionLabelSpaced: {
    marginTop: Spacing.lg,
  },
  emptyText: {
    fontSize: Typography.base,
    color: Colors.gray500,
    paddingVertical: Spacing.sm,
  },
  catalogRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  catalogName: {
    flex: 1,
    fontSize: Typography.base,
    color: Colors.black,
  },
  catalogAmount: {
    fontSize: Typography.base,
    fontWeight: Typography.medium,
    color: Colors.gray700,
    minWidth: 70,
    textAlign: 'right',
  },
  separator: {
    height: 1,
    backgroundColor: Colors.border,
  },
  inputWrapper: {
    gap: Spacing.xs,
  },
  inputLabel: {
    fontSize: Typography.sm,
    fontWeight: Typography.medium,
    color: Colors.gray700,
  },
  errorText: {
    fontSize: Typography.sm,
    color: Colors.danger,
    marginTop: Spacing.xs,
  },
  actions: {
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
});
