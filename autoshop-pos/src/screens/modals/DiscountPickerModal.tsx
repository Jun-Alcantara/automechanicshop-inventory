import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { ScreenWrapper } from '@components/layout/ScreenWrapper';
import { AppInput } from '@components/common/AppInput';
import { AppButton } from '@components/common/AppButton';
import { Colors, Spacing, Typography, BorderRadius } from '@constants/theme';
import type { RootStackParamList } from '@navigation/types';

// ─── Types ────────────────────────────────────────────────────────────────────

type DiscountType = 'FIXED' | 'PERCENTAGE';

export type DiscountPayload = {
  type: DiscountType;
  value: number;
} | null;

// ─── Module-level callback ref ────────────────────────────────────────────────

let _pendingOnApply: ((payload: DiscountPayload) => void) | null = null;

export const setDiscountCallback = (cb: (payload: DiscountPayload) => void) => {
  _pendingOnApply = cb;
};

// ─── Modal ────────────────────────────────────────────────────────────────────

export const DiscountPickerModal: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<RootStackParamList, 'DiscountPicker'>>();
  const params = route.params ?? {};

  const [discountType, setDiscountType] = useState<DiscountType>(
    params.currentDiscountType ?? 'FIXED'
  );
  const [value, setValue] = useState(
    params.currentDiscountValue ? String(params.currentDiscountValue) : ''
  );
  const [error, setError] = useState<string | null>(null);

  const isValid = (num: number): boolean => {
    if (isNaN(num) || num <= 0) return false;
    if (discountType === 'PERCENTAGE' && num > 100) return false;
    return true;
  };

  const handleToggle = (type: DiscountType) => {
    setDiscountType(type);
    setValue('');
    setError(null);
  };

  const handleApply = () => {
    const numericValue = parseFloat(value);
    if (!isValid(numericValue)) {
      if (isNaN(numericValue) || numericValue <= 0) {
        setError('Please enter a value greater than 0.');
      } else if (discountType === 'PERCENTAGE' && numericValue > 100) {
        setError('Percentage must be between 1 and 100.');
      }
      return;
    }
    setError(null);
    _pendingOnApply?.({ type: discountType, value: numericValue });
    _pendingOnApply = null;
    navigation.goBack();
  };

  const handleRemove = () => {
    _pendingOnApply?.(null);
    _pendingOnApply = null;
    navigation.goBack();
  };

  const amountLabel =
    discountType === 'FIXED' ? 'Discount Amount (₱)' : 'Discount %';

  return (
    <ScreenWrapper>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Apply Discount</Text>
      </View>

      <View style={styles.body}>
        {/* Toggle row */}
        <View style={styles.toggleRow}>
          <TouchableOpacity
            style={[styles.toggleOption, discountType === 'FIXED' && styles.toggleOptionActive]}
            onPress={() => handleToggle('FIXED')}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.toggleLabel,
                discountType === 'FIXED' && styles.toggleLabelActive,
              ]}
            >
              Fixed Amount
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleOption, discountType === 'PERCENTAGE' && styles.toggleOptionActive]}
            onPress={() => handleToggle('PERCENTAGE')}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.toggleLabel,
                discountType === 'PERCENTAGE' && styles.toggleLabelActive,
              ]}
            >
              Percentage
            </Text>
          </TouchableOpacity>
        </View>

        {/* Amount input */}
        <View style={styles.inputWrapper}>
          <Text style={styles.inputLabel}>{amountLabel}</Text>
          <AppInput
            placeholder={discountType === 'FIXED' ? '0.00' : '0'}
            value={value}
            onChangeText={(text) => {
              setValue(text);
              setError(null);
            }}
            keyboardType="numeric"
          />
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
        </View>

        {/* Buttons */}
        <View style={styles.actions}>
          {params.currentDiscountType ? (
            <AppButton
              label="Remove Discount"
              variant="danger"
              onPress={handleRemove}
              fullWidth
            />
          ) : null}
          <AppButton
            label="Apply"
            onPress={handleApply}
            fullWidth
          />
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
    gap: Spacing.lg,
  },
  toggleRow: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
  },
  toggleOption: {
    flex: 1,
    paddingVertical: Spacing.sm + 2,
    alignItems: 'center',
    backgroundColor: Colors.surface,
  },
  toggleOptionActive: {
    backgroundColor: Colors.primary,
  },
  toggleLabel: {
    fontSize: Typography.base,
    fontWeight: Typography.medium,
    color: Colors.primary,
  },
  toggleLabelActive: {
    color: Colors.white,
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
  },
});
