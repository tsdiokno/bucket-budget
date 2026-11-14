import React, { useState } from 'react';
import { BucketNode } from '../types';
import { BucketCard } from './BucketCard';
import { Search, FolderOutput } from 'lucide-react';

interface BucketTreeProps {
  buckets: BucketNode[];
  onOpenInspector: (node: BucketNode) => void;
  onAddChildBucket: (parentNode: BucketNode) => void;
  onAddRootBucket: () => void;
  onDeleteBucket: (id: string) => void;
  onToggleMuteBucket: (id: string) => void;
  onQuickUpdateAllocation: (id: string, newAllocated: number, sessionKey?: string) => void;
  onQuickUpdateFee: (id: string, newFee: number, sessionKey?: string) => void;
  onQuickUpdateName: (id: string, newName: string) => void;
  onDropTransferFunds: (sourceBucketId: string, targetBucketId: string, amount?: number) => void;
  onOpenTransferModal: (sourceBucket: BucketNode) => void;
  onMoveBucket: (movedBucketId: string, targetBucketId: string | null, position?: 'before' | 'after' | 'inside') => void;
}

export const BucketTree: React.FC<BucketTreeProps> = ({
  buckets,
  onOpenInspector,
  onAddChildBucket,
  onAddRootBucket,
  onDeleteBucket,
  onToggleMuteBucket,
  onQuickUpdateAllocation,
  onQuickUpdateFee,
  onQuickUpdateName,
  onDropTransferFunds,
  onOpenTransferModal,
  onMoveBucket,
}) => {
  // Empty object means all buckets are expanded by default (isExpanded = expandedIds[id] !== false)
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});

  const [searchQuery, setSearchQuery] = useState('');
  const [isRootDragOver, setIsRootDragOver] = useState(false);

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const isCurrentlyExpanded = prev[id] !== false;
      return { ...prev, [id]: !isCurrentlyExpanded };
    });
  };

  const expandAll = () => {
    // Clear all collapsed overrides so everything is open
    setExpandedIds({});
  };

  const collapseAll = () => {
    const map: Record<string, boolean> = {};
    function setAllCollapsed(list: BucketNode[]) {
      list.forEach((n) => {
        map[n.id] = false;
        if (n.children) setAllCollapsed(n.children);
      });
    }
    setAllCollapsed(buckets);
    setExpandedIds(map);
  };

  // Wrapper for adding child bucket that ensures the parent (and its ancestors) open immediately
  const handleAddChildBucketWithExpand = (parentNode: BucketNode) => {
    setExpandedIds((prev) => {
      const next = { ...prev };
      next[parentNode.id] = true;
      if (parentNode.parentId) {
        next[parentNode.parentId] = true;
      }
      return next;
    });
    onAddChildBucket(parentNode);
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
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#F0EDE5] p-3 rounded-xl border border-[#C5C3BE]">
        
        {/* Search Input */}
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-[#2E2E2C]/65 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter buckets by name or notes..."
            className="w-full pl-9 pr-3 py-1.5 bg-[#C5C3BE]/20 border border-[#C5C3BE] rounded-lg text-xs font-medium text-[#1A1A18] placeholder:text-[#2E2E2C]/60 focus:outline-none focus:ring-2 focus:ring-[#1A1A18]"
          />
        </div>

        {/* Level Statistics & Controls */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
          <div className="hidden lg:flex items-center gap-1.5 text-[11px] font-semibold text-[#2E2E2C] px-2 tabular-nums">
            <span className="bg-[#1A1A18] text-[#F0EDE5] px-2 py-0.5 rounded-full">
              {level1Count} Root
            </span>
            <span className="text-[#2E2E2C]/60">›</span>
            <span className="bg-[#2E2E2C] text-[#F0EDE5] px-2 py-0.5 rounded-full">
              {level2Count} Sub
            </span>
            <span className="text-[#2E2E2C]/60">›</span>
            <span className="bg-[#C5C3BE]/50 text-[#1A1A18] px-2 py-0.5 rounded-full border border-[#C5C3BE]">
              {level3Count} Sub-Sub
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={expandAll}
              className="text-xs font-medium text-[#2E2E2C] hover:text-[#1A1A18] px-2.5 py-1.5 bg-[#C5C3BE]/30 hover:bg-[#C5C3BE]/55 rounded-lg transition-colors cursor-pointer"
            >
              Expand All
            </button>
            <button
              onClick={collapseAll}
              className="text-xs font-medium text-[#2E2E2C] hover:text-[#1A1A18] px-2.5 py-1.5 bg-[#C5C3BE]/30 hover:bg-[#C5C3BE]/55 rounded-lg transition-colors cursor-pointer"
            >
              Collapse All
            </button>
          </div>
        </div>
      </div>

      {/* Bucket List Hierarchy Container */}
      {filteredBuckets.length > 0 ? (
        <div className="space-y-1 px-1 py-0.5">
          {filteredBuckets.map((rootNode) => (
            <BucketCard
              key={rootNode.id}
              node={rootNode}
              expandedIds={expandedIds}
              onToggleExpand={toggleExpand}
              onOpenInspector={onOpenInspector}
              onAddChildBucket={handleAddChildBucketWithExpand}
              onDeleteBucket={onDeleteBucket}
              onToggleMuteBucket={onToggleMuteBucket}
              onQuickUpdateAllocation={onQuickUpdateAllocation}
              onQuickUpdateFee={onQuickUpdateFee}
              onQuickUpdateName={onQuickUpdateName}
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
                ? 'border-[#1A1A18] bg-[#C5C3BE]/45 text-[#1A1A18]'
                : 'border-[#C5C3BE] bg-[#C5C3BE]/15 text-[#2E2E2C] hover:border-[#2E2E2C]/60'
            }`}
          >
            <div className="flex items-center justify-center gap-2 text-xs font-semibold">
              <FolderOutput className="w-4 h-4 text-[#2E2E2C]" />
              <span>Drag sub-bucket here to promote to Top-Level Root</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-12 bg-[#F0EDE5] rounded-xl border border-dashed border-[#C5C3BE] p-6">
          <h3 className="text-sm font-bold text-[#1A1A18]">No buckets matching filter</h3>
          <p className="text-xs text-[#2E2E2C]/80 max-w-sm mx-auto mt-1 mb-4">
            Create a root bucket to start structuring your 3-tier financial allocation tree.
          </p>
          <button
            onClick={onAddRootBucket}
            className="inline-flex items-center px-4 py-2 bg-[#1A1A18] text-[#F0EDE5] text-xs font-semibold rounded-lg hover:bg-[#2E2E2C] transition-colors cursor-pointer"
          >
            + Create First Root Bucket
          </button>
        </div>
      )}
    </div>
  );
};
