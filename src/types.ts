export type BucketLevel = 1 | 2 | 3;

export interface AutoAllocationRule {
  enabled: boolean;
  type: 'fixed' | 'percentage' | 'top_up';
  value: number; // Dollar amount for fixed/top_up or Percentage (0-100) for percentage
  frequency: 'monthly' | 'biweekly' | 'weekly';
}

export interface BucketNode {
  id: string;
  name: string;
  level: BucketLevel;
  parentId: string | null;
  allocated: number; // Current funds allocated into this bucket
  fee: number; // Dedicated fee input for this bucket
  notes: string; // Memos / notes
  color?: string; // Optional custom color badge
  icon?: string; // Lucide icon identifier
  autoRule?: AutoAllocationRule;
  children?: BucketNode[];
}

export interface Transaction {
  id: string;
  merchant: string;
  description: string;
  amount: number;
  date: string;
  bucketId: string | null; // null = unassigned in pool queue
  category?: string;
  isRecurring?: boolean;
}

export interface VendorRule {
  id: string;
  merchantPattern: string;
  targetBucketId: string;
  autoApply: boolean;
  bucketName?: string;
}

export interface RecurringRule {
  id: string;
  name: string;
  targetBucketId: string;
  type: 'fixed' | 'percentage' | 'top_up';
  value: number;
  enabled: boolean;
  frequency: 'weekly' | 'biweekly' | 'monthly';
}

export interface BudgetPreset {
  id: string;
  name: string;
  description: string;
  totalPool: number;
  buckets: BucketNode[];
  transactions: Transaction[];
  vendorRules: VendorRule[];
}

export interface OverallTotals {
  totalPool: number;
  totalAllocated: number; // Direct or leaf allocated sum
  totalFees: number; // Direct or leaf fee sum
  unallocatedPool: number; // totalPool - (totalAllocated + totalFees)
}

export type ActiveTab = 'buckets' | 'transactions' | 'rules';
