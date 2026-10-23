import React from 'react';
import { Download, FileArchive, CheckCircle2, Eye, FolderTree, Sparkles } from 'lucide-react';
import { CloneResult } from '../types';
import { triggerFileDownload } from '../utils/zipPackager';

interface DownloadCardProps {
  result: CloneResult;
  onOpenPreview: () => void;
  onOpenFiles: () => void;
}

export const DownloadCard: React.FC<DownloadCardProps> = ({
  result,
  onOpenPreview,
  onOpenFiles,
}) => {
  const handleDownload = () => {
    triggerFileDownload(result.zipBlob, result.zipFileName);
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="bg-gradient-to-r from-emerald-950/40 via-zinc-900 to-zinc-900 border border-emerald-800/50 rounded-xl p-5 shadow-lg space-y-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left Info */}
        <div className="flex items-start gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
            <FileArchive className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase font-mono tracking-wider text-emerald-400 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Offline Site Package Ready
              </span>
            </div>
            <h3 className="text-lg font-semibold text-zinc-100 font-mono tracking-tight mt-0.5">
              {result.zipFileName}
            </h3>
            <div className="flex items-center gap-2 text-xs text-zinc-400 mt-1 font-mono">
              <span>{formatSize(result.zipSizeBytes)}</span>
              <span aria-hidden="true" className="text-zinc-600">·</span>
              <span>{result.fileList.length} files bundled</span>
              <span aria-hidden="true" className="text-zinc-600">·</span>
              <span>{result.successfulAssets} assets offline</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={onOpenPreview}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-lg bg-zinc-800 hover:bg-zinc-750 text-zinc-200 hover:text-white border border-zinc-700 text-xs font-medium transition cursor-pointer"
          >
            <Eye className="w-4 h-4 text-zinc-400" />
            <span>Preview Site</span>
          </button>

          <button
            type="button"
            onClick={onOpenFiles}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-lg bg-zinc-800 hover:bg-zinc-750 text-zinc-200 hover:text-white border border-zinc-700 text-xs font-medium transition cursor-pointer"
          >
            <FolderTree className="w-4 h-4 text-zinc-400" />
            <span>Explore Files</span>
          </button>

          <button
            type="button"
            onClick={handleDownload}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-zinc-950 font-semibold text-xs sm:text-sm shadow-md transition cursor-pointer"
          >
            <Download className="w-4 h-4 fill-current" />
            <span>Download .ZIP</span>
          </button>
        </div>
      </div>

      <div className="text-xs text-zinc-400 bg-zinc-950/70 border border-zinc-800/80 rounded-lg p-3 flex items-center justify-between">
        <span className="flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
          <span>Extracted without Wayback wrapper, toolbar, or wombat telemetry scripts.</span>
        </span>
        <span className="text-zinc-500 text-[11px] font-mono hidden sm:inline">
          Self-contained &amp; works offline
        </span>
      </div>
    </div>
  );
};
