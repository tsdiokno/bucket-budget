export type BucketLevel = 1 | 2 | 3;

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
