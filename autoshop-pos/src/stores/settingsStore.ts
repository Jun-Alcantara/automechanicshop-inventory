import { create } from 'zustand';

interface SettingsStore {
  settings: null; // will be typed as AppSettings | null in AMSPOS-43
  error: Error | null;

  subscribe: () => void;
  unsubscribe: () => void;
  updateSettings: (patch: Record<string, unknown>) => Promise<void>;
}

export const useSettingsStore = create<SettingsStore>((set) => ({
  settings: null,
  error: null,

  subscribe: () => { /* implemented in AMSPOS-43 */ },
  unsubscribe: () => {},
  updateSettings: async (_patch) => {},
}));
