import React, { useState } from 'react';
import { BucketNode } from '../types';
import { flattenBuckets, isDescendant } from '../utils/budgetCalculations';
import { MathInput } from './MathInput';
import {
  X,
  Save,
  FileText,
  VolumeX,
} from 'lucide-react';

interface BucketModalProps {
  isOpen: boolean;
  node: BucketNode | null;
  allBuckets: BucketNode[];
  onClose: () => void;
  onSave: (updatedNode: BucketNode, newParentId?: string | null) => void;
}

export const BucketModal: React.FC<BucketModalProps> = ({
  isOpen,
  node,
  allBuckets,
  onClose,
  onSave,
}) => {
  if (!isOpen || !node) return null;

  const [prevNodeId, setPrevNodeId] = useState(node.id);
  const [name, setName] = useState(node.name);
  const [notes, setNotes] = useState(node.notes || '');
  const [fee, setFee] = useState<number>(node.fee ?? 0);
  const [allocated, setAllocated] = useState<number>(node.allocated ?? 0);
  const [isMuted, setIsMuted] = useState(!!node.isMuted);
  const [selectedParentId, setSelectedParentId] = useState<string>(node.parentId || '');

  if (node.id !== prevNodeId) {
    setPrevNodeId(node.id);
    setName(node.name);
    setNotes(node.notes || '');
    setFee(node.fee ?? 0);
    setAllocated(node.allocated ?? 0);
    setIsMuted(!!node.isMuted);
    setSelectedParentId(node.parentId || '');
  }

  // Available parent options (exclude self, descendants, and level 3 buckets)
  const flattened = flattenBuckets(allBuckets);
  const eligibleParents = flattened.filter(({ node: item }) => {
    if (item.id === node.id) return false;
    if (isDescendant(node, item.id)) return false;
    if (item.level >= 3) return false;
    return true;
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    const currentParent = node.parentId || '';
    const newParentId =
      selectedParentId !== currentParent
        ? selectedParentId === ''
          ? null
          : selectedParentId
        : undefined;

    const hasChildren = !!(node.children && node.children.length > 0);
    const updated: BucketNode = {
      ...node,
      name: name.trim() || 'Untitled Bucket',
      notes: notes.trim(),
      fee: !isNaN(fee) ? fee : 0,
      allocated: hasChildren ? (node.allocated ?? 0) : (!isNaN(allocated) ? allocated : 0),
      isMuted,
    };

    onSave(updated, newParentId);
    onClose();
  };

  const levelText = node.level === 1 ? 'Level 1: Root Bucket' : node.level === 2 ? 'Level 2: Sub-Bucket' : 'Level 3: Sub-Sub Bucket';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1A1A18]/50 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-[#F0EDE5] rounded-2xl shadow-xl w-full max-w-xl overflow-hidden border border-[#C5C3BE] animate-in fade-in zoom-in-95 duration-150 my-8 text-left">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#1A1A18] text-[#F0EDE5]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#2E2E2C] text-[#F0EDE5] flex items-center justify-center font-bold text-sm">
              L{node.level}
            </div>
            <div>
              <h2 className="text-base font-bold text-[#F0EDE5]">Bucket Inspector & Metadata</h2>
              <p className="text-xs text-[#C5C3BE]">{levelText}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#C5C3BE] hover:text-[#F0EDE5] rounded-lg hover:bg-[#2E2E2C] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-6 space-y-5">
          
          {/* Bucket Name & Parent Placement Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#2E2E2C] uppercase tracking-wider mb-1.5">
                Bucket Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full text-sm font-semibold text-[#1A1A18] bg-[#F0EDE5] border border-[#C5C3BE] rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#1A1A18] focus:outline-none"
                placeholder="e.g., Mortgage Payment, Groceries, Emergency Vault"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#2E2E2C] uppercase tracking-wider mb-1.5">
                Parent Category / Placement
              </label>
              <select
                value={selectedParentId}
                onChange={(e) => setSelectedParentId(e.target.value)}
                className="w-full text-xs font-semibold text-[#1A1A18] border border-[#C5C3BE] rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-[#1A1A18] focus:outline-none bg-[#C5C3BE]/25"
              >
                <option value="">— Top-Level Root Bucket —</option>
                {eligibleParents.map(({ node: item, pathName }) => (
                  <option key={item.id} value={item.id}>
                    {item.level === 1 ? 'Root: ' : '↳ Sub: '}{pathName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Allocation & Dedicated Fee Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Current Allocated */}
            <div>
              <label className="block text-xs font-bold text-[#2E2E2C] uppercase tracking-wider mb-1">
                Current Allocated Amount
              </label>
              <MathInput
                value={allocated}
                onChangeValue={setAllocated}
                className="w-full px-3 py-1.5 text-xs font-bold text-[#1A1A18] bg-[#F0EDE5] border border-[#C5C3BE] rounded-lg focus:ring-2 focus:ring-[#1A1A18] focus:outline-none tabular-nums"
                placeholder="0"
                title="Current allocated amount — supports PEMDAS math e.g. (1+1-500+3)/6"
              />
            </div>

            {/* Dedicated Fee */}
            <div>
              <label className="block text-xs font-bold text-[#2E2E2C] uppercase tracking-wider mb-1">
                Dedicated Fee
              </label>
              <MathInput
                value={fee}
                onChangeValue={setFee}
                className="w-full px-3 py-1.5 text-xs font-bold text-[#1A1A18] bg-[#F0EDE5] border border-[#C5C3BE] rounded-lg focus:ring-2 focus:ring-[#1A1A18] focus:outline-none tabular-nums"
                placeholder="0"
                title="Dedicated fee — supports PEMDAS math e.g. 50*1.05"
              />
              <p className="text-[10px] text-[#2E2E2C]/75 mt-1">
                ACH / Portal convenience charge (supports math)
              </p>
            </div>
          </div>

          {/* Mute Toggle Section */}
          <div className="flex items-center justify-between p-3 bg-[#C5C3BE]/25 border border-[#C5C3BE] rounded-xl">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-[#C5C3BE]/60 text-[#1A1A18]">
                <VolumeX className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-[#1A1A18] block">Mute Bucket</span>
                <span className="text-[11px] text-[#2E2E2C] block">Temporarily exclude this bucket from all calculations</span>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isMuted}
                onChange={(e) => setIsMuted(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-[#C5C3BE] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-[#F0EDE5] after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-[#F0EDE5] after:border-[#C5C3BE] after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#1A1A18]"></div>
            </label>
          </div>

          {/* Notes Row */}
          <div>
            <label className="block text-xs font-bold text-[#2E2E2C] uppercase tracking-wider mb-1">
              Editable Notes & Payment Instructions
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full text-xs text-[#1A1A18] bg-[#F0EDE5] border border-[#C5C3BE] rounded-lg p-2 focus:ring-2 focus:ring-[#1A1A18] focus:outline-none"
              placeholder="Add account policy numbers, due dates, or payment memos..."
            />
          </div>

          {/* Modal Footer Actions */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#C5C3BE]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-[#2E2E2C] hover:text-[#1A1A18] bg-[#C5C3BE]/35 hover:bg-[#C5C3BE]/60 rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#1A1A18] hover:bg-[#2E2E2C] text-[#F0EDE5] text-xs font-bold rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Changes</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
