import React from 'react';
import {
  CheckCircle2,
  Clock,
  Download,
  FileCode,
  FileArchive,
  Layers,
  Sparkles,
  AlertTriangle,
} from 'lucide-react';
import { CloningPhase } from '../types';

interface CloneProgressProps {
  phase: CloningPhase;
  progressPercent: number;
  currentStepText: string;
  downloadedBytes: number;
  totalAssets: number;
  completedAssets: number;
  failedAssets: number;
}

const PHASES_LIST: { id: CloningPhase; label: string; icon: any }[] = [
  { id: 'parsing', label: '1. URL Analysis', icon: Clock },
  { id: 'fetching_html', label: '2. Raw Fetch (id_)', icon: Download },
  { id: 'cleaning', label: '3. Clean Wrappers', icon: Sparkles },
  { id: 'discovering_assets', label: '4. Asset Discovery', icon: Layers },
  { id: 'fetching_assets', label: '5. Asset Download', icon: FileCode },
  { id: 'packaging', label: '6. ZIP Packaging', icon: FileArchive },
];

export const CloneProgress: React.FC<CloneProgressProps> = ({
  phase,
  progressPercent,
  currentStepText,
  downloadedBytes,
  totalAssets,
  completedAssets,
  failedAssets,
}) => {
  if (phase === 'idle') return null;

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 KB';
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const getPhaseIndex = (p: CloningPhase) => {
    if (p === 'completed') return 6;
    if (p === 'error' || p === 'aborted') return -1;
    return PHASES_LIST.findIndex((item) => item.id === p);
  };

  const activeIndex = getPhaseIndex(phase);

  return (
    <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-5 shadow-sm space-y-4">
      {/* Top Header & Percentage */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs uppercase font-mono tracking-wider text-amber-400 font-medium">
            Execution Progress
          </span>
          <p className="text-sm font-medium text-zinc-100 truncate max-w-md sm:max-w-xl">
            {currentStepText || 'Processing...'}
          </p>
        </div>

        <div className="text-right">
          <span className="text-2xl font-mono font-bold text-amber-400">
            {progressPercent}%
          </span>
        </div>
      </div>

      {/* Progress Bar with modern sleek style */}
      <div className="w-full h-2 bg-zinc-950 rounded-full overflow-hidden border border-zinc-800/80 relative">
        <div
          className={`h-full transition-all duration-300 ease-out ${
            phase === 'error'
              ? 'bg-rose-500'
              : phase === 'completed'
              ? 'bg-emerald-500'
              : 'bg-amber-500'
          }`}
          style={{ width: `${Math.max(2, Math.min(100, progressPercent))}%` }}
        />
      </div>

      {/* Pipeline Steps Tracker */}
      <div className="hidden lg:grid grid-cols-6 gap-2 pt-1 border-t border-zinc-800/60">
        {PHASES_LIST.map((step, idx) => {
          const isDone = activeIndex > idx || phase === 'completed';
          const isCurrent = activeIndex === idx && phase !== 'completed';
          const Icon = step.icon;

          return (
            <div
              key={step.id}
              className={`p-2 rounded-lg border text-xs transition-colors flex items-center gap-2 ${
                isDone
                  ? 'bg-emerald-950/20 border-emerald-900/40 text-emerald-300'
                  : isCurrent
                  ? 'bg-amber-950/30 border-amber-800/60 text-amber-300 shadow-sm'
                  : 'bg-zinc-950/40 border-zinc-900 text-zinc-600'
              }`}
            >
              {isDone ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              ) : (
                <Icon
                  className={`w-3.5 h-3.5 shrink-0 ${
                    isCurrent ? 'text-amber-400 animate-pulse' : 'text-zinc-600'
                  }`}
                />
              )}
              <span className="truncate font-mono text-[11px]">{step.label}</span>
            </div>
          );
        })}
      </div>

      {/* Metric Counters Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
        <div className="bg-zinc-950/60 border border-zinc-800/60 rounded-lg p-2.5">
          <span className="text-[10px] uppercase font-mono text-zinc-500 block">
            Data Transferred
          </span>
          <span className="text-sm font-mono font-semibold text-zinc-200">
            {formatBytes(downloadedBytes)}
          </span>
        </div>

        <div className="bg-zinc-950/60 border border-zinc-800/60 rounded-lg p-2.5">
          <span className="text-[10px] uppercase font-mono text-zinc-500 block">
            Assets Processed
          </span>
          <span className="text-sm font-mono font-semibold text-zinc-200">
            {completedAssets} / {totalAssets}
          </span>
        </div>

        <div className="bg-zinc-950/60 border border-zinc-800/60 rounded-lg p-2.5">
          <span className="text-[10px] uppercase font-mono text-zinc-500 block">
            Failed Assets
          </span>
          <span
            className={`text-sm font-mono font-semibold ${
              failedAssets > 0 ? 'text-rose-400' : 'text-zinc-400'
            }`}
          >
            {failedAssets}
          </span>
        </div>

        <div className="bg-zinc-950/60 border border-zinc-800/60 rounded-lg p-2.5">
          <span className="text-[10px] uppercase font-mono text-zinc-500 block">
            Status
          </span>
          <span
            className={`text-sm font-mono font-semibold uppercase ${
              phase === 'completed'
                ? 'text-emerald-400'
                : phase === 'error'
                ? 'text-rose-400'
                : 'text-amber-400'
            }`}
          >
            {phase.replace('_', ' ')}
          </span>
        </div>
      </div>
    </div>
  );
};
