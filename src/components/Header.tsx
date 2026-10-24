import React from 'react';
import {
  Archive,
  Cloud,
  SlidersHorizontal,
  ShieldCheck,
  Database,
  UserPlus,
  TrendingUp,
  BarChart3,
  Send,
  LayoutGrid,
  Sparkles,
} from 'lucide-react';

export type ToolMode =
  | 'all_tools'
  | 'super_intelligent'
  | 'wayback'
  | 'rclone_r2'
  | 'cf_accounts'
  | 'trend_analytics'
  | 'telegram_auto_reply';

interface HeaderProps {
  currentTool: ToolMode;
  onSelectTool: (tool: ToolMode) => void;
  onOpenConfig?: () => void;
  configSummary?: string;
}

export const Header: React.FC<HeaderProps> = ({
  currentTool,
  onSelectTool,
  onOpenConfig,
  configSummary,
}) => {
  return (
    <header className="border-b border-zinc-800 bg-zinc-950/90 backdrop-blur-md sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Tool Mode Switcher with all 6 tools + All Tools Hub */}
        <div className="flex items-center gap-3 overflow-x-auto no-scrollbar py-1">
          <div className="p-1 bg-zinc-900 border border-zinc-800 rounded-xl flex items-center gap-1 shadow-inner shrink-0">
            {/* All Tools Hub button */}
            <button
              type="button"
              onClick={() => onSelectTool('all_tools')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                currentTool === 'all_tools'
                  ? 'bg-amber-500 text-zinc-950 shadow font-bold'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850'
              }`}
              title="All Tools Dashboard"
            >
              <LayoutGrid className="w-3.5 h-3.5 shrink-0" />
              <span>All Tools</span>
            </button>

            {/* Super-Intelligent AI Studio button */}
            <button
              type="button"
              onClick={() => onSelectTool('super_intelligent')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                currentTool === 'super_intelligent'
                  ? 'bg-gradient-to-r from-amber-500 to-amber-400 text-zinc-950 shadow font-bold'
                  : 'text-amber-400 hover:text-amber-300 hover:bg-zinc-850'
              }`}
              title="Super-Intelligent AI Studio"
            >
              <Sparkles className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden sm:inline">Super-Intelligent</span>
              <span className="sm:hidden">Super-AI</span>
            </button>

            <div className="w-[1px] h-4 bg-zinc-800 mx-0.5" />

            <button
              type="button"
              onClick={() => onSelectTool('wayback')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                currentTool === 'wayback'
                  ? 'bg-amber-500 text-zinc-950 shadow'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850'
              }`}
            >
              <Archive className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden sm:inline">Wayback Site Cloner</span>
              <span className="sm:hidden">Wayback</span>
            </button>

            <button
              type="button"
              onClick={() => onSelectTool('rclone_r2')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                currentTool === 'rclone_r2'
                  ? 'bg-amber-500 text-zinc-950 shadow'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850'
              }`}
            >
              <Cloud className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden sm:inline">Rclone / Cloudflare R2</span>
              <span className="sm:hidden">Rclone R2</span>
            </button>

            <button
              type="button"
              onClick={() => onSelectTool('cf_accounts')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                currentTool === 'cf_accounts'
                  ? 'bg-amber-500 text-zinc-950 shadow'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden sm:inline">CF Account Creator</span>
              <span className="sm:hidden">CF Creator</span>
            </button>

            <button
              type="button"
              onClick={() => onSelectTool('trend_analytics')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                currentTool === 'trend_analytics'
                  ? 'bg-amber-500 text-zinc-950 shadow'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden sm:inline">Trends &amp; Analytics</span>
              <span className="sm:hidden">Trends</span>
            </button>

            <button
              type="button"
              onClick={() => onSelectTool('telegram_auto_reply')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                currentTool === 'telegram_auto_reply'
                  ? 'bg-sky-500 text-zinc-950 shadow font-bold'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850'
              }`}
            >
              <Send className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden sm:inline">Telegram Auto-Reply</span>
              <span className="sm:hidden">Telegram</span>
            </button>
          </div>

          <div className="hidden xl:block">
            <p className="text-xs text-zinc-400 flex items-center gap-1.5 font-mono">
              {currentTool === 'all_tools' ? (
                <>
                  <span className="text-amber-400 font-semibold">6 Tools Hub</span>
                  <span aria-hidden="true" className="text-zinc-600">·</span>
                  <span>Direct Navigation</span>
                  <span aria-hidden="true" className="text-zinc-600">·</span>
                  <span>Automations &amp; Cloners</span>
                </>
              ) : currentTool === 'super_intelligent' ? (
                <>
                  <span className="text-amber-400 font-semibold">Gemini AI Studio</span>
                  <span aria-hidden="true" className="text-zinc-600">·</span>
                  <span>Images 8K</span>
                  <span aria-hidden="true" className="text-zinc-600">·</span>
                  <span>TTS 24kHz</span>
                  <span aria-hidden="true" className="text-zinc-600">·</span>
                  <span>Video Storyboard</span>
                </>
              ) : currentTool === 'wayback' ? (
                <>
                  <span>id_ extractor</span>
                  <span aria-hidden="true" className="text-zinc-600">·</span>
                  <span>Strip wrappers</span>
                  <span aria-hidden="true" className="text-zinc-600">·</span>
                  <span>Export .ZIP</span>
                </>
              ) : currentTool === 'rclone_r2' ? (
                <>
                  <span>S3-Compatible</span>
                  <span aria-hidden="true" className="text-zinc-600">·</span>
                  <span>R2 Cloudflare Backup</span>
                  <span aria-hidden="true" className="text-zinc-600">·</span>
                  <span>rclone.conf</span>
                </>
              ) : currentTool === 'cf_accounts' ? (
                <>
                  <span>Batch Registration</span>
                  <span aria-hidden="true" className="text-zinc-600">·</span>
                  <span>100+ Email Accounts</span>
                  <span aria-hidden="true" className="text-zinc-600">·</span>
                  <span>CSV Export</span>
                </>
              ) : currentTool === 'trend_analytics' ? (
                <>
                  <span>Viral Hashtags</span>
                  <span aria-hidden="true" className="text-zinc-600">·</span>
                  <span>Trending Sounds</span>
                  <span aria-hidden="true" className="text-zinc-600">·</span>
                  <span>Audience Peak Hours</span>
                </>
              ) : (
                <>
                  <span>Anti-Spam Filter</span>
                  <span aria-hidden="true" className="text-zinc-600">·</span>
                  <span>Auto-Reply Engine</span>
                  <span aria-hidden="true" className="text-zinc-600">·</span>
                  <span>Personal UserBot</span>
                </>
              )}
            </p>
          </div>
        </div>

        {/* Action controls */}
        <div className="flex items-center gap-3">
          {currentTool === 'all_tools' ? (
            <div className="hidden sm:flex items-center gap-2 text-xs text-zinc-400 bg-zinc-900/60 border border-zinc-800 px-3 py-1.5 rounded-md font-mono">
              <LayoutGrid className="w-3.5 h-3.5 text-amber-400" />
              <span>Dashboard Hub</span>
            </div>
          ) : currentTool === 'wayback' ? (
            <>
              <div className="hidden md:flex items-center gap-2 text-xs text-zinc-400 bg-zinc-900/60 border border-zinc-800 px-3 py-1.5 rounded-md">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Toolbar Stripping Active</span>
              </div>

              {onOpenConfig && (
                <button
                  type="button"
                  onClick={onOpenConfig}
                  className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:text-white bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 rounded-md transition-colors cursor-pointer"
                  title="Configure asset filters and crawl settings"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Settings</span>
                  {configSummary && (
                    <span className="hidden sm:inline text-zinc-500 font-mono text-[11px]">
                      ({configSummary})
                    </span>
                  )}
                </button>
              )}
            </>
          ) : currentTool === 'rclone_r2' ? (
            <div className="flex items-center gap-2 text-xs text-zinc-400 bg-zinc-900/60 border border-zinc-800 px-3 py-1.5 rounded-md font-mono">
              <Database className="w-3.5 h-3.5 text-purple-400" />
              <span>Cloudflare R2 Bucket Sync</span>
            </div>
          ) : currentTool === 'cf_accounts' ? (
            <div className="flex items-center gap-2 text-xs text-zinc-400 bg-zinc-900/60 border border-zinc-800 px-3 py-1.5 rounded-md font-mono">
              <UserPlus className="w-3.5 h-3.5 text-amber-400" />
              <span>Bulk Cloudflare Accounts</span>
            </div>
          ) : currentTool === 'trend_analytics' ? (
            <div className="flex items-center gap-2 text-xs text-zinc-400 bg-zinc-900/60 border border-zinc-800 px-3 py-1.5 rounded-md font-mono">
              <BarChart3 className="w-3.5 h-3.5 text-emerald-400" />
              <span>TikTok &amp; Meta Organic Growth</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-xs text-zinc-400 bg-zinc-900/60 border border-zinc-800 px-3 py-1.5 rounded-md font-mono">
              <Send className="w-3.5 h-3.5 text-sky-400" />
              <span>Telegram Anti-Spam</span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
