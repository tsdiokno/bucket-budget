import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BucketNode } from '../types';
import { calculateBucketTotals } from '../utils/budgetCalculations';
import { MathInput } from './MathInput';
import {
  ChevronRight,
  ChevronDown,
  Edit3,
  Trash2,
  FileText,
  ArrowRightLeft,
  GripVertical,
  VolumeX,
  Pencil,
  Check,
} from 'lucide-react';

interface BucketCardProps {
  node: BucketNode;
  expandedIds: Record<string, boolean>;
  onToggleExpand: (id: string) => void;
  onOpenInspector: (node: BucketNode) => void;
  onAddChildBucket: (parentNode: BucketNode) => void;
  onDeleteBucket: (id: string) => void;
  onToggleMuteBucket: (id: string) => void;
  onQuickUpdateAllocation: (id: string, newAllocated: number, sessionKey?: string) => void;
  onQuickUpdateFee: (id: string, newFee: number, sessionKey?: string) => void;
  onQuickUpdateName: (id: string, newName: string) => void;
  onDropTransferFunds: (sourceBucketId: string, targetBucketId: string, amount?: number) => void;
  onOpenTransferModal: (sourceBucket: BucketNode) => void;
  onMoveBucket: (movedBucketId: string, targetBucketId: string | null, position?: 'before' | 'after' | 'inside') => void;
}

export const BucketCard: React.FC<BucketCardProps> = ({
  node,
  expandedIds,
  onToggleExpand,
  onOpenInspector,
  onAddChildBucket,
  onDeleteBucket,
  onToggleMuteBucket,
  onQuickUpdateAllocation,
  onQuickUpdateFee,
  onQuickUpdateName,
  onDropTransferFunds,
  onOpenTransferModal,
  onMoveBucket,
}) => {
  const [dropPosition, setDropPosition] = useState<'before' | 'inside' | 'after' | null>(null);
  const [isEditingName, setIsEditingName] = useState(false);
  const [prevName, setPrevName] = useState(node.name);
  const [nameInput, setNameInput] = useState(node.name);

  // Adjust name state during render if external name changes
  if (prevName !== node.name) {
    setPrevName(node.name);
    if (!isEditingName) {
      setNameInput(node.name);
    }
  }

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

  const totals = calculateBucketTotals(node);
  const hasChildren = node.children && node.children.length > 0;
  const isExpanded = expandedIds[node.id] !== false;

  // Highlight newly created bucket and gracefully fade it out after a few seconds
  const [highlightActive, setHighlightActive] = useState(() => {
    const match = node.id.match(/\d{10,}/);
    if (match) {
      const ts = parseInt(match[0], 10);
      return Date.now() - ts < 4000;
    }
    return false;
  });

  useEffect(() => {
    if (highlightActive) {
      const timer = setTimeout(() => {
        setHighlightActive(false);
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [highlightActive]);

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
        if (payload.type === 'fund-transfer' && payload.sourceBucketId !== node.id) {
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
    const trimmed = nameInput.trim();
    if (trimmed && trimmed !== node.name) {
      onQuickUpdateName(node.id, trimmed);
    } else {
      setNameInput(node.name);
    }
    setIsEditingName(false);
  };

  const levelBadgeLabel = isLevel1 ? 'Level 1: Bucket' : isLevel2 ? 'Level 2: Sub-Bucket' : 'Level 3: Sub-Sub Bucket';

  return (
    <motion.div
      layout="position"
      initial={{ opacity: 0, y: -10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      className="relative px-0.5"
    >
      {/* Top Drop Indicator Line */}
      {dropPosition === 'before' && (
        <div className="absolute -top-2 left-0 right-0 z-30 flex items-center gap-2 pointer-events-none">
          <div className="h-2.5 w-2.5 rounded-full bg-[#1A1A18] shadow-sm" />
          <div className="h-1 flex-1 bg-[#1A1A18] rounded-full shadow-sm" />
          <span className="text-[10px] font-extrabold bg-[#1A1A18] text-[#F0EDE5] px-2.5 py-0.5 rounded-full shadow-sm">
            Place Before &ldquo;{node.name}&rdquo;
          </span>
          <div className="h-1 flex-1 bg-[#1A1A18] rounded-full shadow-sm" />
          <div className="h-2.5 w-2.5 rounded-full bg-[#1A1A18] shadow-sm" />
        </div>
      )}

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`rounded-xl transition-all duration-700 border text-left ${
          highlightActive
            ? 'ring-2 ring-[#1A1A18] shadow-md'
            : 'ring-0 ring-transparent shadow-none'
        } ${
          node.isMuted
            ? 'bg-[#C5C3BE]/30 border-dashed border-[#2E2E2C] opacity-65'
            : isLevel1
            ? 'bg-[#F0EDE5] border-[#2E2E2C]/35 shadow-xs p-4 my-3'
            : isLevel2
            ? 'bg-[#C5C3BE]/22 border-[#C5C3BE] p-3.5 my-2.5 ml-3 sm:ml-5'
            : 'bg-[#C5C3BE]/40 border-[#C5C3BE] p-3 my-2 ml-4 sm:ml-8'
        } ${
          dropPosition === 'inside'
            ? 'ring-2 ring-[#1A1A18] bg-[#C5C3BE]/45 border-[#1A1A18] scale-[1.005]'
            : dropPosition === 'before' || dropPosition === 'after'
            ? 'border-[#1A1A18] bg-[#C5C3BE]/30'
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
              className="p-1 text-[#2E2E2C]/60 hover:text-[#1A1A18] cursor-grab active:cursor-grabbing transition-colors rounded hover:bg-[#C5C3BE]/40"
              title="Drag to move or re-order this bucket"
            >
              <GripVertical className="w-4 h-4" />
            </div>

          {/* Expand Chevron */}
          {hasChildren ? (
            <button
              onClick={() => onToggleExpand(node.id)}
              className="p-1 text-[#2E2E2C] hover:text-[#1A1A18] rounded hover:bg-[#C5C3BE]/40 transition-colors cursor-pointer"
            >
              {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
          ) : (
            <span className="w-6"></span>
          )}

          {/* Editable Name & Notes */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              {isEditingName ? (
                <div className="flex items-center gap-1">
                  <input
                    type="text"
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    onBlur={handleSaveName}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveName();
                      if (e.key === 'Escape') {
                        setNameInput(node.name);
                        setIsEditingName(false);
                      }
                    }}
                    className="text-sm font-bold text-[#1A1A18] border border-[#1A1A18] rounded px-1.5 py-0.5 focus:outline-none bg-[#F0EDE5] ring-1 ring-[#1A1A18]"
                    autoFocus
                  />
                  <button
                    onMouseDown={(e) => {
                      // Prevent input blur before click handler
                      e.preventDefault();
                      handleSaveName();
                    }}
                    className="p-1 bg-[#1A1A18] hover:bg-[#2E2E2C] text-[#F0EDE5] rounded cursor-pointer transition-colors"
                    title="Save name"
                  >
                    <Check className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-1 group/name">
                  <h3
                    onClick={() => setIsEditingName(true)}
                    className={`font-bold truncate text-[#1A1A18] cursor-pointer hover:text-[#2E2E2C] transition-colors ${
                      isLevel1 ? 'text-base' : isLevel2 ? 'text-sm' : 'text-xs text-[#2E2E2C]'
                    } ${node.isMuted ? 'line-through text-[#2E2E2C]/65' : ''}`}
                    title="Click to rename bucket"
                  >
                    {node.name}
                  </h3>
                  <button
                    onClick={() => setIsEditingName(true)}
                    className="opacity-0 group-hover/name:opacity-100 p-0.5 text-[#2E2E2C]/65 hover:text-[#1A1A18] transition-opacity cursor-pointer"
                    title="Rename bucket"
                  >
                    <Pencil className="w-3 h-3" />
                  </button>
                </div>
              )}

              <span className="text-[10px] uppercase font-semibold text-[#2E2E2C]/65 tracking-wider">
                {levelBadgeLabel}
              </span>

              {node.isMuted && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#1A1A18] bg-[#C5C3BE]/60 border border-[#2E2E2C]/40 px-2 py-0.5 rounded-full">
                  <VolumeX className="w-3 h-3 text-[#2E2E2C]" />
                  Muted
                </span>
              )}
            </div>

            {/* Dedicated Block Display Slot for Notes Component - ONLY if notes exist */}
            {Boolean(node.notes && node.notes.trim().length > 0) && (
              <div className="block w-full mt-2 relative group">
                <div
                  className="inline-flex items-center gap-1.5 max-w-full px-2.5 py-1 rounded-lg bg-[#C5C3BE]/30 hover:bg-[#C5C3BE]/50 border border-[#C5C3BE] text-[#1A1A18] text-xs font-medium cursor-help transition-colors"
                >
                  <FileText className="w-3.5 h-3.5 text-[#2E2E2C] shrink-0" />
                  <span className="block truncate max-w-[220px] sm:max-w-[340px] font-medium text-[#1A1A18]">
                    {node.notes}
                  </span>
                  <span className="text-[10px] font-semibold bg-[#2E2E2C] text-[#F0EDE5] px-1.5 py-0.2 rounded-full shrink-0 group-hover:bg-[#1A1A18] transition-colors">
                    Note
                  </span>
                </div>

                {/* Pure CSS Non-Blocking Hover Tooltip */}
                <div className="pointer-events-none absolute left-0 top-full mt-1.5 w-72 p-3 bg-[#1A1A18] text-[#F0EDE5] rounded-xl shadow-xl text-xs z-50 border border-[#2E2E2C] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150">
                  <div className="flex items-center gap-1.5 font-bold text-[#F0EDE5] mb-1 border-b border-[#2E2E2C] pb-1.5">
                    <FileText className="w-3.5 h-3.5 text-[#C5C3BE]" />
                    <span>Bucket Note / Payment Memo</span>
                  </div>
                  <p className="text-[#C5C3BE] leading-relaxed whitespace-pre-wrap font-normal break-words">
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
            <span className="text-[10px] font-bold text-[#2E2E2C]/70 uppercase tracking-wider block">
              {hasChildren ? 'Total Allocated' : 'Allocated Fund'}
            </span>

            {!hasChildren ? (
              <div className="flex items-center gap-1 justify-end">
                <MathInput
                  value={node.allocated ?? 0}
                  onChangeValue={(newVal, sessionKey) => onQuickUpdateAllocation(node.id, newVal, sessionKey)}
                  liveHistoryKey={`alloc:${node.id}`}
                  className="w-20 sm:w-24 focus:w-40 text-right text-xs font-bold text-[#1A1A18] bg-[#F0EDE5] border border-[#C5C3BE] rounded px-1.5 py-0.5 focus:border-[#1A1A18] focus:ring-1 focus:ring-[#1A1A18] focus:outline-none tabular-nums"
                  placeholder="0"
                  title="Allocated fund — supports PEMDAS math, e.g. (1+1-500+3)/6"
                />
              </div>
            ) : (
              <div className="text-sm font-extrabold text-[#1A1A18] tabular-nums">
                {totals.allocatedTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
            )}
          </div>

          {/* Dedicated Fees Input */}
          <div className="text-right border-l border-[#C5C3BE] pl-3">
            <span className="text-[10px] font-bold text-[#2E2E2C]/70 uppercase tracking-wider block">
              Dedicated Fee
            </span>
            <div className="flex items-center gap-1 justify-end">
              <MathInput
                value={node.fee ?? 0}
                onChangeValue={(newVal, sessionKey) => onQuickUpdateFee(node.id, newVal, sessionKey)}
                liveHistoryKey={`fee:${node.id}`}
                className="w-16 sm:w-20 focus:w-32 text-right text-xs font-medium text-[#2E2E2C] bg-[#F0EDE5] border border-[#C5C3BE] rounded px-1.5 py-0.5 focus:border-[#1A1A18] focus:ring-1 focus:ring-[#1A1A18] focus:outline-none tabular-nums"
                placeholder="0"
                title="Dedicated fee — supports PEMDAS math, e.g. 50*1.05"
              />
            </div>
          </div>

          {/* Action Buttons Toolbar */}
          <div className="flex items-center gap-1 border-l border-[#C5C3BE] pl-2">
            {/* Can add child bucket if level < 3 */}
            {node.level < 3 && (
              <button
                onClick={() => onAddChildBucket(node)}
                className="inline-flex items-center px-2 py-1 bg-[#1A1A18] hover:bg-[#2E2E2C] text-[#F0EDE5] text-[11px] font-medium rounded-md transition-colors cursor-pointer"
                title={`Add Sub-bucket inside ${node.name}`}
              >
                + Sub
              </button>
            )}

            {/* Quick Mute Toggle */}
            <button
              onClick={() => onToggleMuteBucket(node.id)}
              className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                node.isMuted
                  ? 'text-[#F0EDE5] bg-[#2E2E2C] hover:bg-[#1A1A18]'
                  : 'text-[#2E2E2C] hover:text-[#1A1A18] hover:bg-[#C5C3BE]/45'
              }`}
              title={node.isMuted ? 'Unmute bucket (include in calculations)' : 'Mute bucket (exclude from calculations)'}
            >
              <VolumeX className="w-3.5 h-3.5" />
            </button>

            {/* Quick Transfer Funds */}
            <button
              onClick={() => onOpenTransferModal(node)}
              className="p-1.5 text-[#2E2E2C] hover:text-[#1A1A18] hover:bg-[#C5C3BE]/45 rounded-md transition-colors cursor-pointer"
              title="Transfer funds to another bucket"
            >
              <ArrowRightLeft className="w-3.5 h-3.5" />
            </button>

            {/* Full Inspector Modal */}
            <button
              onClick={() => onOpenInspector(node)}
              className="p-1.5 text-[#2E2E2C] hover:text-[#1A1A18] hover:bg-[#C5C3BE]/45 rounded-md transition-colors cursor-pointer"
              title="Inspect & edit full notes/rules"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>

            {/* Delete Bucket */}
            <button
              onClick={() => onDeleteBucket(node.id)}
              className="p-1.5 text-[#2E2E2C]/75 hover:text-[#1A1A18] hover:bg-[#C5C3BE]/45 rounded-md transition-colors cursor-pointer"
              title="Delete this bucket"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Render Nested Child Buckets */}
      <AnimatePresence initial={false}>
        {hasChildren && isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="mt-3 space-y-2 border-l-2 border-[#C5C3BE] pl-1 sm:pl-2 pr-1"
          >
            {node.children!.map((child) => (
              <BucketCard
                key={child.id}
                node={child}
                expandedIds={expandedIds}
                onToggleExpand={onToggleExpand}
                onOpenInspector={onOpenInspector}
                onAddChildBucket={onAddChildBucket}
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
          </motion.div>
        )}
      </AnimatePresence>
      </div>

      {/* Bottom Drop Indicator Line */}
      {dropPosition === 'after' && (
        <div className="absolute -bottom-2 left-0 right-0 z-30 flex items-center gap-2 pointer-events-none">
          <div className="h-2.5 w-2.5 rounded-full bg-[#1A1A18] shadow-sm" />
          <div className="h-1 flex-1 bg-[#1A1A18] rounded-full shadow-sm" />
          <span className="text-[10px] font-extrabold bg-[#1A1A18] text-[#F0EDE5] px-2.5 py-0.5 rounded-full shadow-sm">
            Place After &ldquo;{node.name}&rdquo;
          </span>
          <div className="h-1 flex-1 bg-[#1A1A18] rounded-full shadow-sm" />
          <div className="h-2.5 w-2.5 rounded-full bg-[#1A1A18] shadow-sm" />
        </div>
      )}
    </motion.div>
  );
};
