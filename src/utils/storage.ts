import { BucketNode, Transaction } from '../types';
import { INITIAL_PRESETS } from '../data/initialData';

const STORAGE_KEYS = {
  TOTAL_POOL: 'bucket_budget_total_pool',
  BUCKETS: 'bucket_budget_buckets',
  TRANSACTIONS: 'bucket_budget_transactions',
  ACTIVE_PRESET_ID: 'bucket_budget_active_preset_id',
  BACKUP: 'bucket_budget_backup',
};

export interface StoredBudgetData {
  totalPool: number;
  buckets: BucketNode[];
  transactions: Transaction[];
  activePresetId: string;
}

export function loadStoredData(): StoredBudgetData {
  try {
    const savedPresetId = localStorage.getItem(STORAGE_KEYS.ACTIVE_PRESET_ID) || 'default';
    const savedPool = localStorage.getItem(STORAGE_KEYS.TOTAL_POOL);
    const savedBuckets = localStorage.getItem(STORAGE_KEYS.BUCKETS);
    const savedTxs = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);

    if (savedPool !== null && savedBuckets !== null) {
      return {
        totalPool: parseFloat(savedPool) || 3000,
        buckets: JSON.parse(savedBuckets),
        transactions: savedTxs ? JSON.parse(savedTxs) : [],
        activePresetId: savedPresetId,
      };
    }
  } catch (err) {
    console.warn('Failed to parse saved budget data from localStorage:', err);
  }

  // Fallback to default preset
  const defaultPreset = INITIAL_PRESETS[0];
  return {
    totalPool: defaultPreset.totalPool,
    buckets: defaultPreset.buckets,
    transactions: defaultPreset.transactions,
    activePresetId: defaultPreset.id,
  };
}

export function saveBudgetData(data: StoredBudgetData): boolean {
  try {
    // Keep a rolling backup of the previous good state before overwriting
    const currentBuckets = localStorage.getItem(STORAGE_KEYS.BUCKETS);
    if (currentBuckets) {
      const currentBackup = {
        totalPool: localStorage.getItem(STORAGE_KEYS.TOTAL_POOL),
        buckets: currentBuckets,
        transactions: localStorage.getItem(STORAGE_KEYS.TRANSACTIONS),
        timestamp: new Date().toISOString(),
      };
      localStorage.setItem(STORAGE_KEYS.BACKUP, JSON.stringify(currentBackup));
    }

    localStorage.setItem(STORAGE_KEYS.TOTAL_POOL, data.totalPool.toString());
    localStorage.setItem(STORAGE_KEYS.BUCKETS, JSON.stringify(data.buckets));
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(data.transactions));
    localStorage.setItem(STORAGE_KEYS.ACTIVE_PRESET_ID, data.activePresetId);
    return true;
  } catch (err) {
    console.error('Failed to save budget data to localStorage:', err);
    return false;
  }
}

export function exportBudgetData(data: StoredBudgetData): void {
  const exportPayload = {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    budget: data,
  };

  const jsonString = JSON.stringify(exportPayload, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const dateStr = new Date().toISOString().split('T')[0];
  const a = document.createElement('a');
  a.href = url;
  a.download = `bucket_budget_backup_${dateStr}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function importBudgetData(jsonText: string): StoredBudgetData {
  const parsed = JSON.parse(jsonText);
  const budget = parsed.budget || parsed;

  if (typeof budget.totalPool !== 'number' || !Array.isArray(budget.buckets)) {
    throw new Error('Invalid budget data file format.');
  }

  const importedData: StoredBudgetData = {
    totalPool: Math.max(0, budget.totalPool),
    buckets: budget.buckets,
    transactions: Array.isArray(budget.transactions) ? budget.transactions : [],
    activePresetId: budget.activePresetId || 'imported',
  };

  saveBudgetData(importedData);
  return importedData;
}

export function resetToDefaultData(): StoredBudgetData {
  const defaultPreset = INITIAL_PRESETS[0];
  const resetData: StoredBudgetData = {
    totalPool: defaultPreset.totalPool,
    buckets: defaultPreset.buckets,
    transactions: defaultPreset.transactions,
    activePresetId: defaultPreset.id,
  };
  saveBudgetData(resetData);
  return resetData;
}

export function loadPresetById(presetId: string): StoredBudgetData {
  const found = INITIAL_PRESETS.find((p) => p.id === presetId) || INITIAL_PRESETS[0];
  const data: StoredBudgetData = {
    totalPool: found.totalPool,
    buckets: found.buckets,
    transactions: found.transactions,
    activePresetId: found.id,
  };
  saveBudgetData(data);
  return data;
}
