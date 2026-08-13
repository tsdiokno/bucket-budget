import { BudgetPreset } from '../types';

export const INITIAL_PRESETS: BudgetPreset[] = [
  {
    id: 'default',
    name: 'Default Budget',
    description: 'A clean baseline template.',
    totalPool: 3000,
    buckets: [
      {
        id: 'b-housing',
        name: 'Housing',
        level: 1,
        parentId: null,
        allocated: 0,
        fee: 0,
        notes: 'Housing expenses',
        color: 'emerald',
        icon: 'Home',
        children: [
          {
            id: 'b-rent',
            name: 'Rent & Utilities',
            level: 2,
            parentId: 'b-housing',
            allocated: 1500,
            fee: 0,
            notes: 'Monthly rent payment',
          },
        ],
      },
      {
        id: 'b-living',
        name: 'Living Expenses',
        level: 1,
        parentId: null,
        allocated: 0,
        fee: 0,
        notes: 'Daily essential expenses',
        color: 'amber',
        icon: 'ShoppingBag',
        children: [
          {
            id: 'b-groceries',
            name: 'Groceries',
            level: 2,
            parentId: 'b-living',
            allocated: 500,
            fee: 0,
            notes: 'Food and groceries',
          },
        ],
      },
    ],
    transactions: [
      {
        id: 'tx-1',
        merchant: 'Grocery Store',
        description: 'Weekly groceries',
        amount: 85.00,
        date: '2026-08-10',
        bucketId: 'b-groceries',
        category: 'Groceries',
      },
    ],
    vendorRules: [],
  },
];
