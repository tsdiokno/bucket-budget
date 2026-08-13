import React, { useState } from 'react';
import { Transaction, BucketNode } from '../types';
import { flattenBuckets } from '../utils/budgetCalculations';
import {
  GripVertical,
  Plus,
  Trash2,
  Search,
  Receipt,
} from 'lucide-react';

interface TransactionLedgerProps {
  transactions: Transaction[];
  buckets: BucketNode[];
  onAssignTransaction: (transactionId: string, bucketId: string | null) => void;
  onAddTransaction: (newTx: Omit<Transaction, 'id'>) => void;
  onDeleteTransaction: (id: string) => void;
}

export const TransactionLedger: React.FC<TransactionLedgerProps> = ({
  transactions,
  buckets,
  onAssignTransaction,
  onAddTransaction,
  onDeleteTransaction,
}) => {
  const [tab, setTab] = useState<'unassigned' | 'all'>('unassigned');
  const [searchQuery, setSearchQuery] = useState('');
  
  // New transaction form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [merchant, setMerchant] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedBucketId, setSelectedBucketId] = useState<string>('');

  const flatBucketList = flattenBuckets(buckets);

  const handleCreateTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!merchant || !amount) return;

    onAddTransaction({
      merchant: merchant.trim(),
      description: description.trim() || merchant.trim(),
      amount: Math.abs(parseFloat(amount)),
      date,
      bucketId: selectedBucketId || null,
      category: 'Expense',
    });

    setMerchant('');
    setDescription('');
    setAmount('');
    setShowAddForm(false);
  };

  const unassignedCount = transactions.filter((t) => t.bucketId === null).length;

  // Filter transactions
  const filteredTxs = transactions.filter((t) => {
    if (tab === 'unassigned' && t.bucketId !== null) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        t.merchant.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.amount.toString().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 sm:p-5 text-left space-y-4">
      
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-700 flex items-center justify-center font-bold">
            <Receipt className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900">Transaction Queue & Drag Ledger</h2>
              {unassignedCount > 0 && (
                <span className="bg-amber-500 text-white text-[11px] font-bold px-2 py-0.5 rounded-full">
                  {unassignedCount} Unassigned
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500">
              Drag transactions onto any bucket on the left canvas to categorize instantly
            </p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Add Transaction</span>
          </button>
        </div>
      </div>

      {/* Manual Add Form Collapsible */}
      {showAddForm && (
        <form onSubmit={handleCreateTransaction} className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-3 animate-in fade-in duration-150">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Merchant / Payee</label>
              <input
                type="text"
                value={merchant}
                onChange={(e) => setMerchant(e.target.value)}
                placeholder="e.g. Trader Joe's"
                className="w-full text-xs border border-slate-300 rounded-lg p-1.5 bg-white font-medium"
                required
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Amount</label>
              <input
                type="number"
                step="any"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                onBlur={() => {
                  if (amount.trim() === '' || isNaN(parseFloat(amount))) {
                    setAmount('0');
                  }
                }}
                placeholder="0"
                className="w-full text-xs border border-slate-300 rounded-lg p-1.5 bg-white font-bold text-slate-900"
                required
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Target Bucket</label>
              <select
                value={selectedBucketId}
                onChange={(e) => setSelectedBucketId(e.target.value)}
                className="w-full text-xs border border-slate-300 rounded-lg p-1.5 bg-white font-medium"
              >
                <option value="">Leave Unassigned (Pool Queue)</option>
                {flatBucketList.map((item) => (
                  <option key={item.node.id} value={item.node.id}>
                    {item.pathName}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full text-xs border border-slate-300 rounded-lg p-1.5 bg-white"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-3 py-1 text-xs text-slate-600 hover:text-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-md"
            >
              Save Transaction
            </button>
          </div>
        </form>
      )}

      {/* Tabs & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl w-full sm:w-auto">
          <button
            onClick={() => setTab('unassigned')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
              tab === 'unassigned' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Unassigned Queue ({unassignedCount})
          </button>
          <button
            onClick={() => setTab('all')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
              tab === 'all' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            All Ledger ({transactions.length})
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search merchant or description..."
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* Tab Content: Transactions List */}
      <div className="space-y-2">
        {filteredTxs.length > 0 ? (
          filteredTxs.map((tx) => (
            <div
              key={tx.id}
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData(
                  'application/json',
                  JSON.stringify({
                    type: 'transaction',
                    transactionId: tx.id,
                  })
                );
              }}
              className={`p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all cursor-grab active:cursor-grabbing hover:border-emerald-300 hover:shadow-xs ${
                tx.bucketId === null
                  ? 'bg-amber-50/40 border-amber-200'
                  : 'bg-white border-slate-200'
              }`}
            >
              {/* Drag Handle & Merchant */}
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <div className="p-1 text-slate-400 hover:text-slate-700">
                  <GripVertical className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-900 truncate">
                      {tx.merchant}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">
                      {tx.date}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 truncate">{tx.description}</p>
                </div>
              </div>

              {/* Amount & Destination Bucket Dropdown */}
              <div className="flex items-center gap-3 justify-between sm:justify-end">
                <div className="text-right">
                  <div className="text-sm font-extrabold text-slate-900">
                    -{tx.amount.toFixed(2)}
                  </div>
                  <span className="text-[10px] text-slate-400 font-semibold block">
                    {tx.bucketId ? 'Assigned' : 'Unassigned'}
                  </span>
                </div>

                {/* Manual Target Bucket Selector */}
                <div className="flex items-center gap-1">
                  <select
                    value={tx.bucketId || ''}
                    onChange={(e) => {
                      const targetId = e.target.value || null;
                      onAssignTransaction(tx.id, targetId);
                    }}
                    className="text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-500 max-w-[160px] truncate"
                  >
                    <option value="">(Unassigned Queue)</option>
                    {flatBucketList.map((item) => (
                      <option key={item.node.id} value={item.node.id}>
                        {item.pathName}
                      </option>
                    ))}
                  </select>

                  <button
                    onClick={() => onDeleteTransaction(tx.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-md transition-colors"
                    title="Delete transaction"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-slate-400 text-xs">
            No transactions found matching criteria.
          </div>
        )}
      </div>
    </div>
  );
};
