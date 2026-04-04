# AMSPOS-32: Create SectionHeader Component

**Sprint**: Sprint 2 — Auth Screens & Components
**Effort**: 0.5 day
**Dependencies**: None
**Phase**: Foundation

---

## Description

Build `src/components/layout/SectionHeader.tsx` — a small layout component used as section titles within scrollable screens (e.g., "Products" vs "Services" in InventoryListScreen, or "In Progress" vs "History" in TransactionListScreen).

---

## Instructions

### 1. `src/components/layout/SectionHeader.tsx`

```typescript
import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Colors, Spacing, Typography } from '@constants/theme';

interface SectionHeaderProps {
  title: string;
  rightElement?: React.ReactNode;
  style?: ViewStyle;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  rightElement,
  style,
}) => (
  <View style={[styles.container, style]}>
    <Text style={styles.title}>{title}</Text>
    {rightElement ?? null}
  </View>
);

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.gray100,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: {
    fontSize: Typography.sm,
    fontWeight: '600',
    color: Colors.gray700,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
```

### 2. Update `src/components/layout/index.ts`

```typescript
export { ScreenWrapper } from './ScreenWrapper'; // stub for now — implemented in AMSPOS-27
export { SectionHeader } from './SectionHeader';
export { AppListeners } from './AppListeners';
```

---

## Acceptance Criteria

- [ ] `SectionHeader` renders a title in uppercase with gray background
- [ ] `rightElement` renders to the right of the title when provided
- [ ] Uses `StyleSheet.create`
- [ ] No TypeScript errors

## Definition of Done

- All acceptance criteria are met
- Code committed to `main`
