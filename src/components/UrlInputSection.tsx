import React, { useState } from 'react';
import {
  Play,
  Square,
  Globe,
  Clock,
  ExternalLink,
  Code2,
  Search,
  Sparkles,
  RotateCcw,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { ParsedWaybackUrl } from '../types';

interface UrlInputSectionProps {
  inputUrlText: string;
  onInputChange: (value: string) => void;
  parsedUrls: ParsedWaybackUrl[];
  isCloning: boolean;
  onStartCloning: () => void;
  onAbortCloning: () => void;
}

export const UrlInputSection: React.FC<UrlInputSectionProps> = ({
  inputUrlText,
  onInputChange,
  parsedUrls,
  isCloning,
  onStartCloning,
  onAbortCloning,
}) => {
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);

  const primaryParsed = parsedUrls[0];
  const isValid = parsedUrls.length > 0 && parsedUrls.every((p) => p.isValid);

  const handleLookupLatest = async () => {
    const trimmed = inputUrlText.trim();
    if (!trimmed) return;

    setLookupLoading(true);
    setLookupError(null);
    try {
      const res = await fetch(`/api/snapshot-lookup?url=${encodeURIComponent(trimmed)}`);
      if (!res.ok) throw new Error('Failed to query Wayback availability API');
      const data = await res.json();

      const closest = data?.archived_snapshots?.closest;
      if (closest && closest.url) {
        onInputChange(closest.url);
      } else {
        setLookupError('No Wayback Machine snapshot found for this domain.');
      }
    } catch (err: any) {
      setLookupError(err?.message || 'Lookup failed');
    } finally {
      setLookupLoading(false);
    }
  };

  return (
    <section className="bg-zinc-900/70 border border-zinc-800 rounded-xl p-5 shadow-sm space-y-4">
      {/* Title bar */}
      <div>
        <label
          htmlFor="wayback-urls-input"
          className="text-sm font-medium text-zinc-200 block"
        >
          Wayback Machine URL(s)
        </label>
        <p className="text-xs text-zinc-400 mt-0.5">
          Paste one or multiple archive.org URLs. Raw <code className="text-amber-400 font-mono">id_</code> mode will automatically be applied.
        </p>
      </div>

      {/* Input Textarea */}
      <div className="relative">
        <textarea
          id="wayback-urls-input"
          value={inputUrlText}
          onChange={(e) => {
            onInputChange(e.target.value);
            setLookupError(null);
          }}
          disabled={isCloning}
          rows={3}
          placeholder="https://web.archive.org/web/20260315113250/https://www.dpscjhargram.com/"
          className="w-full bg-zinc-950 border border-zinc-800 focus:border-amber-500/80 focus:ring-1 focus:ring-amber-500/80 rounded-lg p-3 text-xs sm:text-sm font-mono text-zinc-200 placeholder:text-zinc-600 outline-none transition resize-y leading-relaxed disabled:opacity-60"
        />

        {inputUrlText && !isCloning && (
          <button
            type="button"
            onClick={() => onInputChange('')}
            className="absolute top-2.5 right-2.5 p-1 rounded text-zinc-500 hover:text-zinc-300 bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 text-xs transition"
            title="Clear input"
          >
            Clear
          </button>
        )}
      </div>

      {/* Lookup error message */}
      {lookupError && (
        <div className="flex items-center gap-2 text-xs text-rose-400 bg-rose-950/30 border border-rose-900/50 p-2.5 rounded-lg">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{lookupError}</span>
        </div>
      )}

      {/* Live Parsed Metadata Inspector */}
      {primaryParsed && primaryParsed.isValid && (
        <div className="bg-zinc-950/90 border border-zinc-800/80 rounded-lg p-3 text-xs space-y-2">
          <div className="flex items-center justify-between pb-1.5 border-b border-zinc-800/60">
            <span className="font-medium text-zinc-300 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              Target Analysis & Raw id_ Endpoint
            </span>
            <span className="font-mono text-[11px] text-zinc-500">
              {parsedUrls.length > 1 ? `${parsedUrls.length} URLs queued` : '1 URL queued'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 text-zinc-400">
            <div className="flex items-start gap-2">
              <Globe className="w-3.5 h-3.5 text-amber-400 mt-0.5 shrink-0" />
              <div className="min-w-0">
                <span className="block text-[10px] uppercase font-mono text-zinc-500">
                  Target Domain
                </span>
                <span className="text-zinc-200 font-mono truncate block" title={primaryParsed.domain}>
                  {primaryParsed.domain}
                </span>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <Clock className="w-3.5 h-3.5 text-sky-400 mt-0.5 shrink-0" />
              <div className="min-w-0">
                <span className="block text-[10px] uppercase font-mono text-zinc-500">
                  Snapshot Timestamp
                </span>
                <span className="text-zinc-200 font-mono truncate block" title={primaryParsed.formattedDate}>
                  {primaryParsed.formattedDate}
                </span>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <Code2 className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
              <div className="min-w-0">
                <span className="block text-[10px] uppercase font-mono text-zinc-500">
                  Clean id_ Raw Target
                </span>
                <a
                  href={primaryParsed.cleanRawUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-amber-400 hover:text-amber-300 font-mono truncate block flex items-center gap-1"
                  title="Opens raw un-wrapped archive.org endpoint"
                >
                  <span className="truncate">/web/{primaryParsed.timestamp}id_/...</span>
                  <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Standard URL prompt helper */}
      {primaryParsed && !primaryParsed.isValid && primaryParsed.domain && (
        <div className="bg-amber-950/20 border border-amber-800/40 rounded-lg p-3 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-amber-200">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              Standard URL detected ({primaryParsed.domain}). Query Wayback Machine for the latest snapshot?
            </span>
          </div>
          <button
            type="button"
            onClick={handleLookupLatest}
            disabled={lookupLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-600/40 font-medium transition text-xs shrink-0 self-start sm:self-auto"
          >
            <Search className="w-3 h-3" />
            <span>{lookupLoading ? 'Finding snapshot...' : 'Find Snapshot'}</span>
          </button>
        </div>
      )}

      {/* Actions Bar */}
      <div className="flex items-center justify-between pt-1">
        <div className="text-xs text-zinc-400 flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
          <span>Bypasses CORS via backend proxy · Strips all toolbars & scripts</span>
        </div>

        <div className="flex items-center gap-2">
          {isCloning ? (
            <button
              type="button"
              onClick={onAbortCloning}
              className="flex items-center gap-2 px-5 py-2 rounded-lg bg-rose-600/90 hover:bg-rose-500 text-white font-medium text-xs sm:text-sm shadow transition"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
              <span>Cancel / Stop</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onStartCloning}
              disabled={!isValid}
              className="flex items-center gap-2 px-6 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-zinc-950 font-semibold text-xs sm:text-sm shadow-md transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Clone & Package .ZIP</span>
            </button>
          )}
        </div>
      </div>
    </section>
  );
};
