import React, { useState } from 'react';
import { OverallTotals } from '../types';
import { INITIAL_PRESETS } from '../data/initialData';
import {
  Wallet,
  Play,
  PlusCircle,
  Receipt,
  RotateCcw,
  Sparkles,
  HelpCircle,
  Pencil,
  Check,
  X,
  AlertTriangle,
  Info,
} from 'lucide-react';

interface HeaderPoolBarProps {
  totals: OverallTotals;
  activePresetId: string;
  onUpdateTotalPool: (newPool: number) => void;
  onOpenAddRootBucket: () => void;
  onOpenAddTransaction: () => void;
  onSelectPreset: (presetId: string) => void;
  unassignedCount: number;
}

export const HeaderPoolBar: React.FC<HeaderPoolBarProps> = ({
  totals,
  activePresetId,
  onUpdateTotalPool,
  onOpenAddRootBucket,
  onOpenAddTransaction,
  onSelectPreset,
  unassignedCount,
}) => {
  const [isEditingPool, setIsEditingPool] = useState(false);
  const [poolInput, setPoolInput] = useState(totals.totalPool.toString());
  const [showTooltip, setShowTooltip] = useState(false);

  const handleSavePool = () => {
    const val = parseFloat(poolInput);
    if (!isNaN(val) && val >= 0) {
      onUpdateTotalPool(val);
      setIsEditingPool(false);
    }
  };

  const isOverAllocated = totals.unallocatedPool < 0;
  const isFullyAllocated = totals.unallocatedPool === 0;

  // Percentage calculations for pool bar
  const poolSafe = totals.totalPool > 0 ? totals.totalPool : 1;
  const allocatedPct = Math.min(100, Math.max(0, (totals.totalAllocated / poolSafe) * 100));
  const feePct = Math.min(100 - allocatedPct, Math.max(0, (totals.totalFees / poolSafe) * 100));
  const unallocatedPct = Math.max(0, 100 - (allocatedPct + feePct));

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      {/* Top Banner Row */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          
          {/* Logo & App Branding */}
          <div className="flex items-center justify-between lg:justify-start gap-3">
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

            {/* Presets Dropdown */}
            <div className="flex items-center gap-2">
              <select
                value={activePresetId}
                onChange={(e) => onSelectPreset(e.target.value)}
                className="text-xs font-medium bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer transition-colors"
                title="Select Budget Template"
              >
                {INITIAL_PRESETS.map((preset) => (
                  <option key={preset.id} value={preset.id}>
                    Preset: {preset.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Action Buttons */}
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

            <button
              onClick={() => onSelectPreset(activePresetId)}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              title="Reset current preset to defaults"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
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
                  <span className="text-sm font-bold text-slate-700">$</span>
                  <input
                    type="number"
                    value={poolInput}
                    onChange={(e) => setPoolInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSavePool();
                      if (e.key === 'Escape') setIsEditingPool(false);
                    }}
                    className="w-full text-base font-bold text-slate-900 border border-emerald-400 rounded px-1 py-0.5 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    autoFocus
                  />
                  <button
                    onClick={handleSavePool}
                    className="p-1 bg-emerald-600 text-white rounded hover:bg-emerald-700"
                  >
                    <Check className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => setIsEditingPool(false)}
                    className="p-1 bg-slate-200 text-slate-600 rounded hover:bg-slate-300"
                  >
                    <X className="w-3 h-3" />
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
                  ${totals.totalPool.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </div>
              )}
            </div>

            {/* Total Allocated */}
            <div className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-2xs">
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Total Allocated
              </div>
              <div className="text-lg font-bold text-emerald-700 mt-0.5">
                ${totals.totalAllocated.toLocaleString(undefined, { minimumFractionDigits: 2 })}
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
                ${totals.totalFees.toLocaleString(undefined, { minimumFractionDigits: 2 })}
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
                ${totals.unallocatedPool.toLocaleString(undefined, { minimumFractionDigits: 2 })}
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
                title={`Allocated: $${totals.totalAllocated.toFixed(2)}`}
              />
              <div
                style={{ width: `${feePct}%` }}
                className="bg-amber-500 h-full transition-all duration-300"
                title={`Dedicated Fees: $${totals.totalFees.toFixed(2)}`}
              />
              <div
                style={{ width: `${unallocatedPct}%` }}
                className={`h-full transition-all duration-300 ${isOverAllocated ? 'bg-rose-500' : 'bg-slate-300'}`}
                title={`Unallocated: $${totals.unallocatedPool.toFixed(2)}`}
              />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
