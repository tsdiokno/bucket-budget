import React, { useState, useEffect } from 'react';
import { BucketNode } from '../types';
import { flattenBuckets, isDescendant } from '../utils/budgetCalculations';
import {
  X,
  Save,
  DollarSign,
  FileText,
  Sliders,
  Layers,
  CheckCircle2,
  AlertCircle,
  Hash,
  FolderTree,
} from 'lucide-react';

interface BucketModalProps {
  isOpen: boolean;
  node: BucketNode | null;
  allBuckets: BucketNode[];
  onClose: () => void;
  onSave: (updatedNode: BucketNode) => void;
  onMoveBucket: (movedId: string, newParentId: string | null) => void;
}

export const BucketModal: React.FC<BucketModalProps> = ({
  isOpen,
  node,
  allBuckets,
  onClose,
  onSave,
  onMoveBucket,
}) => {
  if (!isOpen || !node) return null;

  const [name, setName] = useState(node.name);
  const [notes, setNotes] = useState(node.notes || '');
  const [fee, setFee] = useState(node.fee || 0);
  const [allocated, setAllocated] = useState(node.allocated || 0);
  const [selectedParentId, setSelectedParentId] = useState<string>(node.parentId || '');

  useEffect(() => {
    setName(node.name);
    setNotes(node.notes || '');
    setFee(node.fee || 0);
    setAllocated(node.allocated || 0);
    setSelectedParentId(node.parentId || '');
  }, [node]);

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

    // Check if parent placement changed
    const currentParent = node.parentId || '';
    if (selectedParentId !== currentParent) {
      onMoveBucket(node.id, selectedParentId === '' ? null : selectedParentId);
    }

    const updated: BucketNode = {
      ...node,
      name: name.trim() || 'Untitled Bucket',
      notes: notes.trim(),
      fee: Math.max(0, Number(fee) || 0),
      allocated: Math.max(0, Number(allocated) || 0),
    };

    onSave(updated);
    onClose();
  };

  const levelText = node.level === 1 ? 'Level 1: Root Bucket' : node.level === 2 ? 'Level 2: Sub-Bucket' : 'Level 3: Sub-Sub Bucket';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150 my-8 text-left">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-sm">
              L{node.level}
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Bucket Inspector & Metadata</h2>
              <p className="text-xs text-slate-400">{levelText}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-6 space-y-5">
          
          {/* Bucket Name & Parent Placement Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Bucket Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full text-sm font-semibold text-slate-900 border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                placeholder="e.g., Mortgage Payment, Groceries, Emergency Vault"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Parent Category / Placement
              </label>
              <select
                value={selectedParentId}
                onChange={(e) => setSelectedParentId(e.target.value)}
                className="w-full text-xs font-semibold text-slate-900 border border-slate-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-slate-50"
              >
                <option value="">— Top-Level Root Bucket —</option>
                {eligibleParents.map(({ node: item, pathName }) => (
                  <option key={item.id} value={item.id}>
                    {item.level === 1 ? '📁 Root: ' : '↳ Sub: '}{pathName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Allocation & Dedicated Fee Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Current Allocated */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Current Allocated ($)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">$</span>
                <input
                  type="number"
                  step="0.01"
                  value={allocated}
                  onChange={(e) => setAllocated(Number(e.target.value))}
                  className="w-full pl-7 pr-3 py-1.5 text-xs font-bold text-emerald-800 bg-emerald-50/50 border border-emerald-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Dedicated Fee */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Dedicated Fee ($)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">$</span>
                <input
                  type="number"
                  step="0.01"
                  value={fee}
                  onChange={(e) => setFee(Number(e.target.value))}
                  className="w-full pl-7 pr-3 py-1.5 text-xs font-bold text-amber-800 bg-amber-50/50 border border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  placeholder="0.00"
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                ACH / Portal convenience charge
              </p>
            </div>
          </div>

          {/* Notes Row */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Editable Notes & Payment Instructions
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full text-xs text-slate-800 border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              placeholder="Add account policy numbers, due dates, or payment memos..."
            />
          </div>

          {/* Modal Footer Actions */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-xs transition-colors cursor-pointer"
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
