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
  Download,
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
  const [isDownloadingMedia, setIsDownloadingMedia] = useState(false);
  const [mediaDownloadFeedback, setMediaDownloadFeedback] = useState<string | null>(null);

  const primaryParsed = parsedUrls[0];
  const isValid = parsedUrls.length > 0 && parsedUrls.every((p) => p.isValid);
  const directAssetUrls = parsedUrls.filter((p) => p.isValid && p.isDirectAsset);
  const hasDirectAssets = directAssetUrls.length > 0;

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

  // Direct Media Download without ZIP
  const handleDownloadDirectMedia = async (specificTarget?: ParsedWaybackUrl) => {
    const targetsToDownload = specificTarget
      ? [specificTarget]
      : directAssetUrls.length > 0
      ? directAssetUrls
      : parsedUrls.filter((p) => p.isValid);

    if (targetsToDownload.length === 0) return;

    setIsDownloadingMedia(true);
    setMediaDownloadFeedback(null);

    let downloadedCount = 0;
    try {
      for (let i = 0; i < targetsToDownload.length; i++) {
        const item = targetsToDownload[i];
        const fileName = item.fileName || (item.isDirectAsset ? 'image.jpg' : `${item.domain}.html`);
        const fetchUrl = `/api/proxy?url=${encodeURIComponent(item.cleanRawUrl)}`;

        const response = await fetch(fetchUrl);
        if (!response.ok) throw new Error(`HTTP ${response.status} failed to download ${fileName}`);

        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(blobUrl), 15000);
        downloadedCount++;

        // small delay between multiple files
        if (i < targetsToDownload.length - 1) {
          await new Promise((r) => setTimeout(r, 600));
        }
      }

      setMediaDownloadFeedback(`✓ បាន Download រូបភាព/Media ${downloadedCount} file(s) ផ្ទាល់ដោយជោគជ័យ (មិនបាច់ពន្លា ZIP)!`);
      setTimeout(() => setMediaDownloadFeedback(null), 6000);
    } catch (err: any) {
      setLookupError(`Download failed: ${err?.message || 'Network error'}`);
    } finally {
      setIsDownloadingMedia(false);
    }
  };

  return (
    <section className="bg-zinc-900/70 border border-zinc-800 rounded-xl p-5 shadow-sm space-y-4">
      {/* Title bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <label
            htmlFor="wayback-urls-input"
            className="text-sm font-medium text-zinc-200 block"
          >
            Wayback Machine URL(s) / Image &amp; Media Downloader
          </label>
          <p className="text-xs text-zinc-400 mt-0.5">
            បញ្ចូល URL វេបសាយ ឬ URL រូបភាព/Media ផ្ទាល់ (<code className="text-amber-400 font-mono">.jpg, .png, .webp, .svg</code>) ពី Wayback Machine ដើម្បីទាញយក។
          </p>
        </div>

        {/* Quick Sample Presets */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px] text-zinc-500 font-mono">Samples:</span>
          <button
            type="button"
            onClick={() =>
              onInputChange(
                'https://web.archive.org/web/20230716171621im_/https://www.siamklongfilm.com/cdn/shop/t/2/assets/slide_1_1024x1024.jpg?v=50403352792453146611473406436'
              )
            }
            className="px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-amber-300 text-[11px] font-mono border border-zinc-700 transition cursor-pointer"
            title="សាកល្បងទាញយករូបថតកាមេរ៉ា (Siamklongfilm .jpg)"
          >
            📷 Sample Image (.jpg)
          </button>
          <button
            type="button"
            onClick={() =>
              onInputChange(
                'https://web.archive.org/web/20260315113250/https://www.dpscjhargram.com/'
              )
            }
            className="px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[11px] font-mono border border-zinc-700 transition cursor-pointer"
          >
            🌐 Sample Website (HTML)
          </button>
        </div>
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
          placeholder="https://web.archive.org/web/20230716171621im_/https://www.siamklongfilm.com/cdn/shop/t/2/assets/slide_1_1024x1024.jpg&#10;https://web.archive.org/web/20260315113250/https://www.dpscjhargram.com/"
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

      {/* Instant Media Direct Preview Card (If direct asset/image detected) */}
      {primaryParsed && primaryParsed.isDirectAsset && (
        <div className="bg-gradient-to-r from-emerald-950/40 via-zinc-950 to-zinc-950 border border-emerald-500/40 rounded-xl p-4 shadow-sm space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              {/* Image Thumbnail Preview */}
              <div className="w-16 h-16 rounded-lg bg-zinc-900 border border-zinc-800 overflow-hidden shrink-0 flex items-center justify-center relative">
                <img
                  src={`/api/proxy?url=${encodeURIComponent(primaryParsed.cleanRawUrl)}`}
                  alt={primaryParsed.fileName || 'Media Preview'}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
                <span className="text-[10px] text-zinc-500 absolute font-mono pointer-events-none">
                  Preview
                </span>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-mono text-[11px] font-semibold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    Direct {primaryParsed.assetType?.toUpperCase() || 'IMAGE'} File
                  </span>
                  <span className="text-zinc-400 text-xs font-mono">
                    {primaryParsed.formattedDate}
                  </span>
                </div>
                <h4 className="text-sm font-bold text-zinc-100 font-mono break-all">
                  {primaryParsed.fileName}
                </h4>
                <p className="text-xs text-zinc-400 truncate max-w-lg font-mono">
                  Origin: {primaryParsed.domain}
                </p>
              </div>
            </div>

            {/* Direct Download Actions */}
            <div className="flex items-center gap-2 flex-wrap self-start sm:self-center">
              <a
                href={`/api/proxy?url=${encodeURIComponent(primaryParsed.cleanRawUrl)}`}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-medium border border-zinc-800 transition flex items-center gap-1.5"
                title="Open image in new browser tab"
              >
                <ExternalLink className="w-3.5 h-3.5 text-zinc-400" />
                <span>Open Full</span>
              </a>

              <button
                type="button"
                onClick={() => handleDownloadDirectMedia(primaryParsed)}
                disabled={isDownloadingMedia}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 active:bg-emerald-600 text-zinc-950 font-bold text-xs shadow-md transition cursor-pointer disabled:opacity-60"
                title="ទាញយក File រូបភាពនេះផ្ទាល់ មិនបាច់ពន្លា ZIP"
              >
                <Download className="w-4 h-4" />
                <span>
                  {isDownloadingMedia
                    ? 'Downloading Media...'
                    : `⚡ Download Media (${primaryParsed.fileName?.split('.').pop()?.toUpperCase() || 'File'})`}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Media Download Feedback Toast */}
      {mediaDownloadFeedback && (
        <div className="bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs p-3 rounded-lg flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="font-medium">{mediaDownloadFeedback}</span>
        </div>
      )}

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
              Target Analysis &amp; Raw id_ Endpoint
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

      {/* Actions Bar with Both Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        <div className="text-xs text-zinc-400 flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
          <span>Bypasses CORS via backend proxy · Direct Media &amp; Offline Cloner</span>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Button 1: Dedicated Download Media Button (No ZIP) */}
          <button
            type="button"
            onClick={() => handleDownloadDirectMedia()}
            disabled={!isValid || isDownloadingMedia || isCloning}
            className={`flex items-center gap-2 px-5 py-2 rounded-lg font-bold text-xs sm:text-sm shadow transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
              hasDirectAssets
                ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-zinc-950 ring-2 ring-emerald-500/40'
                : 'bg-zinc-800 hover:bg-zinc-700 text-emerald-400 border border-zinc-700'
            }`}
            title="Download file រូបភាព ឬ Media ផ្ទាល់ចូលកុំព្យូទ័រ ដោយមិនបាច់បង្កើត ZIP file"
          >
            <Download className="w-4 h-4" />
            <span>
              {isDownloadingMedia
                ? 'Downloading Media...'
                : hasDirectAssets
                ? `⚡ Download Media Direct (${directAssetUrls.length})`
                : '⚡ Download Media Direct'}
            </span>
          </button>

          {/* Button 2: Clone Site & Package .ZIP */}
          {isCloning ? (
            <button
              type="button"
              onClick={onAbortCloning}
              className="flex items-center gap-2 px-5 py-2 rounded-lg bg-rose-600/90 hover:bg-rose-500 text-white font-medium text-xs sm:text-sm shadow transition cursor-pointer"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
              <span>Cancel / Stop</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onStartCloning}
              disabled={!isValid || isDownloadingMedia}
              className={`flex items-center gap-2 px-5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                hasDirectAssets
                  ? 'bg-zinc-850 hover:bg-zinc-800 text-zinc-300 border border-zinc-700'
                  : 'bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-zinc-950 shadow-md'
              }`}
              title="Clone វេបសាយទាំងមូល និងវេចខ្ចប់ជា .ZIP"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Clone &amp; Package .ZIP</span>
            </button>
          )}
        </div>
      </div>
    </section>
  );
};
