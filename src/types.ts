export type BucketLevel = 1 | 2 | 3;

export interface BucketNode {
  id: string;
  name: string;
  level: BucketLevel;
  parentId: string | null;
  allocated: number; // Current funds allocated into this bucket
  fee: number; // Dedicated fee input for this bucket
  notes: string; // Memos / notes
  isMuted?: boolean; // Mute state: true = exclude from calculations
  color?: string; // Optional custom color badge
  icon?: string; // Lucide icon identifier
  children?: BucketNode[];
}

export interface BudgetPreset {
  id: string;
  name: string;
  description: string;
  totalPool: number;
  buckets: BucketNode[];
}

export interface OverallTotals {
  totalPool: number;
  totalAllocated: number; // Direct or leaf allocated sum
  totalFees: number; // Direct or leaf fee sum
  unallocatedPool: number; // totalPool - (totalAllocated + totalFees)
}
