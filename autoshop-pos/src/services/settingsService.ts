import { File, Paths } from 'expo-file-system';
import type { AppSettings } from '../types';
import { DEFAULT_VAT_TYPE } from '../constants/vatTypes';

const DEFAULT_SETTINGS: AppSettings = {
  defaultVatType: DEFAULT_VAT_TYPE,
  inactivityTimeoutMinutes: 5,
  receiptHeader: 'AutoShop POS',
  printerDeviceId: '',
};

const getSettingsFile = () => new File(Paths.document, 'settings.json');

export const readSettings = async (): Promise<AppSettings> => {
  try {
    const file = getSettingsFile();
    if (!file.exists) return DEFAULT_SETTINGS;
    const json = await file.text();
    return { ...DEFAULT_SETTINGS, ...JSON.parse(json) };
  } catch {
    return DEFAULT_SETTINGS;
  }
};

export const writeSettings = async (settings: AppSettings): Promise<void> => {
  const file = getSettingsFile();
  file.write(JSON.stringify(settings));
};

export const updateSettings = async (patch: Partial<AppSettings>): Promise<AppSettings> => {
  const current = await readSettings();
  const updated = { ...current, ...patch };
  await writeSettings(updated);
  return updated;
};
