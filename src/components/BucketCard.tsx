import React, { useState, useEffect } from 'react';
import { BucketNode, Transaction } from '../types';
import { calculateBucketTotals } from '../utils/budgetCalculations';
import {
  ChevronRight,
  ChevronDown,
  Plus,
  Edit3,
  Trash2,
  FileText,
  Zap,
  Tag,
  ArrowRightLeft,
  Move,
  GripVertical,
  FolderOutput,
  Layers,
  Layers3,
  Info,
} from 'lucide-react';

interface BucketCardProps {
  node: BucketNode;
  transactions: Transaction[];
  expandedIds: Record<string, boolean>;
  onToggleExpand: (id: string) => void;
  onOpenInspector: (node: BucketNode) => void;
  onAddChildBucket: (parentNode: BucketNode) => void;
  onDeleteBucket: (id: string) => void;
  onQuickUpdateAllocation: (id: string, newAllocated: number) => void;
  onQuickUpdateFee: (id: string, newFee: number) => void;
  onQuickUpdateName: (id: string, newName: string) => void;
  onDropTransaction: (transactionId: string, targetBucketId: string) => void;
  onDropTransferFunds: (sourceBucketId: string, targetBucketId: string, amount?: number) => void;
  onOpenTransferModal: (sourceBucket: BucketNode) => void;
  onMoveBucket: (movedBucketId: string, targetBucketId: string | null, position?: 'before' | 'after' | 'inside') => void;
}

export const BucketCard: React.FC<BucketCardProps> = ({
  node,
  transactions,
  expandedIds,
  onToggleExpand,
  onOpenInspector,
  onAddChildBucket,
  onDeleteBucket,
  onQuickUpdateAllocation,
  onQuickUpdateFee,
  onQuickUpdateName,
  onDropTransaction,
  onDropTransferFunds,
  onOpenTransferModal,
  onMoveBucket,
}) => {
  const [dropPosition, setDropPosition] = useState<'before' | 'inside' | 'after' | null>(null);
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(node.name);
  const [feeInput, setFeeInput] = useState((node.fee || 0).toString());
  const [allocInput, setAllocInput] = useState((node.allocated || 0).toString());
  const [showNoteBanner, setShowNoteBanner] = useState(false);

  // Clear drop indicators when any drag operation ends globally
  useEffect(() => {
    const clearIndicators = () => {
      setDropPosition(null);
    };

    window.addEventListener('dragend', clearIndicators);
    window.addEventListener('drop', clearIndicators);
    window.addEventListener('bucket-drag-clear', clearIndicators);

    return () => {
      window.removeEventListener('dragend', clearIndicators);
      window.removeEventListener('drop', clearIndicators);
      window.removeEventListener('bucket-drag-clear', clearIndicators);
    };
  }, []);

  const totals = calculateBucketTotals(node, transactions);
  const hasChildren = node.children && node.children.length > 0;
  const isExpanded = !!expandedIds[node.id];

  // Level-based styling
  const isLevel1 = node.level === 1;
  const isLevel2 = node.level === 2;

  // Handle Drag Over & Drop position calculation
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';

    const rect = e.currentTarget.getBoundingClientRect();
    const offsetY = e.clientY - rect.top;
    const height = rect.height;

    if (offsetY < height * 0.25) {
      setDropPosition('before');
    } else if (offsetY > height * 0.75) {
      setDropPosition('after');
    } else {
      setDropPosition('inside');
    }
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    if (e.relatedTarget && e.currentTarget.contains(e.relatedTarget as Node)) {
      return;
    }
    setDropPosition(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const currentPos = dropPosition || 'inside';
    setDropPosition(null);
    window.dispatchEvent(new CustomEvent('bucket-drag-clear'));

    try {
      const rawData = e.dataTransfer.getData('application/json');
      if (rawData) {
        const payload = JSON.parse(rawData);
        if (payload.type === 'transaction') {
          onDropTransaction(payload.transactionId, node.id);
        } else if (payload.type === 'fund-transfer' && payload.sourceBucketId !== node.id) {
          onDropTransferFunds(payload.sourceBucketId, node.id, payload.amount);
        } else if (payload.type === 'bucket-move' && payload.bucketId !== node.id) {
          onMoveBucket(payload.bucketId, node.id, currentPos);
        }
      }
    } catch (err) {
      console.error('Failed to parse drag drop payload:', err);
    }
  };

  const handleDragStartBucketNode = (e: React.DragEvent) => {
    e.stopPropagation();
    e.dataTransfer.setData(
      'application/json',
      JSON.stringify({
        type: 'bucket-move',
        bucketId: node.id,
      })
    );
  };

  const handleSaveName = () => {
    if (nameInput.trim()) {
      onQuickUpdateName(node.id, nameInput.trim());
      setIsEditingName(false);
    }
  };

  const levelBadgeLabel = isLevel1 ? 'Level 1: Bucket' : isLevel2 ? 'Level 2: Sub-Bucket' : 'Level 3: Sub-Sub Bucket';

  return (
    <div className="relative">
      {/* Top Drop Indicator Line */}
      {dropPosition === 'before' && (
        <div className="absolute -top-2 left-0 right-0 z-30 flex items-center gap-2 pointer-events-none">
          <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-sm" />
          <div className="h-1 flex-1 bg-emerald-500 rounded-full shadow-sm" />
          <span className="text-[10px] font-extrabold bg-emerald-600 text-white px-2.5 py-0.5 rounded-full shadow-sm">
            Place Before "{node.name}"
          </span>
          <div className="h-1 flex-1 bg-emerald-500 rounded-full shadow-sm" />
          <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-sm" />
        </div>
      )}

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`rounded-xl transition-all duration-200 border text-left ${
          isLevel1
            ? 'bg-white border-slate-200 shadow-xs p-4 my-3'
            : isLevel2
            ? 'bg-slate-50/80 border-slate-200/90 p-3.5 my-2.5 ml-3 sm:ml-5'
            : 'bg-slate-100/70 border-slate-200/80 p-3 my-2 ml-4 sm:ml-8'
        } ${
          dropPosition === 'inside'
            ? 'ring-2 ring-emerald-500 bg-emerald-50/70 border-emerald-400 scale-[1.005]'
            : dropPosition === 'before' || dropPosition === 'after'
            ? 'border-emerald-400 bg-emerald-50/20'
            : ''
        }`}
      >
        {/* Top Header Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          
          {/* Title & Level Info */}
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            
            {/* Drag Handle for Re-parenting / Re-ordering Bucket Structure */}
            <div
              draggable
              onDragStart={handleDragStartBucketNode}
              className="p-1 text-slate-400 hover:text-emerald-700 cursor-grab active:cursor-grabbing transition-colors rounded hover:bg-slate-200/50"
              title="Drag to move or re-order this bucket"
            >
              <GripVertical className="w-4 h-4" />
            </div>

          {/* Expand Chevron */}
          {hasChildren ? (
            <button
              onClick={() => onToggleExpand(node.id)}
              className="p-1 text-slate-500 hover:text-slate-900 rounded hover:bg-slate-200/60 transition-colors cursor-pointer"
            >
              {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
          ) : (
            <span className="w-6 text-center text-slate-300">•</span>
          )}

          {/* Level Badge Icon */}
          <div
            className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 font-medium ${
              isLevel1
                ? 'bg-slate-900 text-emerald-400'
                : isLevel2
                ? 'bg-emerald-100 text-emerald-800'
                : 'bg-amber-100 text-amber-800'
            }`}
          >
            {isLevel1 ? <Layers className="w-3.5 h-3.5" /> : isLevel2 ? <Layers3 className="w-3.5 h-3.5" /> : <Tag className="w-3.5 h-3.5" />}
          </div>

          {/* Editable Name & Prominent Note Chip */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              {isEditingName ? (
                <div className="flex items-center gap-1">
                  <input
                    type="text"
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveName();
                      if (e.key === 'Escape') setIsEditingName(false);
                    }}
                    className="text-sm font-bold text-slate-900 border border-emerald-500 rounded px-1.5 py-0.5 focus:outline-none"
                    autoFocus
                  />
                  <button
                    onClick={handleSaveName}
                    className="text-xs bg-emerald-600 text-white px-2 py-0.5 rounded cursor-pointer"
                  >
                    Save
                  </button>
                </div>
              ) : (
                <h3
                  onDoubleClick={() => setIsEditingName(true)}
                  className={`font-bold truncate text-slate-900 cursor-pointer hover:text-emerald-700 transition-colors ${
                    isLevel1 ? 'text-base' : isLevel2 ? 'text-sm' : 'text-xs'
                  }`}
                  title="Double-click to edit name"
                >
                  {node.name}
                </h3>
              )}

              <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">
                {levelBadgeLabel}
              </span>

              {/* Auto Rule Indicator */}
              {node.autoRule && node.autoRule.enabled && (
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded-md">
                  <Zap className="w-3 h-3" />
                  Auto Rule
                </span>
              )}
            </div>

            {/* Dedicated Block Display Slot for Notes Component */}
            {node.notes && (
              <div className="block w-full mt-2 relative group">
                <button
                  type="button"
                  onClick={() => setShowNoteBanner(!showNoteBanner)}
                  className="inline-flex items-center gap-1.5 max-w-full px-2.5 py-1 rounded-lg bg-amber-50/90 hover:bg-amber-100/90 border border-amber-200/90 text-amber-950 text-xs font-medium cursor-pointer transition-colors shadow-2xs"
                  title="Hover for quick tooltip • Click to toggle full block memo"
                >
                  <FileText className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span className="block truncate max-w-[220px] sm:max-w-[340px] font-medium text-amber-900">
                    {node.notes}
                  </span>
                  <span className="text-[10px] font-semibold bg-amber-200/80 text-amber-800 px-1.5 py-0.2 rounded-full shrink-0 group-hover:bg-amber-300/80 transition-colors">
                    {showNoteBanner ? 'Hide Memo' : 'Note'}
                  </span>
                </button>

                {/* Pure CSS Non-Blocking Hover Tooltip (Zero JS state changes, zero layout-shift flickering) */}
                <div className="pointer-events-none absolute left-0 top-full mt-1.5 w-72 p-3 bg-slate-900/95 backdrop-blur-xs text-slate-100 rounded-xl shadow-xl text-xs z-50 border border-slate-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150">
                  <div className="flex items-center gap-1.5 font-bold text-amber-400 mb-1 border-b border-slate-800 pb-1.5">
                    <FileText className="w-3.5 h-3.5" />
                    <span>Bucket Note / Payment Memo</span>
                  </div>
                  <p className="text-slate-200 leading-relaxed whitespace-pre-wrap font-normal break-words">
                    {node.notes}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Amount Metrics & Inline Inputs */}
        <div className="flex items-center gap-3 sm:gap-4 flex-wrap justify-between sm:justify-end">
          
          {/* Allocated Balance */}
          <div className="text-right">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              {hasChildren ? 'Total Allocated' : 'Allocated Fund'}
            </span>

            {!hasChildren ? (
              <div className="flex items-center gap-1 justify-end">
                <span className="text-xs font-bold text-slate-400">$</span>
                <input
                  type="number"
                  value={allocInput}
                  onChange={(e) => setAllocInput(e.target.value)}
                  onBlur={() => {
                    const val = parseFloat(allocInput);
                    if (!isNaN(val) && val >= 0) {
                      onQuickUpdateAllocation(node.id, val);
                    }
                  }}
                  className="w-20 text-right text-xs font-bold text-emerald-800 bg-white border border-slate-300 rounded px-1.5 py-0.5 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            ) : (
              <div className="text-sm font-extrabold text-emerald-800">
                ${totals.allocatedTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
            )}
          </div>

          {/* Dedicated Fees Input */}
          <div className="text-right border-l border-slate-200 pl-3">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Dedicated Fee
            </span>
            <div className="flex items-center gap-1 justify-end">
              <span className="text-xs font-semibold text-slate-400">$</span>
              <input
                type="number"
                value={feeInput}
                onChange={(e) => setFeeInput(e.target.value)}
                onBlur={() => {
                  const val = parseFloat(feeInput);
                  if (!isNaN(val) && val >= 0) {
                    onQuickUpdateFee(node.id, val);
                  }
                }}
                className="w-16 text-right text-xs font-medium text-amber-800 bg-white border border-slate-300 rounded px-1.5 py-0.5 focus:ring-1 focus:ring-amber-500 focus:outline-none"
                placeholder="0.00"
              />
            </div>
          </div>

          {/* Action Buttons Toolbar */}
          <div className="flex items-center gap-1 border-l border-slate-200 pl-2">
            {/* Can add child bucket if level < 3 */}
            {node.level < 3 && (
              <button
                onClick={() => onAddChildBucket(node)}
                className="inline-flex items-center gap-1 px-2 py-1 bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-medium rounded-md transition-colors cursor-pointer"
                title={`Add Sub-bucket inside ${node.name}`}
              >
                <Plus className="w-3 h-3" />
                <span className="hidden sm:inline">
                  {node.level === 1 ? '+ Sub' : '+ Sub-Sub'}
                </span>
              </button>
            )}

            {/* Promote to Top-Level Root Bucket */}
            {(node.parentId || node.level > 1) && (
              <button
                onClick={() => onMoveBucket(node.id, null)}
                className="p-1.5 text-slate-500 hover:text-indigo-700 hover:bg-slate-200/70 rounded-md transition-colors cursor-pointer"
                title="Promote bucket to Top-Level Root"
              >
                <FolderOutput className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Quick Transfer Funds */}
            <button
              onClick={() => onOpenTransferModal(node)}
              className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-slate-200/70 rounded-md transition-colors cursor-pointer"
              title="Transfer funds to another bucket"
            >
              <ArrowRightLeft className="w-3.5 h-3.5" />
            </button>

            {/* Full Inspector Modal */}
            <button
              onClick={() => onOpenInspector(node)}
              className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-200/70 rounded-md transition-colors cursor-pointer"
              title="Inspect & edit full notes/rules"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>

            {/* Delete Bucket */}
            <button
              onClick={() => onDeleteBucket(node.id)}
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
              title="Delete this bucket"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Inline Collapsible Note Banner (Expands on click only, never triggered by hover layout shifts) */}
        {node.notes && showNoteBanner && (
          <div className="mt-3 p-3 bg-amber-50/90 border border-amber-200/90 rounded-xl text-xs text-amber-950 flex items-start gap-2.5 shadow-2xs transition-all">
            <FileText className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <span className="font-bold text-amber-900 block text-[10px] uppercase tracking-wider mb-0.5">
                Bucket Note & Payment Memo
              </span>
              <p className="text-amber-950 leading-relaxed font-normal whitespace-pre-wrap break-words">
                {node.notes}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Render Nested Child Buckets */}
      {hasChildren && isExpanded && (
        <div className="mt-3 space-y-2 border-l-2 border-slate-300/80 pl-1 sm:pl-2">
          {node.children!.map((child) => (
            <BucketCard
              key={child.id}
              node={child}
              transactions={transactions}
              expandedIds={expandedIds}
              onToggleExpand={onToggleExpand}
              onOpenInspector={onOpenInspector}
              onAddChildBucket={onAddChildBucket}
              onDeleteBucket={onDeleteBucket}
              onQuickUpdateAllocation={onQuickUpdateAllocation}
              onQuickUpdateFee={onQuickUpdateFee}
              onQuickUpdateName={onQuickUpdateName}
              onDropTransaction={onDropTransaction}
              onDropTransferFunds={onDropTransferFunds}
              onOpenTransferModal={onOpenTransferModal}
              onMoveBucket={onMoveBucket}
            />
          ))}
        </div>
      )}
      </div>

      {/* Bottom Drop Indicator Line */}
      {dropPosition === 'after' && (
        <div className="absolute -bottom-2 left-0 right-0 z-30 flex items-center gap-2 pointer-events-none">
          <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-sm" />
          <div className="h-1 flex-1 bg-emerald-500 rounded-full shadow-sm" />
          <span className="text-[10px] font-extrabold bg-emerald-600 text-white px-2.5 py-0.5 rounded-full shadow-sm">
            Place After "{node.name}"
          </span>
          <div className="h-1 flex-1 bg-emerald-500 rounded-full shadow-sm" />
          <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-sm" />
        </div>
      )}
    </div>
  );
};
