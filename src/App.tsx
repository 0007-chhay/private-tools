import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Header, ToolMode } from './components/Header';
import { UrlInputSection } from './components/UrlInputSection';
import { CloneProgress } from './components/CloneProgress';
import { DownloadCard } from './components/DownloadCard';
import { TerminalLogs } from './components/TerminalLogs';
import { AssetsTable } from './components/AssetsTable';
import { CleanedPreview } from './components/CleanedPreview';
import { ConfigModal } from './components/ConfigModal';
import { R2BackupView } from './components/R2BackupView';
import { CFAccountCreatorView } from './components/CFAccountCreatorView';
import { TrendAnalyticsView } from './components/TrendAnalyticsView';
import {
  AssetItem,
  CloneConfig,
  CloneResult,
  CloningPhase,
  LogEntry,
} from './types';
import { parseMultipleUrls } from './utils/urlParser';
import { executeCloneSite } from './utils/clonerEngine';
import {
  Terminal,
  Layers,
  Eye,
  AlertCircle,
  Zap,
} from 'lucide-react';

const DEFAULT_CONFIG: CloneConfig = {
  includeImages: true,
  includeStyles: true,
  includeScripts: true,
  includeFonts: true,
  deepCssAssets: true,
  cleanToolbarComments: true,
  rewriteInternalLinks: true,
  maxAssets: 80,
  concurrency: 4,
};

export default function App() {
  // Tool mode selector: 'wayback' | 'rclone_r2'
  const [currentTool, setCurrentTool] = useState<ToolMode>('rclone_r2');

  // Input state
  const [inputUrlText, setInputUrlText] = useState<string>('');

  // Configuration state
  const [config, setConfig] = useState<CloneConfig>(DEFAULT_CONFIG);
  const [isConfigOpen, setIsConfigOpen] = useState(false);

  // Execution state for Wayback cloner
  const [phase, setPhase] = useState<CloningPhase>('idle');
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [currentStepText, setCurrentStepText] = useState<string>('');
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [assets, setAssets] = useState<AssetItem[]>([]);
  const [stats, setStats] = useState({
    downloadedBytes: 0,
    completedCount: 0,
    failedCount: 0,
  });
  const [cloneResult, setCloneResult] = useState<CloneResult | null>(null);
  const [cloneError, setCloneError] = useState<string | null>(null);

  // Active view tab in bottom section
  const [activeBottomTab, setActiveBottomTab] = useState<'logs' | 'assets' | 'preview'>('logs');
  const [previewSubTab, setPreviewSubTab] = useState<'preview' | 'code' | 'files'>('preview');

  const abortControllerRef = useRef<AbortController | null>(null);

  // Parse URLs whenever input changes
  const parsedUrls = useMemo(() => {
    return parseMultipleUrls(inputUrlText);
  }, [inputUrlText]);

  const isCloning =
    phase !== 'idle' &&
    phase !== 'completed' &&
    phase !== 'error' &&
    phase !== 'aborted';

  // Config summary for header
  const configSummary = useMemo(() => {
    const parts: string[] = [];
    if (config.includeImages) parts.push('Img');
    if (config.includeStyles) parts.push('CSS');
    if (config.includeScripts) parts.push('JS');
    return `${parts.join('+')}, ${config.concurrency}x`;
  }, [config]);

  // Handle start cloning
  const handleStartCloning = async () => {
    const validTargets = parsedUrls.filter((p) => p.isValid);
    if (validTargets.length === 0) return;

    setCloneError(null);
    setCloneResult(null);
    setLogs([]);
    setAssets([]);
    setProgressPercent(0);
    setStats({ downloadedBytes: 0, completedCount: 0, failedCount: 0 });

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      const result = await executeCloneSite(
        validTargets,
        config,
        {
          onPhaseChange: (newPhase) => setPhase(newPhase),
          onProgress: (pct, step) => {
            setProgressPercent(pct);
            setCurrentStepText(step);
          },
          onLog: (newLog) => setLogs((prev) => [...prev, newLog]),
          onAssetUpdate: (updatedAssets) => setAssets(updatedAssets),
          onStatsUpdate: (newStats) => setStats(newStats),
        },
        abortController.signal
      );

      setCloneResult(result);
      setActiveBottomTab('preview');
      setPreviewSubTab('preview');
    } catch (err: any) {
      if (err?.message !== 'Cloning cancelled') {
        setCloneError(err?.message || 'Failed to clone site');
      }
    } finally {
      abortControllerRef.current = null;
    }
  };

  const handleAbortCloning = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

  const handleClearLogs = () => {
    setLogs([]);
  };

  // Keyboard shortcut: Cmd/Ctrl + Enter to run
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        if (currentTool === 'wayback' && !isCloning && parsedUrls.length > 0 && parsedUrls[0].isValid) {
          handleStartCloning();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentTool, isCloning, parsedUrls, config]);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-amber-500/30 selection:text-amber-200">
      {/* App Header with Tool Mode Switcher right where the user indicated */}
      <Header
        currentTool={currentTool}
        onSelectTool={setCurrentTool}
        onOpenConfig={() => setIsConfigOpen(true)}
        configSummary={configSummary}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {currentTool === 'trend_analytics' ? (
          /* Mode 4: Viral Trends, Hashtags & TikTok Analytics */
          <TrendAnalyticsView />
        ) : currentTool === 'cf_accounts' ? (
          /* Mode 3: Cloudflare 100+ Account Creator */
          <CFAccountCreatorView />
        ) : currentTool === 'rclone_r2' ? (
          /* Mode 2: Rclone & Cloudflare R2 Backup */
          <R2BackupView />
        ) : (
          /* Mode 1: Wayback Machine Site Cloner */
          <>
            {/* Input & Extraction Setup */}
            <UrlInputSection
              inputUrlText={inputUrlText}
              onInputChange={setInputUrlText}
              parsedUrls={parsedUrls}
              isCloning={isCloning}
              onStartCloning={handleStartCloning}
              onAbortCloning={handleAbortCloning}
            />

            {/* Error Notification */}
            {cloneError && (
              <div className="bg-rose-950/40 border border-rose-900/60 rounded-xl p-4 text-xs text-rose-300 flex items-start gap-3 shadow-sm">
                <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-semibold text-rose-200 text-sm block">
                    Extraction Error
                  </span>
                  <p>{cloneError}</p>
                  <p className="text-zinc-400 pt-1">
                    Tip: Check that the Wayback snapshot exists and is accessible. You can also adjust concurrency or disable problematic asset types in Settings.
                  </p>
                </div>
              </div>
            )}

            {/* Progress & Live Pipeline */}
            {phase !== 'idle' && (
              <CloneProgress
                phase={phase}
                progressPercent={progressPercent}
                currentStepText={currentStepText}
                downloadedBytes={stats.downloadedBytes}
                totalAssets={assets.length}
                completedAssets={stats.completedCount}
                failedAssets={stats.failedCount}
              />
            )}

            {/* Download Result Card */}
            {cloneResult && (
              <DownloadCard
                result={cloneResult}
                onOpenPreview={() => {
                  setActiveBottomTab('preview');
                  setPreviewSubTab('preview');
                }}
                onOpenFiles={() => {
                  setActiveBottomTab('preview');
                  setPreviewSubTab('files');
                }}
              />
            )}

            {/* Interactive Workspace Tabs */}
            <section className="space-y-3">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setActiveBottomTab('logs')}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                      activeBottomTab === 'logs'
                        ? 'bg-zinc-800 text-zinc-100 shadow-sm'
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <Terminal className="w-3.5 h-3.5 text-amber-400" />
                    <span>Live Logs</span>
                    {logs.length > 0 && (
                      <span className="text-[10px] font-mono text-zinc-400 bg-zinc-900 px-1.5 py-0.2 rounded">
                        {logs.length}
                      </span>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveBottomTab('assets')}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                      activeBottomTab === 'assets'
                        ? 'bg-zinc-800 text-zinc-100 shadow-sm'
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5 text-sky-400" />
                    <span>Assets Catalog</span>
                    {assets.length > 0 && (
                      <span className="text-[10px] font-mono text-zinc-400 bg-zinc-900 px-1.5 py-0.2 rounded">
                        {assets.length}
                      </span>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveBottomTab('preview')}
                    disabled={!cloneResult}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer ${
                      activeBottomTab === 'preview'
                        ? 'bg-zinc-800 text-zinc-100 shadow-sm'
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <Eye className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Site Preview &amp; Code</span>
                    {cloneResult && (
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    )}
                  </button>
                </div>

                <div className="hidden sm:flex items-center gap-3 text-xs text-zinc-500 font-mono">
                  <span className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-[10px]">
                      Cmd+Enter
                    </kbd>
                    <span>to clone</span>
                  </span>
                </div>
              </div>

              {/* Tab Panes */}
              {activeBottomTab === 'logs' && (
                <TerminalLogs
                  logs={logs}
                  onClearLogs={handleClearLogs}
                  isCloning={isCloning}
                />
              )}

              {activeBottomTab === 'assets' && (
                <AssetsTable assets={assets} />
              )}

              {activeBottomTab === 'preview' && cloneResult && (
                <CleanedPreview
                  result={cloneResult}
                  activeTab={previewSubTab}
                  onTabChange={setPreviewSubTab}
                />
              )}
            </section>

            {/* Feature Explainer & Architecture footer */}
            <section className="bg-zinc-900/40 border border-zinc-850 rounded-xl p-4 text-xs text-zinc-400 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <span className="text-zinc-200 font-semibold flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  Raw "id_" Flag Targeting
                </span>
                <p className="text-zinc-500 leading-relaxed">
                  Extracts the snapshot using the raw Wayback URL format (<code className="text-zinc-400">/web/{'{timestamp}'}id_/{'{url}'}</code>) to download pristine original source code directly from Internet Archive storage.
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-zinc-200 font-semibold flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5 text-purple-400" />
                  Toolbar &amp; Telemetry Stripping
                </span>
                <p className="text-zinc-500 leading-relaxed">
                  Scans and purges any archive.org inject scripts (<code className="text-zinc-400">wombat.js</code>, banner-styles, analytics, comment headers) to leave zero trace of archive wrappers.
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-zinc-200 font-semibold flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-emerald-400" />
                  Local Asset Packaging
                </span>
                <p className="text-zinc-500 leading-relaxed">
                  Rewrites CSS, JS, image, and font references into local relative paths and bundles everything via JSZip into a standalone, offline-ready <code className="text-zinc-400">.ZIP</code>.
                </p>
              </div>
            </section>
          </>
        )}
      </main>

      {/* Settings Modal (for Wayback Cloner) */}
      <ConfigModal
        isOpen={isConfigOpen}
        onClose={() => setIsConfigOpen(false)}
        config={config}
        onChangeConfig={setConfig}
        onResetDefaults={() => setConfig(DEFAULT_CONFIG)}
      />
    </div>
  );
}
