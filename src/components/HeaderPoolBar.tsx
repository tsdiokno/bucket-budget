import React, { useState, useRef } from 'react';
import { OverallTotals } from '../types';
import {
  Wallet,
  PlusCircle,
  Receipt,
  RotateCcw,
  Sparkles,
  Pencil,
  Check,
  X,
  AlertTriangle,
  Info,
  CheckCircle2,
  RefreshCw,
  Download,
  Upload,
  HardDrive,
  Save,
} from 'lucide-react';

interface HeaderPoolBarProps {
  totals: OverallTotals;
  activePresetId: string;
  saveStatus: 'saved' | 'saving' | 'error';
  lastSavedAt: Date | null;
  onUpdateTotalPool: (newPool: number) => void;
  onOpenAddRootBucket: () => void;
  onOpenAddTransaction: () => void;
  onExportData: () => void;
  onImportData: (file: File) => void;
  onResetData: () => void;
  unassignedCount: number;
}

export const HeaderPoolBar: React.FC<HeaderPoolBarProps> = ({
  totals,
  activePresetId,
  saveStatus,
  lastSavedAt,
  onUpdateTotalPool,
  onOpenAddRootBucket,
  onOpenAddTransaction,
  onExportData,
  onImportData,
  onResetData,
  unassignedCount,
}) => {
  const [isEditingPool, setIsEditingPool] = useState(false);
  const [prevTotalPool, setPrevTotalPool] = useState(totals.totalPool);
  const [poolInput, setPoolInput] = useState(totals.totalPool.toString());

  if (totals.totalPool !== prevTotalPool) {
    setPrevTotalPool(totals.totalPool);
    if (!isEditingPool) {
      setPoolInput(totals.totalPool.toString());
    }
  }
  const [showTooltip, setShowTooltip] = useState(false);
  const [showDataMenu, setShowDataMenu] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSavePool = () => {
    const val = parseFloat(poolInput);
    if (!isNaN(val) && val >= 0) {
      onUpdateTotalPool(val);
      setIsEditingPool(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImportData(file);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      setShowDataMenu(false);
    }
  };

  const isOverAllocated = totals.unallocatedPool < 0;
  const isFullyAllocated = totals.unallocatedPool === 0;

  // Percentage calculations for pool bar
  const poolSafe = totals.totalPool > 0 ? totals.totalPool : 1;
  const allocatedPct = Math.min(100, Math.max(0, (totals.totalAllocated / poolSafe) * 100));
  const feePct = Math.min(100 - allocatedPct, Math.max(0, (totals.totalFees / poolSafe) * 100));
  const unallocatedPct = Math.max(0, 100 - (allocatedPct + feePct));

  const formatSavedTime = (date: Date | null) => {
    if (!date) return 'Just now';
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      {/* Top Banner Row */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          
          {/* Logo & App Branding + Autosave Badge */}
          <div className="flex items-center justify-between lg:justify-start gap-4">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-slate-900 text-emerald-400 flex items-center justify-center shadow-sm font-semibold text-xl">
                <Wallet className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold tracking-tight text-slate-900">
                    Bucket Budget
                  </h1>
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                    <Sparkles className="w-3 h-3 text-emerald-600" />
                    3-Tier Engine
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-medium">
                  Hierarchical fund allocation & intelligent categorization
                </p>
              </div>
            </div>

            {/* Live Autosave Indicator */}
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200/80 text-[11px] font-medium text-slate-600">
              {saveStatus === 'saving' ? (
                <>
                  <RefreshCw className="w-3 h-3 text-amber-500 animate-spin" />
                  <span className="text-amber-700 font-semibold">Autosaving...</span>
                </>
              ) : saveStatus === 'error' ? (
                <>
                  <AlertTriangle className="w-3 h-3 text-rose-500" />
                  <span className="text-rose-700 font-semibold">Save error</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-slate-700">Autosaved</span>
                  <span className="text-slate-400 text-[10px] ml-0.5">({formatSavedTime(lastSavedAt)})</span>
                </>
              )}
            </div>
          </div>

          {/* Action Buttons & Data Controls */}
          <div className="flex items-center flex-wrap gap-2 sm:gap-2.5">
            <button
              onClick={onOpenAddRootBucket}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white text-xs font-medium rounded-lg transition-colors cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>+ Root Bucket</span>
            </button>

            <button
              onClick={onOpenAddTransaction}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-medium rounded-lg transition-colors cursor-pointer relative"
            >
              <Receipt className="w-3.5 h-3.5 text-slate-500" />
              <span>+ Transaction</span>
              {unassignedCount > 0 && (
                <span className="bg-amber-500 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full ml-0.5">
                  {unassignedCount}
                </span>
              )}
            </button>

            {/* Data Management / Backup Actions Menu */}
            <div className="relative">
              <button
                onClick={() => setShowDataMenu(!showDataMenu)}
                className="inline-flex items-center gap-1.5 px-2.5 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-medium rounded-lg transition-colors cursor-pointer"
                title="Backup, export, or import budget data"
              >
                <HardDrive className="w-3.5 h-3.5 text-slate-600" />
                <span className="hidden sm:inline">Data Backup</span>
              </button>

              {showDataMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-xl z-50 p-1.5 text-xs text-slate-700 space-y-1 animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-2 py-1.5 border-b border-slate-100 font-bold text-slate-900 text-[11px] uppercase tracking-wider flex items-center justify-between">
                    <span>Data Storage</span>
                    <span className="text-[10px] font-normal text-emerald-600 flex items-center gap-1">
                      <Check className="w-3 h-3" /> Active
                    </span>
                  </div>

                  <button
                    onClick={() => {
                      onExportData();
                      setShowDataMenu(false);
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-slate-50 text-slate-800 font-medium cursor-pointer transition-colors"
                  >
                    <Download className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Export JSON Backup</span>
                  </button>

                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-slate-50 text-slate-800 font-medium cursor-pointer transition-colors"
                  >
                    <Upload className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span>Import JSON Backup</span>
                  </button>

                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept=".json"
                    className="hidden"
                  />

                  <div className="border-t border-slate-100 pt-1">
                    <button
                      onClick={() => {
                        if (confirm('Reset budget data to default baseline template? This will overwrite current buckets.')) {
                          onResetData();
                          setShowDataMenu(false);
                        }
                      }}
                      className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-rose-50 text-rose-700 font-medium cursor-pointer transition-colors"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                      <span>Reset Baseline Budget</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Master Pool Metrics Bar */}
        <div className="mt-4 bg-slate-50 border border-slate-200/80 rounded-xl p-3 sm:p-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3 text-left">
            
            {/* Total Pool Input Box */}
            <div className="col-span-2 sm:col-span-1 bg-white p-2.5 rounded-lg border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  Total Pool
                </span>
                {!isEditingPool && (
                  <button
                    onClick={() => {
                      setPoolInput(totals.totalPool.toString());
                      setIsEditingPool(true);
                    }}
                    className="p-1 text-slate-400 hover:text-emerald-600 transition-colors"
                    title="Edit Starting Pool Amount"
                  >
                    <Pencil className="w-3 h-3" />
                  </button>
                )}
              </div>

              {isEditingPool ? (
                <div className="flex items-center gap-1 mt-1">
                  <input
                    type="number"
                    step="any"
                    min="0"
                    placeholder="0"
                    value={poolInput}
                    onChange={(e) => {
                      const valStr = e.target.value;
                      setPoolInput(valStr);
                      const parsed = parseFloat(valStr);
                      onUpdateTotalPool(!isNaN(parsed) && parsed >= 0 ? parsed : 0);
                    }}
                    onBlur={() => {
                      const parsed = parseFloat(poolInput);
                      if (isNaN(parsed) || parsed < 0 || poolInput.trim() === '') {
                        setPoolInput('0');
                        onUpdateTotalPool(0);
                      } else {
                        setPoolInput(parsed.toString());
                      }
                      setIsEditingPool(false);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') setIsEditingPool(false);
                      if (e.key === 'Escape') setIsEditingPool(false);
                    }}
                    className="w-full text-base font-bold text-slate-900 border border-emerald-400 rounded px-1 py-0.5 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    autoFocus
                  />
                  <button
                    onClick={() => setIsEditingPool(false)}
                    className="p-1 bg-emerald-600 text-white rounded hover:bg-emerald-700"
                  >
                    <Check className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <div
                  onClick={() => {
                    setPoolInput(totals.totalPool.toString());
                    setIsEditingPool(true);
                  }}
                  className="text-lg font-extrabold text-slate-900 mt-0.5 cursor-pointer hover:text-emerald-700 transition-colors"
                  title="Click to edit pool amount"
                >
                  {totals.totalPool.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </div>
              )}
            </div>

            {/* Total Allocated */}
            <div className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-2xs">
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Total Allocated
              </div>
              <div className="text-lg font-bold text-emerald-700 mt-0.5">
                {totals.totalAllocated.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
            </div>

            {/* Dedicated Fees */}
            <div className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-2xs">
              <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                <span>Dedicated Fees</span>
                <div className="relative">
                  <Info
                    className="w-3 h-3 text-slate-400 cursor-pointer"
                    onMouseEnter={() => setShowTooltip(true)}
                    onMouseLeave={() => setShowTooltip(false)}
                  />
                  {showTooltip && (
                    <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-1 w-48 bg-slate-900 text-white text-[10px] p-2 rounded shadow-lg z-50 pointer-events-none">
                      Dedicated fees set per bucket (bank ACH, service surcharges) subtracted directly from the available pool.
                    </div>
                  )}
                </div>
              </div>
              <div className="text-lg font-bold text-amber-700 mt-0.5">
                {totals.totalFees.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
            </div>

            {/* Unallocated Pool */}
            <div
              className={`col-span-2 sm:col-span-1 p-2.5 rounded-lg border shadow-2xs transition-colors ${
                isOverAllocated
                  ? 'bg-rose-50 border-rose-200 text-rose-900'
                  : isFullyAllocated
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-emerald-500/10 border-emerald-300 text-emerald-950'
              }`}
            >
              <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider">
                <span>Unallocated Pool</span>
                {isOverAllocated && <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />}
              </div>
              <div className={`text-lg font-extrabold mt-0.5 ${isOverAllocated ? 'text-rose-700' : 'text-emerald-700'}`}>
                {totals.unallocatedPool.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
            </div>
          </div>

          {/* Visual Pool Allocation Bar */}
          <div className="space-y-1">
            <div className="flex justify-between text-[11px] font-medium text-slate-600">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block" />
                Allocated ({allocatedPct.toFixed(1)}%)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
                Dedicated Fees ({feePct.toFixed(1)}%)
              </span>
              <span className="flex items-center gap-1.5">
                <span className={`w-2.5 h-2.5 rounded-full inline-block ${isOverAllocated ? 'bg-rose-500' : 'bg-slate-300'}`} />
                Unallocated ({unallocatedPct.toFixed(1)}%)
              </span>
            </div>

            <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden flex shadow-inner">
              <div
                style={{ width: `${allocatedPct}%` }}
                className="bg-emerald-600 h-full transition-all duration-300"
                title={`Allocated: ${totals.totalAllocated.toFixed(2)}`}
              />
              <div
                style={{ width: `${feePct}%` }}
                className="bg-amber-500 h-full transition-all duration-300"
                title={`Dedicated Fees: ${totals.totalFees.toFixed(2)}`}
              />
              <div
                style={{ width: `${unallocatedPct}%` }}
                className={`h-full transition-all duration-300 ${isOverAllocated ? 'bg-rose-500' : 'bg-slate-300'}`}
                title={`Unallocated: ${totals.unallocatedPool.toFixed(2)}`}
              />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
