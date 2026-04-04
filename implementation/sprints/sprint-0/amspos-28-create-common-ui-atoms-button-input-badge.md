# AMSPOS-28: Create Common UI Atoms — AppButton, AppInput, AppBadge

**Sprint**: Sprint 0 — Foundation Infrastructure
**Effort**: 1 day
**Dependencies**: AMSPOS-6 (theme constants)
**Phase**: Foundation

---

## Description

Build the three foundational UI atoms used across all screens: `AppButton`, `AppInput`, and `AppBadge`. These live in `src/components/common/` and are context-free — they accept only props, have no store dependencies, and use `StyleSheet.create` for styling.

---

## Instructions

### 1. `src/components/common/AppButton.tsx`

```typescript
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
```

### 2. `src/components/common/AppInput.tsx`

```typescript
import React, { useState } from 'react';
import { View, TextInput, Text, StyleSheet, TextInputProps, ViewStyle } from 'react-native';
import { Colors, Spacing, Typography, BorderRadius } from '@constants/theme';

interface AppInputProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  error?: string;
  containerStyle?: ViewStyle;
}

export const AppInput: React.FC<AppInputProps> = ({
  label,
  error,
  containerStyle,
  ...textInputProps
}) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={[styles.container, containerStyle]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TextInput
        style={[
          styles.input,
          isFocused && styles.inputFocused,
          error ? styles.inputError : null,
        ]}
        placeholderTextColor={Colors.gray300}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        {...textInputProps}
      />
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { gap: Spacing.xs },
  label: {
    fontSize: Typography.sm,
    fontWeight: Typography.medium,
    color: Colors.gray700,
  },
  input: {
    height: 44,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    fontSize: Typography.base,
    color: Colors.black,
    backgroundColor: Colors.surface,
  },
  inputFocused: { borderColor: Colors.primary },
  inputError: { borderColor: Colors.danger },
  errorText: {
    fontSize: Typography.sm,
    color: Colors.danger,
  },
});
```

### 3. `src/components/common/AppBadge.tsx`

```typescript
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
```

### 4. `src/components/common/index.ts`

```typescript
export { AppButton } from './AppButton';
export { AppInput } from './AppInput';
export { AppBadge } from './AppBadge';
```

---

## Acceptance Criteria

- [ ] `AppButton` renders with all 4 variants (`primary`, `secondary`, `danger`, `ghost`)
- [ ] `AppButton` shows `ActivityIndicator` when `loading={true}` and is disabled
- [ ] `AppInput` shows focus border on focus, error border and message when `error` prop is set
- [ ] `AppBadge` renders all 5 color variants
- [ ] All styles use `StyleSheet.create` — no inline styles
- [ ] All color/spacing/typography values come from `@constants/theme`
- [ ] No TypeScript errors

## Definition of Done

- All acceptance criteria are met
- Components are visually tested on an Android device/emulator
- Code committed to `main`
