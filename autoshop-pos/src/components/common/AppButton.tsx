import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle } from 'react-native';
import { Colors, Spacing, Typography, BorderRadius } from '@constants/theme';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface AppButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  fullWidth?: boolean;
}

export const AppButton: React.FC<AppButtonProps> = ({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  style,
  fullWidth = false,
}) => {
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      style={[
        styles.base,
        styles[variant],
        styles[size],
        fullWidth && styles.fullWidth,
        isDisabled && styles.disabled,
        style,
      ]}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'primary' ? Colors.white : Colors.primary}
          size="small"
        />
      ) : (
        <Text style={[styles.label, styles[`${variant}Label`], styles[`${size}Label`]]}>
          {label}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.md,
  },
  fullWidth: { width: '100%' },
  disabled: { opacity: 0.5 },

  // Variants
  primary: { backgroundColor: Colors.primary },
  secondary: { backgroundColor: Colors.primaryLight, borderWidth: 1, borderColor: Colors.primary },
  danger: { backgroundColor: Colors.danger },
  ghost: { backgroundColor: 'transparent' },

  // Sizes
  sm: { paddingVertical: Spacing.xs, paddingHorizontal: Spacing.sm },
  md: { paddingVertical: Spacing.sm + 2, paddingHorizontal: Spacing.md },
  lg: { paddingVertical: Spacing.md, paddingHorizontal: Spacing.xl },

  // Labels
  label: { fontWeight: Typography.semiBold },
  primaryLabel: { color: Colors.white },
  secondaryLabel: { color: Colors.primary },
  dangerLabel: { color: Colors.white },
  ghostLabel: { color: Colors.primary },

  smLabel: { fontSize: Typography.sm },
  mdLabel: { fontSize: Typography.base },
  lgLabel: { fontSize: Typography.lg },
});
