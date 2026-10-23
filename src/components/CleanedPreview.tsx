import React, { useState } from 'react';
import {
  Code,
  Eye,
  FolderTree,
  Copy,
  Check,
  FileCode,
  FileText,
  FileArchive,
  Image,
  Folder,
} from 'lucide-react';
import { CloneResult } from '../types';

interface CleanedPreviewProps {
  result: CloneResult | null;
  activeTab: 'preview' | 'code' | 'files';
  onTabChange: (tab: 'preview' | 'code' | 'files') => void;
}

export const CleanedPreview: React.FC<CleanedPreviewProps> = ({
  result,
  activeTab,
  onTabChange,
}) => {
  const [copiedCode, setCopiedCode] = useState(false);

  if (!result) return null;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(result.cleanedHtml);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  // Group files into a tree for the file explorer
  const foldersMap = new Map<string, { path: string; size: number }[]>();
  result.fileList.forEach((file) => {
    const parts = file.path.split('/');
    const folder = parts.length > 1 ? parts.slice(0, -1).join('/') : 'root';
    if (!foldersMap.has(folder)) {
      foldersMap.set(folder, []);
    }
    foldersMap.get(folder)!.push(file);
  });

  return (
    <div className="bg-zinc-950 border border-zinc-800/90 rounded-xl overflow-hidden shadow-sm flex flex-col h-[520px]">
      {/* Header Tabs */}
      <div className="bg-zinc-900/90 px-4 py-2 border-b border-zinc-800 flex items-center justify-between">
        <div className="flex items-center gap-1 bg-zinc-950 p-1 rounded-lg border border-zinc-800">
          <button
            type="button"
            onClick={() => onTabChange('preview')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition ${
              activeTab === 'preview'
                ? 'bg-zinc-800 text-zinc-100 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Sandboxed Preview</span>
          </button>

          <button
            type="button"
            onClick={() => onTabChange('code')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition ${
              activeTab === 'code'
                ? 'bg-zinc-800 text-zinc-100 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Code className="w-3.5 h-3.5" />
            <span>Cleaned HTML Code</span>
          </button>

          <button
            type="button"
            onClick={() => onTabChange('files')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition ${
              activeTab === 'files'
                ? 'bg-zinc-800 text-zinc-100 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <FolderTree className="w-3.5 h-3.5" />
            <span>ZIP File Explorer ({result.fileList.length})</span>
          </button>
        </div>

        {activeTab === 'code' && (
          <button
            type="button"
            onClick={handleCopyCode}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-750 text-zinc-300 hover:text-white border border-zinc-700 text-xs font-mono transition"
          >
            {copiedCode ? (
              <>
                <Check className="w-3 h-3 text-emerald-400" />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3 text-zinc-400" />
                <span>Copy HTML</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Tab Contents */}
      <div className="flex-1 overflow-hidden relative">
        {/* Sandboxed Live Preview */}
        {activeTab === 'preview' && (
          <div className="w-full h-full bg-white relative">
            <iframe
              title="Cleaned Site Preview"
              srcDoc={result.cleanedHtml}
              sandbox="allow-scripts allow-same-origin"
              className="w-full h-full border-none"
            />
          </div>
        )}

        {/* Cleaned HTML Code */}
        {activeTab === 'code' && (
          <div className="w-full h-full overflow-y-auto p-4 bg-black/80 font-mono text-xs text-zinc-300 leading-relaxed select-text">
            <pre className="whitespace-pre-wrap">{result.cleanedHtml}</pre>
          </div>
        )}

        {/* ZIP File Explorer */}
        {activeTab === 'files' && (
          <div className="w-full h-full overflow-y-auto p-4 font-mono text-xs space-y-4">
            <div className="flex items-center gap-2 text-zinc-400 pb-2 border-b border-zinc-800">
              <FileArchive className="w-4 h-4 text-emerald-400" />
              <span className="text-zinc-200 font-semibold">{result.zipFileName}</span>
              <span className="text-zinc-500">
                ({formatSize(result.zipSizeBytes)})
              </span>
            </div>

            <div className="space-y-3">
              {Array.from(foldersMap.entries()).map(([folder, files]) => (
                <div key={folder} className="space-y-1">
                  <div className="flex items-center gap-1.5 text-zinc-400 text-xs font-semibold">
                    <Folder className="w-3.5 h-3.5 text-amber-400" />
                    <span>{folder === 'root' ? '/' : `${folder}/`}</span>
                  </div>

                  <div className="pl-4 space-y-1 border-l border-zinc-800 ml-1.5">
                    {files.map((f) => {
                      const filename = f.path.split('/').pop() || f.path;
                      return (
                        <div
                          key={f.path}
                          className="flex items-center justify-between py-0.5 text-zinc-300 hover:text-white hover:bg-zinc-900/50 px-2 rounded"
                        >
                          <div className="flex items-center gap-2 truncate">
                            {filename.endsWith('.html') ? (
                              <FileCode className="w-3 h-3 text-sky-400 shrink-0" />
                            ) : filename.endsWith('.css') ? (
                              <FileCode className="w-3 h-3 text-indigo-400 shrink-0" />
                            ) : filename.endsWith('.js') ? (
                              <FileCode className="w-3 h-3 text-amber-400 shrink-0" />
                            ) : filename.match(/\.(png|jpe?g|gif|webp|svg|ico)$/i) ? (
                              <Image className="w-3 h-3 text-emerald-400 shrink-0" />
                            ) : (
                              <FileText className="w-3 h-3 text-zinc-500 shrink-0" />
                            )}
                            <span className="truncate">{filename}</span>
                          </div>
                          <span className="text-[11px] text-zinc-500 font-mono shrink-0 pl-2">
                            {formatSize(f.size)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
