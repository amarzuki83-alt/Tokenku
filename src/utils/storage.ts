import { AppSettings, DEFAULT_SETTINGS, PlnReceiptData } from '../types/receipt';

const SETTINGS_KEY = 'tokenku_settings';
const RECEIPTS_HISTORY_KEY = 'tokenku_receipts_history';

export function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
    }
  } catch (e) {
    console.error('Failed to load settings:', e);
  }
  return DEFAULT_SETTINGS;
}

export function saveSettings(settings: AppSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error('Failed to save settings:', e);
  }
}

export function loadReceiptHistory(): PlnReceiptData[] {
  try {
    const raw = localStorage.getItem(RECEIPTS_HISTORY_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Failed to load receipt history:', e);
  }
  return [];
}

export function saveReceiptToHistory(receipt: PlnReceiptData): PlnReceiptData[] {
  try {
    const list = loadReceiptHistory();
    // Prepend new or update existing
    const existingIndex = list.findIndex((r) => r.id === receipt.id);
    let updated: PlnReceiptData[];
    if (existingIndex >= 0) {
      updated = [...list];
      updated[existingIndex] = receipt;
    } else {
      updated = [receipt, ...list].slice(0, 50); // Store up to 50 past receipts
    }
    localStorage.setItem(RECEIPTS_HISTORY_KEY, JSON.stringify(updated));
    return updated;
  } catch (e) {
    console.error('Failed to save receipt to history:', e);
    return [];
  }
}

export function deleteReceiptFromHistory(id: string): PlnReceiptData[] {
  try {
    const list = loadReceiptHistory().filter((r) => r.id !== id);
    localStorage.setItem(RECEIPTS_HISTORY_KEY, JSON.stringify(list));
    return list;
  } catch (e) {
    console.error('Failed to delete receipt from history:', e);
    return [];
  }
}

export function clearReceiptHistory(): void {
  localStorage.removeItem(RECEIPTS_HISTORY_KEY);
}
