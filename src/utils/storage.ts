import { BucketNode, Transaction, VendorRule } from '../types';
import { INITIAL_PRESETS } from '../data/initialData';

const STORAGE_KEYS = {
  TOTAL_POOL: 'bucket_budget_total_pool',
  BUCKETS: 'bucket_budget_buckets',
  TRANSACTIONS: 'bucket_budget_transactions',
  VENDOR_RULES: 'bucket_budget_vendor_rules',
  ACTIVE_PRESET_ID: 'bucket_budget_active_preset_id',
};

export interface StoredBudgetData {
  totalPool: number;
  buckets: BucketNode[];
  transactions: Transaction[];
  vendorRules: VendorRule[];
  activePresetId: string;
}

export function loadStoredData(): StoredBudgetData {
  try {
    const savedPresetId = localStorage.getItem(STORAGE_KEYS.ACTIVE_PRESET_ID) || 'zero-based';
    const savedPool = localStorage.getItem(STORAGE_KEYS.TOTAL_POOL);
    const savedBuckets = localStorage.getItem(STORAGE_KEYS.BUCKETS);
    const savedTxs = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
    const savedRules = localStorage.getItem(STORAGE_KEYS.VENDOR_RULES);

    if (savedPool !== null && savedBuckets !== null) {
      return {
        totalPool: parseFloat(savedPool) || 8500,
        buckets: JSON.parse(savedBuckets),
        transactions: savedTxs ? JSON.parse(savedTxs) : [],
        vendorRules: savedRules ? JSON.parse(savedRules) : [],
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
    vendorRules: defaultPreset.vendorRules,
    activePresetId: defaultPreset.id,
  };
}

export function saveBudgetData(data: StoredBudgetData): void {
  try {
    localStorage.setItem(STORAGE_KEYS.TOTAL_POOL, data.totalPool.toString());
    localStorage.setItem(STORAGE_KEYS.BUCKETS, JSON.stringify(data.buckets));
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(data.transactions));
    localStorage.setItem(STORAGE_KEYS.VENDOR_RULES, JSON.stringify(data.vendorRules));
    localStorage.setItem(STORAGE_KEYS.ACTIVE_PRESET_ID, data.activePresetId);
  } catch (err) {
    console.error('Failed to save budget data to localStorage:', err);
  }
}

export function loadPresetById(presetId: string): StoredBudgetData {
  const found = INITIAL_PRESETS.find((p) => p.id === presetId) || INITIAL_PRESETS[0];
  const data: StoredBudgetData = {
    totalPool: found.totalPool,
    buckets: found.buckets,
    transactions: found.transactions,
    vendorRules: found.vendorRules,
    activePresetId: found.id,
  };
  saveBudgetData(data);
  return data;
}
