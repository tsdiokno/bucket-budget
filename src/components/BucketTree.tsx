import React, { useState } from 'react';
import { BucketNode, Transaction } from '../types';
import { BucketCard } from './BucketCard';
import { Search, PlusCircle, Layers, FolderOutput } from 'lucide-react';

interface BucketTreeProps {
  buckets: BucketNode[];
  transactions: Transaction[];
  onOpenInspector: (node: BucketNode) => void;
  onAddChildBucket: (parentNode: BucketNode) => void;
  onAddRootBucket: () => void;
  onDeleteBucket: (id: string) => void;
  onToggleMuteBucket: (id: string) => void;
  onQuickUpdateAllocation: (id: string, newAllocated: number) => void;
  onQuickUpdateFee: (id: string, newFee: number) => void;
  onQuickUpdateName: (id: string, newName: string) => void;
  onDropTransaction: (transactionId: string, targetBucketId: string) => void;
  onDropTransferFunds: (sourceBucketId: string, targetBucketId: string, amount?: number) => void;
  onOpenTransferModal: (sourceBucket: BucketNode) => void;
  onMoveBucket: (movedBucketId: string, targetBucketId: string | null, position?: 'before' | 'after' | 'inside') => void;
}

export const BucketTree: React.FC<BucketTreeProps> = ({
  buckets,
  transactions,
  onOpenInspector,
  onAddChildBucket,
  onAddRootBucket,
  onDeleteBucket,
  onToggleMuteBucket,
  onQuickUpdateAllocation,
  onQuickUpdateFee,
  onQuickUpdateName,
  onDropTransaction,
  onDropTransferFunds,
  onOpenTransferModal,
  onMoveBucket,
}) => {
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>(() => {
    // Expand top level buckets by default
    const map: Record<string, boolean> = {};
    buckets.forEach((b) => {
      map[b.id] = true;
      if (b.children) {
        b.children.forEach((child) => {
          map[child.id] = true;
        });
      }
    });
    return map;
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [isRootDragOver, setIsRootDragOver] = useState(false);

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const expandAll = () => {
    const map: Record<string, boolean> = {};
    function setAll(list: BucketNode[]) {
      list.forEach((n) => {
        map[n.id] = true;
        if (n.children) setAll(n.children);
      });
    }
    setAll(buckets);
    setExpandedIds(map);
  };

  const collapseAll = () => {
    setExpandedIds({});
  };

  // Root drop zone handlers for promoting sub-buckets to root
  const handleRootDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!isRootDragOver) setIsRootDragOver(true);
  };

  const handleRootDragLeave = () => {
    setIsRootDragOver(false);
  };

  const handleRootDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsRootDragOver(false);
    try {
      const rawData = e.dataTransfer.getData('application/json');
      if (rawData) {
        const payload = JSON.parse(rawData);
        if (payload.type === 'bucket-move') {
          onMoveBucket(payload.bucketId, null);
        }
      }
    } catch (err) {
      console.error('Failed to drop onto root zone:', err);
    }
  };

  // Count total buckets per level
  let level1Count = 0;
  let level2Count = 0;
  let level3Count = 0;

  function countLevels(list: BucketNode[]) {
    list.forEach((n) => {
      if (n.level === 1) level1Count++;
      if (n.level === 2) level2Count++;
      if (n.level === 3) level3Count++;
      if (n.children) countLevels(n.children);
    });
  }
  countLevels(buckets);

  // Filter buckets by search query
  const matchesSearch = (node: BucketNode): boolean => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const selfMatch = node.name.toLowerCase().includes(q) || (node.notes && node.notes.toLowerCase().includes(q));
    if (selfMatch) return true;
    if (node.children) {
      return node.children.some(matchesSearch);
    }
    return false;
  };

  const filteredBuckets = buckets.filter(matchesSearch);

  return (
    <div className="space-y-4 text-left">
      {/* Top Search & Controls Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
        
        {/* Search Input */}
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter buckets by name or notes..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {/* Level Statistics & Controls */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
          <div className="hidden lg:flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 px-2">
            <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full border border-slate-200">
              {level1Count} Root
            </span>
            <span>›</span>
            <span className="bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-200">
              {level2Count} Sub
            </span>
            <span>›</span>
            <span className="bg-amber-50 text-amber-800 px-2 py-0.5 rounded-full border border-amber-200">
              {level3Count} Sub-Sub
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={expandAll}
              className="text-xs font-medium text-slate-600 hover:text-slate-900 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              Expand All
            </button>
            <button
              onClick={collapseAll}
              className="text-xs font-medium text-slate-600 hover:text-slate-900 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              Collapse All
            </button>
          </div>
        </div>
      </div>

      {/* Bucket List Hierarchy Container */}
      {filteredBuckets.length > 0 ? (
        <div className="space-y-1">
          {filteredBuckets.map((rootNode) => (
            <BucketCard
              key={rootNode.id}
              node={rootNode}
              transactions={transactions}
              expandedIds={expandedIds}
              onToggleExpand={toggleExpand}
              onOpenInspector={onOpenInspector}
              onAddChildBucket={onAddChildBucket}
              onDeleteBucket={onDeleteBucket}
              onToggleMuteBucket={onToggleMuteBucket}
              onQuickUpdateAllocation={onQuickUpdateAllocation}
              onQuickUpdateFee={onQuickUpdateFee}
              onQuickUpdateName={onQuickUpdateName}
              onDropTransaction={onDropTransaction}
              onDropTransferFunds={onDropTransferFunds}
              onOpenTransferModal={onOpenTransferModal}
              onMoveBucket={onMoveBucket}
            />
          ))}

          {/* Root Level Drop Target Zone */}
          <div
            onDragOver={handleRootDragOver}
            onDragLeave={handleRootDragLeave}
            onDrop={handleRootDrop}
            className={`mt-4 p-3 rounded-xl border-2 border-dashed text-center transition-colors ${
              isRootDragOver
                ? 'border-indigo-500 bg-indigo-50/80 text-indigo-900'
                : 'border-slate-200 bg-slate-50/50 text-slate-400 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-center gap-2 text-xs font-semibold">
              <FolderOutput className="w-4 h-4 text-indigo-600" />
              <span>Drag sub-bucket here to promote to Top-Level Root</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-xl border border-dashed border-slate-300 p-6">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
            <Layers className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">No buckets matching filter</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
            Create a root bucket to start structuring your 3-tier financial allocation tree.
          </p>
          <button
            onClick={onAddRootBucket}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Create First Root Bucket</span>
          </button>
        </div>
      )}
    </div>
  );
};
