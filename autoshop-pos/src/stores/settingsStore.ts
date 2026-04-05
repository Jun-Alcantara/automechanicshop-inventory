import { create } from 'zustand';
import { readSettings, updateSettings as updateSettingsService } from '../services/settingsService';
import type { AppSettings } from '../types';

interface SettingsStore {
  settings: AppSettings | null;
  error: Error | null;

  subscribe: () => void;
  unsubscribe: () => void;
  updateSettings: (patch: Partial<AppSettings>) => Promise<void>;
}

export const useSettingsStore = create<SettingsStore>((set) => ({
  settings: null,
  error: null,

  subscribe: async () => {
    try {
      const settings = await readSettings();
      set({ settings, error: null });
    } catch (e) {
      set({ error: e instanceof Error ? e : new Error(String(e)) });
    }
  },

  unsubscribe: () => {
    // Settings are a one-time read — nothing to unsubscribe
    set({ settings: null });
  },

  updateSettings: async (patch) => {
    try {
      const updated = await updateSettingsService(patch);
      set({ settings: updated });
    } catch (e) {
      set({ error: e instanceof Error ? e : new Error(String(e)) });
      throw e;
    }
  },
}));
