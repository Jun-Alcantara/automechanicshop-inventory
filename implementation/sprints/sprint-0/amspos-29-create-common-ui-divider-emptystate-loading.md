# AMSPOS-29: Create Common UI — Divider, EmptyState, LoadingOverlay

**Sprint**: Sprint 0 — Foundation Infrastructure
**Effort**: 0.5 day
**Dependencies**: AMSPOS-6 (theme constants)
**Phase**: Foundation

---

## Description

Build three utility UI components used across all screens: `Divider` (horizontal rule), `EmptyState` (zero-data placeholder with icon + message), and `LoadingOverlay` (full-screen blocking spinner). All live in `src/components/common/`.

---

## Instructions

### 1. `src/components/common/Divider.tsx`

```typescript
import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Colors, Spacing } from '@constants/theme';

interface DividerProps {
  style?: ViewStyle;
}

export const Divider: React.FC<DividerProps> = ({ style }) => (
  <View style={[styles.divider, style]} />
);

const styles = StyleSheet.create({
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.sm,
  },
});
```

### 2. `src/components/common/EmptyState.tsx`

```typescript
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Spacing, Typography } from '@constants/theme';

interface EmptyStateProps {
  title: string;
  subtitle?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ title, subtitle }) => (
  <View style={styles.container}>
    <Text style={styles.title}>{title}</Text>
    {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  title: {
    fontSize: Typography.lg,
    fontWeight: Typography.semiBold,
    color: Colors.gray700,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: Typography.base,
    color: Colors.gray500,
    textAlign: 'center',
  },
});
```

### 3. `src/components/common/LoadingOverlay.tsx`

```typescript
import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Colors } from '@constants/theme';

interface LoadingOverlayProps {
  visible: boolean;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ visible }) => {
  if (!visible) return null;

  return (
    <View style={styles.overlay}>
      <ActivityIndicator size="large" color={Colors.primary} />
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
  },
});
```

### 4. Update `src/components/common/index.ts`

```typescript
export { AppButton } from './AppButton';
export { AppInput } from './AppInput';
export { AppBadge } from './AppBadge';
export { Divider } from './Divider';
export { EmptyState } from './EmptyState';
export { LoadingOverlay } from './LoadingOverlay';
```

---

## Acceptance Criteria

- [ ] `Divider` renders a 1px horizontal line using `Colors.border`
- [ ] `EmptyState` centers title + optional subtitle vertically on screen
- [ ] `LoadingOverlay` renders only when `visible={true}`, blocks interaction via full-screen overlay
- [ ] All styles use `StyleSheet.create` — no inline styles
- [ ] All three components are exported from `src/components/common/index.ts`
- [ ] No TypeScript errors

## Definition of Done

- All acceptance criteria are met
- Code committed to `main`
