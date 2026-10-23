import React, { useState, useEffect, useRef } from 'react';
import {
  Terminal,
  Copy,
  Check,
  Trash2,
  ArrowDownCircle,
  Search,
} from 'lucide-react';
import { LogEntry, LogLevel } from '../types';

interface TerminalLogsProps {
  logs: LogEntry[];
  onClearLogs: () => void;
  isCloning: boolean;
}

export const TerminalLogs: React.FC<TerminalLogsProps> = ({
  logs,
  onClearLogs,
  isCloning,
}) => {
  const [filterLevel, setFilterLevel] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [autoScroll, setAutoScroll] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll when new logs arrive
  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs, autoScroll]);

  const filteredLogs = logs.filter((log) => {
    if (filterLevel !== 'all' && log.level !== filterLevel) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        log.message.toLowerCase().includes(q) ||
        (log.details && log.details.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const handleCopyLogs = () => {
    const text = logs
      .map((l) => `[${l.timestamp}] [${l.level.toUpperCase()}] ${l.message}`)
      .join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getBadgeStyle = (level: LogLevel) => {
    switch (level) {
      case 'fetch':
        return 'text-sky-400 bg-sky-950/40 border-sky-800/60';
      case 'clean':
        return 'text-purple-400 bg-purple-950/40 border-purple-800/60';
      case 'asset':
        return 'text-amber-400 bg-amber-950/40 border-amber-800/60';
      case 'success':
        return 'text-emerald-400 bg-emerald-950/40 border-emerald-800/60';
      case 'warn':
        return 'text-orange-400 bg-orange-950/40 border-orange-800/60';
      case 'error':
        return 'text-rose-400 bg-rose-950/40 border-rose-800/60';
      default:
        return 'text-zinc-400 bg-zinc-800/40 border-zinc-700/60';
    }
  };

  return (
    <div className="bg-zinc-950 border border-zinc-800/90 rounded-xl overflow-hidden shadow-sm flex flex-col h-[380px]">
      {/* Terminal Header */}
      <div className="bg-zinc-900/90 px-4 py-2.5 border-b border-zinc-800 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2 text-zinc-300">
          <Terminal className="w-4 h-4 text-amber-400" />
          <span className="font-mono font-medium">Real-Time Extraction Console</span>
          <span className="text-zinc-500 font-mono text-[11px]">
            ({filteredLogs.length} events)
          </span>
          {isCloning && (
            <span className="inline-flex items-center gap-1.5 text-[11px] text-amber-400 bg-amber-950/60 border border-amber-800/50 px-2 py-0.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
              Live
            </span>
          )}
        </div>

        {/* Filter & Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Level Filter */}
          <select
            value={filterLevel}
            onChange={(e) => setFilterLevel(e.target.value)}
            className="bg-zinc-950 text-zinc-300 border border-zinc-800 rounded px-2 py-1 text-[11px] font-mono outline-none"
          >
            <option value="all">All Levels</option>
            <option value="fetch">FETCH</option>
            <option value="clean">CLEAN</option>
            <option value="asset">ASSET</option>
            <option value="success">SUCCESS</option>
            <option value="warn">WARN/ERROR</option>
          </select>

          {/* Quick Search */}
          <div className="relative hidden sm:block">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search logs..."
              className="bg-zinc-950 text-zinc-300 border border-zinc-800 rounded pl-6 pr-2 py-1 text-[11px] font-mono outline-none w-28 focus:w-40 transition-all placeholder:text-zinc-600"
            />
            <Search className="w-3 h-3 text-zinc-500 absolute left-2 top-2" />
          </div>

          {/* Auto Scroll Toggle */}
          <button
            type="button"
            onClick={() => setAutoScroll(!autoScroll)}
            className={`p-1 rounded border transition ${
              autoScroll
                ? 'bg-amber-950/40 border-amber-800 text-amber-400'
                : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-zinc-300'
            }`}
            title={autoScroll ? 'Auto-scroll enabled' : 'Auto-scroll disabled'}
          >
            <ArrowDownCircle className="w-3.5 h-3.5" />
          </button>

          {/* Copy Logs */}
          <button
            type="button"
            onClick={handleCopyLogs}
            disabled={logs.length === 0}
            className="p-1 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-zinc-200 transition disabled:opacity-40"
            title="Copy logs"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>

          {/* Clear Logs */}
          <button
            type="button"
            onClick={onClearLogs}
            disabled={logs.length === 0 || isCloning}
            className="p-1 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-zinc-200 transition disabled:opacity-40"
            title="Clear logs"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Terminal Body */}
      <div
        ref={scrollRef}
        className="flex-1 p-3 font-mono text-xs overflow-y-auto space-y-1.5 select-text bg-black/60"
      >
        {filteredLogs.length === 0 ? (
          <div className="h-full flex items-center justify-center text-zinc-600 text-xs">
            {logs.length === 0 ? 'No logs yet. Click "Clone & Package" to begin.' : 'No matching logs for filter.'}
          </div>
        ) : (
          filteredLogs.map((log) => (
            <div
              key={log.id}
              className="flex items-start gap-2 leading-relaxed hover:bg-zinc-900/40 px-1 py-0.5 rounded transition"
            >
              <span className="text-zinc-600 text-[11px] shrink-0 select-none">
                {log.timestamp}
              </span>
              <span
                className={`text-[10px] uppercase font-semibold px-1.5 py-0.2 rounded border shrink-0 ${getBadgeStyle(
                  log.level
                )}`}
              >
                {log.level}
              </span>
              <span className="text-zinc-300 break-all flex-1">
                {log.message}
                {log.details && (
                  <span className="block text-[11px] text-zinc-500 mt-0.5">{log.details}</span>
                )}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
