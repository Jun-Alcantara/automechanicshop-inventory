import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useSessionStore } from '@stores/sessionStore';
import { useSettingsStore } from '@stores/settingsStore';
import type { AppSettings } from '@/types';

const DEFAULT_TIMEOUT_MINUTES = 5;

export const useInactivityTimer = () => {
  const { status, lock, lastActivityAt } = useSessionStore();
  // settingsStore.settings is typed as null placeholder (AMSPOS-43 will type it as AppSettings | null)
  const settings = useSettingsStore((s) => s.settings) as AppSettings | null;
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
