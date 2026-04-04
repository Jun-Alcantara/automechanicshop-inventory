# AMSPOS-39 & 43: Create settingsService and settingsStore

**Sprint**: Sprint 4 — Admin Stack & Settings Infrastructure
**Effort**: 2 days combined
**Dependencies**: AMSPOS-3, AMSPOS-8
**Phase**: Foundation

---

## Description

**AMSPOS-39**: Create `src/services/settingsService.ts` — reads and writes app-wide settings stored as a key-value record in WatermelonDB. Since there's no dedicated settings table in the schema, settings are stored in a singleton approach using a local JSON file via `expo-file-system` (simpler than a separate table for a single record).

**AMSPOS-43**: Fully implement `src/stores/settingsStore.ts` — reads settings on session start, exposes them reactively.

---

## Instructions

### 1. Settings storage approach

Settings are stored as a JSON file at `FileSystem.documentDirectory + 'settings.json'`. This avoids a DB table for a single record and is trivially readable/writable.

### 2. `src/services/settingsService.ts`

```typescript
import * as FileSystem from 'expo-file-system';
import type { AppSettings } from '../types';
import { DEFAULT_VAT_TYPE } from '../constants/vatTypes';

const SETTINGS_PATH = `${FileSystem.documentDirectory}settings.json`;

const DEFAULT_SETTINGS: AppSettings = {
  defaultVatType: DEFAULT_VAT_TYPE,
  inactivityTimeoutMinutes: 5,
  receiptHeader: 'AutoShop POS',
  printerDeviceId: '',
};

export const readSettings = async (): Promise<AppSettings> => {
  try {
    const info = await FileSystem.getInfoAsync(SETTINGS_PATH);
    if (!info.exists) return DEFAULT_SETTINGS;
    const json = await FileSystem.readAsStringAsync(SETTINGS_PATH);
    return { ...DEFAULT_SETTINGS, ...JSON.parse(json) };
  } catch {
    return DEFAULT_SETTINGS;
  }
};

export const writeSettings = async (settings: AppSettings): Promise<void> => {
  await FileSystem.writeAsStringAsync(SETTINGS_PATH, JSON.stringify(settings));
};

export const updateSettings = async (patch: Partial<AppSettings>): Promise<AppSettings> => {
  const current = await readSettings();
  const updated = { ...current, ...patch };
  await writeSettings(updated);
  return updated;
};
```

### 3. `src/stores/settingsStore.ts` (replaces skeleton)

```typescript
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

export const useSettingsStore = create<SettingsStore>((set, get) => ({
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
```

---

## Acceptance Criteria

- [ ] `readSettings()` returns `DEFAULT_SETTINGS` on first launch
- [ ] `writeSettings` / `updateSettings` persist to `settings.json`
- [ ] `readSettings` merges saved settings with `DEFAULT_SETTINGS` (handles missing keys)
- [ ] `settingsStore.subscribe()` calls `readSettings` and stores result
- [ ] `settingsStore.updateSettings(patch)` updates the file and store state atomically
- [ ] No TypeScript errors

## Definition of Done

- All acceptance criteria are met
- Verify: change a setting → restart app → setting persists
- Code committed to `main`
