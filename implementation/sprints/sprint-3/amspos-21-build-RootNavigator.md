# AMSPOS-21: Build RootNavigator

**Sprint**: Sprint 3 — Navigation Setup
**Effort**: 1.5 days
**Dependencies**: AMSPOS-19, AMSPOS-20
**Phase**: Foundation

---

## Description

Create `src/navigation/RootNavigator.tsx`. This is the top-level navigator that determines which screen family to show: `InitSetup` (first launch), `PinLock` (session expired/locked), or `MainTabs` (active session). It mounts `AppListeners` as a sibling.

---

## Instructions

### 1. First-launch detection logic

On mount, check if the `users` table has any records. If count is 0, show `InitSetup`. Otherwise, show `PinLock`.

```typescript
// src/navigation/RootNavigator.tsx
import React, { useEffect, useState } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { NavigationContainer } from '@react-navigation/native';
import { database } from '@services/database';
import { useSessionStore } from '@stores/sessionStore';
import { AppListeners } from '@components/layout/AppListeners';
import { InitSetupScreen } from '@screens/auth/InitSetupScreen';
import { PinLockScreen } from '@screens/auth/PinLockScreen';
import { MainTabNavigator } from './MainTabNavigator';
import type { RootStackParamList } from './types';

const Stack = createStackNavigator<RootStackParamList>();

export const RootNavigator: React.FC = () => {
  const { status } = useSessionStore();
  const [isFirstLaunch, setIsFirstLaunch] = useState<boolean | null>(null);

  useEffect(() => {
    const checkFirstLaunch = async () => {
      const count = await database.get('users').query().fetchCount();
      setIsFirstLaunch(count === 0);
    };
    checkFirstLaunch();
  }, []);

  if (isFirstLaunch === null) {
    // Still loading — show nothing (or a splash screen)
    return null;
  }

  return (
    <NavigationContainer>
      <AppListeners />
      <Stack.Navigator screenOptions={{ headerShown: false, animationEnabled: false }}>
        {isFirstLaunch ? (
          <Stack.Screen name="InitSetup" component={InitSetupScreen} />
        ) : status === 'ACTIVE' ? (
          <Stack.Screen name="MainTabs" component={MainTabNavigator} />
        ) : (
          <Stack.Screen name="PinLock" component={PinLockScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};
```

### 2. Update `App.tsx`

```typescript
import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { RootNavigator } from './src/navigation/RootNavigator';

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <RootNavigator />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
```

### 3. Navigation flow summary

```
App launch
  ├── users.count === 0  → InitSetup
  │     └── on create → navigate to PinLock
  └── users.count > 0
        ├── status ACTIVE   → MainTabs
        ├── status LOCKED   → PinLock (shows locked user)
        └── status NONE     → PinLock (login)
```

---

## Acceptance Criteria

- [ ] On first launch (no users), `InitSetupScreen` is shown
- [ ] After setup, navigating to `PinLock` works
- [ ] When `status === 'ACTIVE'`, `MainTabNavigator` is shown
- [ ] When `status === 'LOCKED'` or `'NONE'`, `PinLockScreen` is shown
- [ ] `AppListeners` is mounted as a sibling to `Stack.Navigator`
- [ ] `GestureHandlerRootView` and `SafeAreaProvider` wrap the navigator in `App.tsx`
- [ ] No TypeScript errors

## Definition of Done

- All acceptance criteria are met
- Full navigation flow tested on emulator
- Code committed to `main`
