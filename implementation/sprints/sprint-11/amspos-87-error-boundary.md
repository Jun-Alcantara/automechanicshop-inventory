# AMSPOS-87: `src/components/common/ErrorBoundary.tsx`

**Sprint**: Sprint 11 — Transaction Core Screens & Modals
**Effort**: 0.5 days
**Dependencies**: None (standalone component)
**Phase**: Transactions

---

## Description

A React class component `ErrorBoundary` that catches unhandled JS errors in the render tree and shows a fallback UI with a restart button. Must be wired into `App.tsx` to wrap the root navigator.

---

## Instructions

### 1. `src/components/common/ErrorBoundary.tsx`

```typescript
import React, { Component, ErrorInfo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import * as Updates from 'expo-updates';
import { AppButton } from 'src/components/common/AppButton';

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<{ children: React.ReactNode }, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <Text style={styles.title}>Something went wrong</Text>
          <Text style={styles.message}>{this.state.error?.message}</Text>
          <AppButton label="Restart" onPress={() => Updates.reloadAsync()} />
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 8 },
  message: { fontSize: 14, color: '#666', marginBottom: 24, textAlign: 'center' },
});
```

### 2. Wire into `App.tsx`

Wrap `RootNavigator` (or whatever the root navigator component is) inside `<ErrorBoundary>`:

```typescript
import { ErrorBoundary } from 'src/components/common/ErrorBoundary';

// Inside the return:
<ErrorBoundary>
  <RootNavigator />
</ErrorBoundary>
```

---

## Acceptance Criteria

- [ ] `ErrorBoundary` is a class component with `getDerivedStateFromError` and `componentDidCatch`
- [ ] Fallback UI is full-screen, shows error message and "Restart" button
- [ ] "Restart" calls `Updates.reloadAsync()` from `expo-updates`
- [ ] `ErrorBoundary` wraps `RootNavigator` in `App.tsx`
- [ ] No TypeScript errors

## Definition of Done

- Acceptance criteria met
- Code committed to `main`
