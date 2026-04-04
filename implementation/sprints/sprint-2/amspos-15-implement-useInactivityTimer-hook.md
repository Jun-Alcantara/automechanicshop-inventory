# AMSPOS-15: Implement useInactivityTimer Hook

**Sprint**: Sprint 2 — Auth Screens & Components
**Effort**: 1 day
**Dependencies**: AMSPOS-12
**Phase**: Auth

---

## Description

Create `src/hooks/useInactivityTimer.ts`. This hook uses React Native's `AppState` API plus `setTimeout` to detect user inactivity. When the configurable timeout elapses without user activity, it calls `sessionStore.lock()`. The timeout value comes from `settingsStore.settings.inactivityTimeoutMinutes` (defaults to 5 minutes).

This hook is mounted inside `AppListeners` (AMSPOS-19) and runs only when `status === 'ACTIVE'`.

---

## Instructions

### 1. `src/hooks/useInactivityTimer.ts`

```typescript
import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useSessionStore } from '@stores/sessionStore';
import { useSettingsStore } from '@stores/settingsStore';

const DEFAULT_TIMEOUT_MINUTES = 5;

export const useInactivityTimer = () => {
  const { status, lock, lastActivityAt, refreshActivity } = useSessionStore();
  const settings = useSettingsStore((s) => s.settings);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const timeoutMs =
    (settings?.inactivityTimeoutMinutes ?? DEFAULT_TIMEOUT_MINUTES) * 60 * 1000;

  const resetTimer = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      if (useSessionStore.getState().status === 'ACTIVE') {
        lock();
      }
    }, timeoutMs);
  };

  // Reset timer whenever lastActivityAt changes (user interacted)
  useEffect(() => {
    if (status !== 'ACTIVE') {
      if (timerRef.current) clearTimeout(timerRef.current);
      return;
    }
    resetTimer();
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [lastActivityAt, status, timeoutMs]);

  // Lock immediately when app goes to background
  useEffect(() => {
    const handleAppState = (nextState: AppStateStatus) => {
      if (nextState === 'background' || nextState === 'inactive') {
        if (useSessionStore.getState().status === 'ACTIVE') {
          lock();
        }
      }
    };

    const subscription = AppState.addEventListener('change', handleAppState);
    return () => subscription.remove();
  }, [lock]);
};
```

### 2. Touch event propagation for `refreshActivity`

`useInactivityTimer` resets on `lastActivityAt` changes. To reset the timer on user interaction, wrap the root view with a `TouchableWithoutFeedback` (or use a global gesture handler) that calls `refreshActivity()` on every touch event. This is wired in `AppListeners` or `ScreenWrapper`.

In `src/components/layout/ScreenWrapper.tsx` (AMSPOS-27), add `onStartShouldSetResponder`:

```typescript
// Inside ScreenWrapper:
const { refreshActivity } = useSessionStore();
// ...
<View
  style={styles.container}
  onStartShouldSetResponder={() => { refreshActivity(); return false; }}
>
  {children}
</View>
```

Returning `false` from `onStartShouldSetResponder` ensures touches are not consumed by the wrapper.

### 3. Default timeout

Default is 5 minutes. The Main Admin can change this in SettingsScreen. The `useInactivityTimer` hook reads `settingsStore` reactively — changing the setting takes effect immediately.

---

## Acceptance Criteria

- [ ] Timer starts when `status === 'ACTIVE'`
- [ ] Timer is cleared when `status !== 'ACTIVE'`
- [ ] Timer resets whenever `lastActivityAt` changes
- [ ] `lock()` is called when the timer expires while status is still `ACTIVE`
- [ ] App going to background/inactive triggers immediate lock
- [ ] Timeout duration respects `settings.inactivityTimeoutMinutes` (defaults to 5 min)
- [ ] No TypeScript errors

## Definition of Done

- All acceptance criteria are met
- Manually tested: leave app idle for 5 min → lock screen appears
- App backgrounding immediately locks session
- Code committed to `main`
