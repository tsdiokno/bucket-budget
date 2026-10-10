import React, { useState, useEffect, useRef } from 'react';
import {
  BucketNode,
} from './types';
import {
  loadStoredData,
  saveBudgetData,
  exportBudgetData,
  importBudgetData,
  resetToDefaultData,
} from './utils/storage';
import {
  calculateOverallTotals,
  updateBucketInTree,
  addChildBucketToTree,
  removeBucketFromTree,
  moveBucketInTree,
  findBucketById,
} from './utils/budgetCalculations';
import { HeaderPoolBar } from './components/HeaderPoolBar';
import { BucketTree } from './components/BucketTree';
import { BucketModal } from './components/BucketModal';
import { QuickTransferModal } from './components/QuickTransferModal';
import {
  CheckCircle2,
} from 'lucide-react';

export default function App() {
  const [data, setData] = useState(() => loadStoredData());
  
  // Autosave status state
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved');
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(new Date());

  // Modal states
  const [inspectNode, setInspectNode] = useState<BucketNode | null>(null);
  const [transferSourceNode, setTransferSourceNode] = useState<BucketNode | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Debounced auto-save changes to localStorage (250ms delay)
  useEffect(() => {
    setSaveStatus('saving');
    const timer = setTimeout(() => {
      const ok = saveBudgetData(data);
      if (ok) {
        setSaveStatus('saved');
        setLastSavedAt(new Date());
      } else {
        setSaveStatus('error');
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [data]);

  // Synchronously save pending state when page unloads or loses visibility
  useEffect(() => {
    const handleFlushSave = () => {
      saveBudgetData(data);
    };
    window.addEventListener('beforeunload', handleFlushSave);
    window.addEventListener('pagehide', handleFlushSave);
    return () => {
      window.removeEventListener('beforeunload', handleFlushSave);
      window.removeEventListener('pagehide', handleFlushSave);
    };
  }, [data]);

  const handleManualSave = () => {
    const ok = saveBudgetData(data);
    if (ok) {
      setSaveStatus('saved');
      setLastSavedAt(new Date());
      showToast('All changes saved to local storage');
    } else {
      setSaveStatus('error');
      showToast('Failed to save data to local storage');
    }
  };

  const toastTimerRef = useRef<NodeJS.Timeout | null>(null);

  const showToast = (msg: string) => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }
    setToastMessage(msg);
    toastTimerRef.current = setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const handleExportData = () => {
    exportBudgetData(data);
    showToast('Downloaded budget backup (.json)');
  };

  const handleImportData = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const imported = importBudgetData(text);
        setData(imported);
        showToast('Successfully restored budget from backup file!');
      } catch (err: any) {
        alert(`Import failed: ${err.message || 'Invalid budget JSON file'}`);
      }
    };
    reader.readAsText(file);
  };

  const handleResetData = () => {
    const reset = resetToDefaultData();
    setData(reset);
    showToast('Reset budget to baseline template');
  };

  const totals = calculateOverallTotals(data.totalPool, data.buckets);

  // Pool handlers
  const handleUpdateTotalPool = (newPool: number) => {
    setData((prev) => ({ ...prev, totalPool: newPool }));
  };

  // Mute bucket toggle handler
  const handleToggleMuteBucket = (id: string) => {
    setData((prev) => ({
      ...prev,
      buckets: updateBucketInTree(prev.buckets, id, (node) => ({
        ...node,
        isMuted: !node.isMuted,
      })),
    }));
    const node = findBucketById(data.buckets, id);
    if (node) {
      showToast(`${node.isMuted ? 'Unmuted' : 'Muted'} bucket "${node.name}"`);
    }
  };

  // Bucket updates
  const handleSaveInspectedNode = (updatedNode: BucketNode) => {
    setData((prev) => ({
      ...prev,
      buckets: updateBucketInTree(prev.buckets, updatedNode.id, (old) => ({
        ...old,
        name: updatedNode.name,
        notes: updatedNode.notes,
        fee: updatedNode.fee,
        allocated: updatedNode.allocated,
        isMuted: updatedNode.isMuted,
      })),
    }));
    showToast(`Updated bucket metadata for "${updatedNode.name}"`);
  };

  const handleQuickUpdateAllocation = (id: string, newAllocated: number) => {
    setData((prev) => ({
      ...prev,
      buckets: updateBucketInTree(prev.buckets, id, (node) => ({
        ...node,
        allocated: newAllocated,
      })),
    }));
  };

  const handleQuickUpdateFee = (id: string, newFee: number) => {
    setData((prev) => ({
      ...prev,
      buckets: updateBucketInTree(prev.buckets, id, (node) => ({
        ...node,
        fee: newFee,
      })),
    }));
  };

  const handleQuickUpdateName = (id: string, newName: string) => {
    setData((prev) => ({
      ...prev,
      buckets: updateBucketInTree(prev.buckets, id, (node) => ({
        ...node,
        name: newName,
      })),
    }));
  };

  // Add child bucket (Level 2 or Level 3)
  const handleAddChildBucket = (parentNode: BucketNode) => {
    if (parentNode.level >= 3) {
      alert('Maximum depth of 3 levels reached (Bucket → Sub-Bucket → Sub-Sub Bucket).');
      return;
    }

    const nextLevel = (parentNode.level + 1) as 2 | 3;
    const levelLabel = nextLevel === 2 ? 'Sub-Bucket' : 'Sub-Sub Bucket';

    const newBucket: BucketNode = {
      id: `bucket-${Date.now()}`,
      name: `New ${levelLabel}`,
      level: nextLevel,
      parentId: parentNode.id,
      allocated: 0,
      fee: 0,
      notes: '',
    };

    setData((prev) => ({
      ...prev,
      buckets: addChildBucketToTree(prev.buckets, parentNode.id, newBucket),
    }));

    showToast(`Added ${levelLabel} under "${parentNode.name}"`);
  };

  // Add root bucket (Level 1)
  const handleAddRootBucket = () => {
    const newRoot: BucketNode = {
      id: `root-${Date.now()}`,
      name: 'New Level 1 Bucket',
      level: 1,
      parentId: null,
      allocated: 0,
      fee: 0,
      notes: '',
    };

    setData((prev) => ({
      ...prev,
      buckets: addChildBucketToTree(prev.buckets, null, newRoot),
    }));

    showToast('Created new Root Bucket');
  };

  // Delete bucket
  const handleDeleteBucket = (id: string) => {
    const target = findBucketById(data.buckets, id);
    if (!target) return;

    setData((prev) => ({
      ...prev,
      buckets: removeBucketFromTree(prev.buckets, id),
    }));
    showToast(`Deleted bucket "${target.name}"`);
  };

  // Re-parent / Move / Reorder bucket node within tree
  const handleMoveBucket = (
    movedId: string,
    targetId: string | null,
    position: 'before' | 'after' | 'inside' = 'inside'
  ) => {
    const movedNode = findBucketById(data.buckets, movedId);
    if (!movedNode) return;

    if (targetId) {
      const targetNode = findBucketById(data.buckets, targetId);
      if (!targetNode) return;

      if (position === 'inside' && targetNode.level >= 3) {
        alert(`Cannot place sub-bucket inside "${targetNode.name}" because it is already at maximum depth (Level 3).`);
        return;
      }
    }

    setData((prev) => ({
      ...prev,
      buckets: moveBucketInTree(prev.buckets, movedId, targetId, position),
    }));

    const targetNode = targetId ? findBucketById(data.buckets, targetId) : null;
    const targetName = targetNode ? targetNode.name : 'Top-Level Root';
    showToast(`Moved "${movedNode.name}" ${position} ${targetName}`);
  };

  // Drag-and-drop or modal fund transfers between buckets
  const handleExecuteFundTransfer = (sourceId: string, targetId: string, amount?: number) => {
    const sourceNode = findBucketById(data.buckets, sourceId);
    const targetNode = findBucketById(data.buckets, targetId);

    if (!sourceNode || !targetNode) return;

    const transferVal = amount || sourceNode.allocated;
    if (transferVal <= 0) return;

    setData((prev) => {
      let updated = updateBucketInTree(prev.buckets, sourceId, (n) => ({
        ...n,
        allocated: Math.max(0, n.allocated - transferVal),
      }));
      updated = updateBucketInTree(updated, targetId, (n) => ({
        ...n,
        allocated: n.allocated + transferVal,
      }));
      return { ...prev, buckets: updated };
    });

    showToast(`Reallocated ${transferVal.toFixed(2)} from "${sourceNode.name}" to "${targetNode.name}"`);
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 font-sans flex flex-col">
      
      {/* Top Header & Pool Metrics Bar */}
      <HeaderPoolBar
        totals={totals}
        activePresetId={data.activePresetId}
        saveStatus={saveStatus}
        lastSavedAt={lastSavedAt}
        onUpdateTotalPool={handleUpdateTotalPool}
        onOpenAddRootBucket={handleAddRootBucket}
        onExportData={handleExportData}
        onImportData={handleImportData}
        onResetData={handleResetData}
        onManualSave={handleManualSave}
      />

      {/* Main Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <div className="w-full space-y-4">
          <BucketTree
            buckets={data.buckets}
            onOpenInspector={(node) => setInspectNode(node)}
            onAddChildBucket={handleAddChildBucket}
            onAddRootBucket={handleAddRootBucket}
            onDeleteBucket={handleDeleteBucket}
            onToggleMuteBucket={handleToggleMuteBucket}
            onQuickUpdateAllocation={handleQuickUpdateAllocation}
            onQuickUpdateFee={handleQuickUpdateFee}
            onQuickUpdateName={handleQuickUpdateName}
            onDropTransferFunds={handleExecuteFundTransfer}
            onOpenTransferModal={(node) => setTransferSourceNode(node)}
            onMoveBucket={handleMoveBucket}
          />
        </div>
      </main>

      {/* Bucket Inspector Modal */}
      <BucketModal
        isOpen={!!inspectNode}
        node={inspectNode}
        allBuckets={data.buckets}
        onClose={() => setInspectNode(null)}
        onSave={handleSaveInspectedNode}
        onMoveBucket={handleMoveBucket}
      />

      {/* Quick Reallocate / Transfer Modal */}
      <QuickTransferModal
        isOpen={!!transferSourceNode}
        sourceBucket={transferSourceNode}
        buckets={data.buckets}
        onClose={() => setTransferSourceNode(null)}
        onExecuteTransfer={handleExecuteFundTransfer}
      />

      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white text-xs font-semibold px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 border border-slate-800 animate-in slide-in-from-bottom-2 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
