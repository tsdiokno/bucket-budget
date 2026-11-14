import React, { useState, useRef } from 'react';
import { OverallTotals } from '../types';
import { MathInput } from './MathInput';
import {
  RotateCcw,
  Pencil,
  Check,
  AlertTriangle,
  Info,
  CheckCircle2,
  RefreshCw,
  Download,
  Upload,
  HardDrive,
  Undo2,
  Redo2,
} from 'lucide-react';

interface HeaderPoolBarProps {
  totals: OverallTotals;
  activePresetId: string;
  saveStatus: 'saved' | 'saving' | 'error';
  lastSavedAt: Date | null;
  canUndo?: boolean;
  canRedo?: boolean;
  undoLabel?: string | null;
  redoLabel?: string | null;
  onUndo?: () => void;
  onRedo?: () => void;
  onUpdateTotalPool: (newPool: number, sessionKey?: string) => void;
  onOpenAddRootBucket: () => void;
  onExportData: () => void;
  onImportData: (file: File) => void;
  onResetData: () => void;
  onManualSave?: () => void;
}

export const HeaderPoolBar: React.FC<HeaderPoolBarProps> = ({
  totals,
  activePresetId,
  saveStatus,
  lastSavedAt,
  canUndo = false,
  canRedo = false,
  undoLabel,
  redoLabel,
  onUndo,
  onRedo,
  onUpdateTotalPool,
  onOpenAddRootBucket,
  onExportData,
  onImportData,
  onResetData,
  onManualSave,
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
    <header className="bg-[#F0EDE5] border-b border-[#C5C3BE] sticky top-0 z-30">
      {/* Top Banner Row */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          
          {/* App Branding + Autosave Badge */}
          <div className="flex items-center justify-between lg:justify-start gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-[#1A1A18]">
                  Bucket Budget
                </h1>
                <span className="inline-flex items-center text-[11px] font-medium text-[#2E2E2C] bg-[#C5C3BE]/35 border border-[#C5C3BE] px-2 py-0.5 rounded-full">
                  3-Tier Engine
                </span>
              </div>
              <p className="text-xs text-[#2E2E2C]/80 font-medium">
                Hierarchical fund allocation &amp; intelligent categorization
              </p>
            </div>

            {/* Live Autosave Indicator */}
            <button
              type="button"
              onClick={onManualSave}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-medium transition-all cursor-pointer ${
                saveStatus === 'error'
                  ? 'bg-[#C5C3BE]/45 border-[#1A1A18] text-[#1A1A18]'
                  : 'bg-[#C5C3BE]/25 hover:bg-[#C5C3BE]/45 border-[#C5C3BE] text-[#2E2E2C]'
              }`}
              title={onManualSave ? 'Click to save immediately to local storage' : 'Autosave status'}
            >
              {saveStatus === 'saving' ? (
                <>
                  <RefreshCw className="w-3 h-3 text-[#2E2E2C] animate-spin shrink-0" />
                  <span className="text-[#1A1A18] font-semibold">Autosaving...</span>
                </>
              ) : saveStatus === 'error' ? (
                <>
                  <AlertTriangle className="w-3 h-3 text-[#1A1A18] shrink-0" />
                  <span className="text-[#1A1A18] font-semibold">Save error (click to retry)</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#2E2E2C] shrink-0" />
                  <span className="text-[#1A1A18] font-medium">Saved</span>
                  <span className="text-[#2E2E2C]/70 text-[10px] ml-0.5 tabular-nums">({formatSavedTime(lastSavedAt)})</span>
                </>
              )}
            </button>
          </div>

          {/* Action Buttons & Data Controls */}
          <div className="flex items-center flex-wrap gap-2 sm:gap-2.5">
            {/* Undo / Redo Controls */}
            <div className="inline-flex items-center rounded-lg border border-[#C5C3BE] bg-[#C5C3BE]/25 p-0.5">
              <button
                type="button"
                onClick={onUndo}
                disabled={!canUndo}
                className={`inline-flex items-center gap-1 px-2 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  canUndo
                    ? 'text-[#1A1A18] hover:bg-[#F0EDE5] cursor-pointer'
                    : 'text-[#C5C3BE] cursor-not-allowed'
                }`}
                title={canUndo && undoLabel ? `Undo: ${undoLabel} (Ctrl+Z)` : 'Nothing to undo (Ctrl+Z)'}
                aria-label="Undo"
              >
                <Undo2 className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Undo</span>
              </button>
              <div className="w-px h-4 bg-[#C5C3BE] mx-0.5" />
              <button
                type="button"
                onClick={onRedo}
                disabled={!canRedo}
                className={`inline-flex items-center gap-1 px-2 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  canRedo
                    ? 'text-[#1A1A18] hover:bg-[#F0EDE5] cursor-pointer'
                    : 'text-[#C5C3BE] cursor-not-allowed'
                }`}
                title={canRedo && redoLabel ? `Redo: ${redoLabel} (Ctrl+Y)` : 'Nothing to redo (Ctrl+Y)'}
                aria-label="Redo"
              >
                <Redo2 className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Redo</span>
              </button>
            </div>

            <button
              onClick={onOpenAddRootBucket}
              className="inline-flex items-center px-3 py-2 bg-[#1A1A18] hover:bg-[#2E2E2C] text-[#F0EDE5] text-xs font-medium rounded-lg transition-colors cursor-pointer"
            >
              + Root Bucket
            </button>

            {/* Data Management / Backup Actions Menu */}
            <div className="relative">
              <button
                onClick={() => setShowDataMenu(!showDataMenu)}
                className="inline-flex items-center gap-1.5 px-2.5 py-2 bg-[#F0EDE5] hover:bg-[#C5C3BE]/35 border border-[#C5C3BE] text-[#1A1A18] text-xs font-medium rounded-lg transition-colors cursor-pointer"
                title="Backup, export, or import budget data"
              >
                <HardDrive className="w-3.5 h-3.5 text-[#2E2E2C]" />
                <span className="hidden sm:inline">Data Backup</span>
              </button>

              {showDataMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-[#F0EDE5] border border-[#C5C3BE] rounded-xl shadow-xl z-50 p-1.5 text-xs text-[#1A1A18] space-y-1 animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-2 py-1.5 border-b border-[#C5C3BE] font-bold text-[#1A1A18] text-[11px] uppercase tracking-wider flex items-center justify-between">
                    <span>Data Storage</span>
                    <span className="text-[10px] font-medium text-[#2E2E2C] flex items-center gap-1">
                      <Check className="w-3 h-3" /> Active
                    </span>
                  </div>

                  <button
                    onClick={() => {
                      onExportData();
                      setShowDataMenu(false);
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-[#C5C3BE]/35 text-[#1A1A18] font-medium cursor-pointer transition-colors"
                  >
                    <Download className="w-3.5 h-3.5 text-[#2E2E2C] shrink-0" />
                    <span>Export JSON Backup</span>
                  </button>

                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-[#C5C3BE]/35 text-[#1A1A18] font-medium cursor-pointer transition-colors"
                  >
                    <Upload className="w-3.5 h-3.5 text-[#2E2E2C] shrink-0" />
                    <span>Import JSON Backup</span>
                  </button>

                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept=".json"
                    className="hidden"
                  />

                  <div className="border-t border-[#C5C3BE] pt-1">
                    <button
                      onClick={() => {
                        if (confirm('Reset budget data to default baseline template? This will overwrite current buckets.')) {
                          onResetData();
                          setShowDataMenu(false);
                        }
                      }}
                      className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-[#C5C3BE]/45 text-[#1A1A18] font-medium cursor-pointer transition-colors"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-[#2E2E2C] shrink-0" />
                      <span>Reset Baseline Budget</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Master Pool Metrics Bar */}
        <div className="mt-4 bg-[#C5C3BE]/25 border border-[#C5C3BE] rounded-xl p-3 sm:p-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3 text-left">
            
            {/* Total Pool Input Box */}
            <div className="col-span-2 sm:col-span-1 bg-[#F0EDE5] p-2.5 rounded-lg border border-[#C5C3BE]">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-[#2E2E2C] uppercase tracking-wider">
                  Total Pool
                </span>
                {!isEditingPool && (
                  <button
                    onClick={() => {
                      setPoolInput(totals.totalPool.toString());
                      setIsEditingPool(true);
                    }}
                    className="p-1 text-[#2E2E2C]/70 hover:text-[#1A1A18] transition-colors cursor-pointer"
                    title="Edit Starting Pool Amount"
                  >
                    <Pencil className="w-3 h-3" />
                  </button>
                )}
              </div>

              {isEditingPool ? (
                <div className="flex items-center gap-1 mt-1">
                  <MathInput
                    value={totals.totalPool}
                    onChangeValue={(newVal, sessionKey) => onUpdateTotalPool(newVal, sessionKey)}
                    liveHistoryKey="total-pool"
                    onDone={() => setIsEditingPool(false)}
                    className="w-full text-base font-bold text-[#1A1A18] bg-[#F0EDE5] border border-[#1A1A18] rounded px-1.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-[#1A1A18] tabular-nums"
                    placeholder="0"
                    title="Total pool amount — supports PEMDAS math e.g. 2500+500"
                    autoFocus
                  />
                  <button
                    onClick={() => setIsEditingPool(false)}
                    className="p-1 bg-[#1A1A18] text-[#F0EDE5] rounded hover:bg-[#2E2E2C] cursor-pointer shrink-0"
                    title="Done editing"
                  >
                    <Check className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <div
                  onClick={() => setIsEditingPool(true)}
                  className="text-lg font-extrabold text-[#1A1A18] mt-0.5 cursor-pointer hover:text-[#2E2E2C] transition-colors tabular-nums"
                  title="Click to edit pool amount (supports math formulas)"
                >
                  {totals.totalPool.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </div>
              )}
            </div>

            {/* Total Allocated */}
            <div className="bg-[#F0EDE5] p-2.5 rounded-lg border border-[#C5C3BE]">
              <div className="text-[11px] font-semibold text-[#2E2E2C] uppercase tracking-wider">
                Total Allocated
              </div>
              <div className="text-lg font-bold text-[#1A1A18] mt-0.5 tabular-nums">
                {totals.totalAllocated.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
            </div>

            {/* Dedicated Fees */}
            <div className="bg-[#F0EDE5] p-2.5 rounded-lg border border-[#C5C3BE]">
              <div className="flex items-center gap-1 text-[11px] font-semibold text-[#2E2E2C] uppercase tracking-wider">
                <span>Dedicated Fees</span>
                <div className="relative">
                  <Info
                    className="w-3 h-3 text-[#2E2E2C]/70 cursor-pointer"
                    onMouseEnter={() => setShowTooltip(true)}
                    onMouseLeave={() => setShowTooltip(false)}
                  />
                  {showTooltip && (
                    <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-1 w-48 bg-[#1A1A18] text-[#F0EDE5] text-[10px] p-2 rounded shadow-lg z-50 pointer-events-none">
                      Dedicated fees set per bucket (bank ACH, service surcharges) subtracted directly from the available pool.
                    </div>
                  )}
                </div>
              </div>
              <div className="text-lg font-bold text-[#2E2E2C] mt-0.5 tabular-nums">
                {totals.totalFees.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
            </div>

            {/* Unallocated Pool */}
            <div
              className={`col-span-2 sm:col-span-1 p-2.5 rounded-lg border transition-colors ${
                isOverAllocated
                  ? 'bg-[#C5C3BE]/45 border-[#1A1A18] text-[#1A1A18]'
                  : isFullyAllocated
                  ? 'bg-[#1A1A18] border-[#1A1A18] text-[#F0EDE5]'
                  : 'bg-[#F0EDE5] border-[#C5C3BE] text-[#1A1A18]'
              }`}
            >
              <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider">
                <span>Unallocated Pool</span>
                {isOverAllocated && <AlertTriangle className="w-3.5 h-3.5 text-[#1A1A18]" />}
              </div>
              <div
                className={`text-lg font-extrabold mt-0.5 tabular-nums ${
                  isFullyAllocated ? 'text-[#F0EDE5]' : 'text-[#1A1A18]'
                }`}
              >
                {totals.unallocatedPool.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
            </div>
          </div>

          {/* Visual Pool Allocation Bar */}
          <div className="space-y-1">
            <div className="flex justify-between text-[11px] font-medium text-[#2E2E2C] tabular-nums">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#ed3f1c] inline-block" />
                Allocated ({allocatedPct.toFixed(1)}%)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#2E2E2C] inline-block" />
                Dedicated Fees ({feePct.toFixed(1)}%)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full inline-block bg-[#C5C3BE]" />
                Unallocated ({unallocatedPct.toFixed(1)}%)
              </span>
            </div>

            <div className="w-full h-2.5 bg-[#C5C3BE]/55 rounded-full overflow-hidden flex">
              <div
                style={{ width: `${allocatedPct}%` }}
                className="bg-[#ed3f1c] h-full transition-all duration-300"
                title={`Allocated: ${totals.totalAllocated.toFixed(2)}`}
              />
              <div
                style={{ width: `${feePct}%` }}
                className="bg-[#2E2E2C] h-full transition-all duration-300"
                title={`Dedicated Fees: ${totals.totalFees.toFixed(2)}`}
              />
              <div
                style={{ width: `${unallocatedPct}%` }}
                className="bg-[#C5C3BE] h-full transition-all duration-300"
                title={`Unallocated: ${totals.unallocatedPool.toFixed(2)}`}
              />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
