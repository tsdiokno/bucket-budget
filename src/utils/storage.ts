import { BucketNode } from '../types';
import { INITIAL_PRESETS } from '../data/initialData';

const STORAGE_KEYS = {
  TOTAL_POOL: 'bucket_budget_total_pool',
  BUCKETS: 'bucket_budget_buckets',
  ACTIVE_PRESET_ID: 'bucket_budget_active_preset_id',
  BACKUP: 'bucket_budget_backup',
};

export interface StoredBudgetData {
  totalPool: number;
  buckets: BucketNode[];
  activePresetId: string;
}

export function loadStoredData(): StoredBudgetData {
  try {
    const savedPresetId = localStorage.getItem(STORAGE_KEYS.ACTIVE_PRESET_ID) || 'default';
    const savedPool = localStorage.getItem(STORAGE_KEYS.TOTAL_POOL);
    const savedBuckets = localStorage.getItem(STORAGE_KEYS.BUCKETS);

    if (savedPool !== null && savedBuckets !== null) {
      const parsedBuckets = JSON.parse(savedBuckets);
      if (Array.isArray(parsedBuckets)) {
        const parsedPool = parseFloat(savedPool);
        return {
          totalPool: !isNaN(parsedPool) ? parsedPool : 3000,
          buckets: parsedBuckets,
          activePresetId: savedPresetId,
        };
      }
    }
  } catch (err) {
    console.warn('Failed to parse saved budget data from localStorage:', err);
  }

  // Fallback to default preset
  const defaultPreset = INITIAL_PRESETS[0];
  return {
    totalPool: defaultPreset.totalPool,
    buckets: defaultPreset.buckets,
    activePresetId: defaultPreset.id,
  };
}

export function saveBudgetData(data: StoredBudgetData): boolean {
  if (!data || !Array.isArray(data.buckets)) {
    console.warn('Attempted to save invalid budget data:', data);
    return false;
  }

  try {
    localStorage.setItem(STORAGE_KEYS.TOTAL_POOL, data.totalPool.toString());
    localStorage.setItem(STORAGE_KEYS.BUCKETS, JSON.stringify(data.buckets));
    localStorage.setItem(STORAGE_KEYS.ACTIVE_PRESET_ID, data.activePresetId || 'default');
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
    activePresetId: found.id,
  };
  saveBudgetData(data);
  return data;
}
