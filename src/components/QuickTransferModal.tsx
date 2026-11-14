import React, { useState } from 'react';
import { BucketNode } from '../types';
import { flattenBuckets } from '../utils/budgetCalculations';
import { MathInput } from './MathInput';
import { X, ArrowRightLeft, DollarSign, Check } from 'lucide-react';

interface QuickTransferModalProps {
  isOpen: boolean;
  sourceBucket: BucketNode | null;
  buckets: BucketNode[];
  onClose: () => void;
  onExecuteTransfer: (sourceId: string, targetId: string, amount: number) => void;
}

export const QuickTransferModal: React.FC<QuickTransferModalProps> = ({
  isOpen,
  sourceBucket,
  buckets,
  onClose,
  onExecuteTransfer,
}) => {
  if (!isOpen || !sourceBucket) return null;

  const flatList = flattenBuckets(buckets).filter((b) => b.node.id !== sourceBucket.id);
  const [targetBucketId, setTargetBucketId] = useState<string>(flatList[0]?.node.id || '');
  const [transferAmount, setTransferAmount] = useState<number>(
    sourceBucket.allocated ? Math.max(0, sourceBucket.allocated) : 50
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isNaN(transferAmount) && transferAmount > 0 && targetBucketId) {
      onExecuteTransfer(sourceBucket.id, targetBucketId, transferAmount);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1A1A18]/50 backdrop-blur-xs p-4">
      <div className="bg-[#F0EDE5] rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-[#C5C3BE] text-left animate-in fade-in duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-[#1A1A18] text-[#F0EDE5]">
          <div className="flex items-center gap-2">
            <ArrowRightLeft className="w-4 h-4 text-[#C5C3BE]" />
            <h2 className="text-sm font-bold text-[#F0EDE5]">Reallocate / Transfer Bucket Funds</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-[#C5C3BE] hover:text-[#F0EDE5] rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-[11px] font-bold text-[#2E2E2C] uppercase tracking-wider mb-1">
              Source Bucket
            </label>
            <div className="p-2.5 bg-[#C5C3BE]/25 border border-[#C5C3BE] rounded-lg text-xs font-bold text-[#1A1A18]">
              {sourceBucket.name} (Available: {sourceBucket.allocated.toFixed(2)})
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-[#2E2E2C] uppercase tracking-wider mb-1">
              Target Bucket
            </label>
            <select
              value={targetBucketId}
              onChange={(e) => setTargetBucketId(e.target.value)}
              className="w-full text-xs font-semibold text-[#1A1A18] bg-[#F0EDE5] border border-[#C5C3BE] rounded-lg p-2 focus:ring-2 focus:ring-[#1A1A18] focus:outline-none"
              required
            >
              {flatList.map((item) => (
                <option key={item.node.id} value={item.node.id}>
                  {item.pathName} ({item.node.allocated.toFixed(2)})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-[#2E2E2C] uppercase tracking-wider mb-1">
              Transfer Amount
            </label>
            <MathInput
              value={transferAmount}
              onChangeValue={setTransferAmount}
              placeholder="0"
              className="w-full text-sm font-bold text-[#1A1A18] bg-[#F0EDE5] border border-[#C5C3BE] rounded-lg p-2 focus:ring-2 focus:ring-[#1A1A18] focus:outline-none tabular-nums"
              title="Transfer amount — supports math formulas e.g. (1000-200)/2"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-[#C5C3BE]">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs font-semibold text-[#2E2E2C] hover:bg-[#C5C3BE]/40 rounded-lg cursor-pointer transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-[#1A1A18] hover:bg-[#2E2E2C] text-[#F0EDE5] text-xs font-bold rounded-lg shadow-xs cursor-pointer transition-colors"
            >
              Execute Transfer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
