import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Spacing, Typography, BorderRadius } from '@constants/theme';

type BadgeVariant = 'success' | 'warning' | 'danger' | 'neutral' | 'primary';

interface AppBadgeProps {
  label: string;
  variant?: BadgeVariant;
}

export const AppBadge: React.FC<AppBadgeProps> = ({ label, variant = 'neutral' }) => (
  <View style={[styles.badge, styles[variant]]}>
    <Text style={[styles.label, styles[`${variant}Label`]]}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  badge: {
    paddingVertical: 2,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.full,
    alignSelf: 'flex-start',
  },
  label: { fontSize: Typography.xs, fontWeight: Typography.semiBold },

  success: { backgroundColor: Colors.successLight },
  successLabel: { color: Colors.success },
  warning: { backgroundColor: Colors.warningLight },
  warningLabel: { color: Colors.warning },
  danger: { backgroundColor: Colors.dangerLight },
  dangerLabel: { color: Colors.danger },
  neutral: { backgroundColor: Colors.gray100 },
  neutralLabel: { color: Colors.gray700 },
  primary: { backgroundColor: Colors.primaryLight },
  primaryLabel: { color: Colors.primary },
});
