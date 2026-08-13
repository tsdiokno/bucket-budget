import React, { useState, useEffect } from 'react';
import {
  BucketNode,
  Transaction,
  ActiveTab,
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
import { TransactionLedger } from './components/TransactionLedger';
import { QuickTransferModal } from './components/QuickTransferModal';
import {
  Receipt,
  CheckCircle2,
  FolderTree,
} from 'lucide-react';

export default function App() {
  const [data, setData] = useState(() => loadStoredData());
  const [activeTab, setActiveTab] = useState<ActiveTab>('buckets');
  
  // Autosave status state
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved');
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(new Date());

  // Modal states
  const [inspectNode, setInspectNode] = useState<BucketNode | null>(null);
  const [transferSourceNode, setTransferSourceNode] = useState<BucketNode | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Debounced auto-save changes to localStorage (400ms delay)
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
    }, 400);

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

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
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

  const totals = calculateOverallTotals(data.totalPool, data.buckets, data.transactions);

  // Pool handlers
  const handleUpdateTotalPool = (newPool: number) => {
    setData((prev) => ({ ...prev, totalPool: newPool }));
    showToast(`Master Cash Pool updated to $${newPool.toLocaleString()}`);
  };

  // Bucket updates
  const handleSaveInspectedNode = (updatedNode: BucketNode) => {
    setData((prev) => ({
      ...prev,
      buckets: updateBucketInTree(prev.buckets, updatedNode.id, () => updatedNode),
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

    // Immediately open inspector for newly created sub-bucket
    setInspectNode(newBucket);
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
      notes: 'Root allocation domain.',
    };

    setData((prev) => ({
      ...prev,
      buckets: addChildBucketToTree(prev.buckets, null, newRoot),
    }));

    setInspectNode(newRoot);
    showToast('Created new Root Bucket');
  };

  // Delete bucket
  const handleDeleteBucket = (id: string) => {
    const target = findBucketById(data.buckets, id);
    if (!target) return;

    // Collect all deleted bucket IDs (target + descendants)
    const deletedIds = new Set<string>();
    const collectIds = (node: BucketNode) => {
      deletedIds.add(node.id);
      node.children?.forEach(collectIds);
    };
    collectIds(target);

    // Unassign transactions linked to deleted buckets
    const updatedTxs = data.transactions.map((tx) =>
      tx.bucketId && deletedIds.has(tx.bucketId) ? { ...tx, bucketId: null } : tx
    );

    setData((prev) => ({
      ...prev,
      buckets: removeBucketFromTree(prev.buckets, id),
      transactions: updatedTxs,
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

  // Drag-and-drop transaction categorization
  const handleDropTransaction = (transactionId: string, targetBucketId: string) => {
    const targetBucket = findBucketById(data.buckets, targetBucketId);
    const tx = data.transactions.find((t) => t.id === transactionId);

    if (!tx || !targetBucket) return;

    setData((prev) => ({
      ...prev,
      transactions: prev.transactions.map((t) =>
        t.id === transactionId ? { ...t, bucketId: targetBucketId } : t
      ),
    }));

    showToast(`Categorized "${tx.merchant}" to "${targetBucket.name}"`);
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

    showToast(`Reallocated $${transferVal.toFixed(2)} from "${sourceNode.name}" to "${targetNode.name}"`);
  };

  // Transaction ledger handlers
  const handleAssignTransaction = (transactionId: string, bucketId: string | null) => {
    setData((prev) => ({
      ...prev,
      transactions: prev.transactions.map((t) =>
        t.id === transactionId ? { ...t, bucketId } : t
      ),
    }));
  };

  const handleAddTransaction = (newTx: Omit<Transaction, 'id'>) => {
    const created: Transaction = {
      ...newTx,
      id: `tx-${Date.now()}`,
    };
    setData((prev) => ({
      ...prev,
      transactions: [created, ...prev.transactions],
    }));
    showToast(`Added transaction "${created.merchant}" ($${created.amount})`);
  };

  const handleDeleteTransaction = (id: string) => {
    setData((prev) => ({
      ...prev,
      transactions: prev.transactions.filter((t) => t.id !== id),
    }));
  };

  const unassignedTxs = data.transactions.filter((t) => t.bucketId === null);

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
        onOpenAddTransaction={() => setActiveTab('transactions')}
        onExportData={handleExportData}
        onImportData={handleImportData}
        onResetData={handleResetData}
        unassignedCount={unassignedTxs.length}
      />

      {/* Main Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* Navigation Tabs Bar */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('buckets')}
              className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                activeTab === 'buckets'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200/80'
              }`}
            >
              <FolderTree className="w-4 h-4 text-emerald-400" />
              <span>3-Tier Bucket Tree Canvas</span>
            </button>

            <button
              onClick={() => setActiveTab('transactions')}
              className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                activeTab === 'transactions'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200/80'
              }`}
            >
              <Receipt className="w-4 h-4 text-amber-400" />
              <span>Transaction Queue</span>
              {unassignedTxs.length > 0 && (
                <span className="bg-amber-500 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                  {unassignedTxs.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Tab Views */}
        {activeTab === 'buckets' && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Main Tree Canvas (3 cols) */}
            <div className="lg:col-span-3 space-y-4">
              <BucketTree
                buckets={data.buckets}
                transactions={data.transactions}
                onOpenInspector={(node) => setInspectNode(node)}
                onAddChildBucket={handleAddChildBucket}
                onAddRootBucket={handleAddRootBucket}
                onDeleteBucket={handleDeleteBucket}
                onQuickUpdateAllocation={handleQuickUpdateAllocation}
                onQuickUpdateFee={handleQuickUpdateFee}
                onQuickUpdateName={handleQuickUpdateName}
                onDropTransaction={handleDropTransaction}
                onDropTransferFunds={handleExecuteFundTransfer}
                onOpenTransferModal={(node) => setTransferSourceNode(node)}
                onMoveBucket={handleMoveBucket}
              />
            </div>

            {/* Quick Unassigned Transactions Drawer (1 col) */}
            <div className="lg:col-span-1 space-y-4">
              <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs text-left sticky top-24">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2.5 mb-3">
                  <div className="flex items-center gap-2">
                    <Receipt className="w-4 h-4 text-amber-500" />
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      Unassigned Queue ({unassignedTxs.length})
                    </h3>
                  </div>
                </div>

                <p className="text-[11px] text-slate-500 mb-3">
                  Drag items from here onto any bucket tile to categorize instantly.
                </p>

                <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
                  {unassignedTxs.length > 0 ? (
                    unassignedTxs.map((tx) => (
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
                        className="p-2.5 bg-amber-50/50 hover:bg-amber-100/60 border border-amber-200 rounded-xl cursor-grab active:cursor-grabbing transition-all text-xs space-y-1"
                      >
                        <div className="flex items-center justify-between font-bold text-slate-900">
                          <span className="truncate max-w-[120px]">{tx.merchant}</span>
                          <span className="text-amber-800">-${tx.amount.toFixed(2)}</span>
                        </div>
                        <p className="text-[10px] text-slate-500 truncate">{tx.description}</p>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-6 text-xs text-slate-400">
                      All pool transactions categorized!
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'transactions' && (
          <TransactionLedger
            transactions={data.transactions}
            buckets={data.buckets}
            onAssignTransaction={handleAssignTransaction}
            onAddTransaction={handleAddTransaction}
            onDeleteTransaction={handleDeleteTransaction}
          />
        )}
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
