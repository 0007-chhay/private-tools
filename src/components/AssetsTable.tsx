import React, { useState } from 'react';
import {
  FileCode,
  Image,
  Type,
  FileText,
  Search,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ExternalLink,
  Layers,
} from 'lucide-react';
import { AssetItem, AssetType } from '../types';

interface AssetsTableProps {
  assets: AssetItem[];
}

export const AssetsTable: React.FC<AssetsTableProps> = ({ assets }) => {
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredAssets = assets.filter((asset) => {
    if (typeFilter !== 'all' && asset.type !== typeFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        asset.localPath.toLowerCase().includes(q) ||
        asset.originalUrl.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const getTypeIcon = (type: AssetType) => {
    switch (type) {
      case 'css':
        return <FileCode className="w-3.5 h-3.5 text-sky-400" />;
      case 'js':
        return <FileCode className="w-3.5 h-3.5 text-amber-400" />;
      case 'image':
        return <Image className="w-3.5 h-3.5 text-emerald-400" />;
      case 'font':
        return <Type className="w-3.5 h-3.5 text-purple-400" />;
      default:
        return <FileText className="w-3.5 h-3.5 text-zinc-400" />;
    }
  };

  const getStatusBadge = (status: string, error?: string) => {
    switch (status) {
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-800/50 px-2 py-0.5 rounded">
            <CheckCircle2 className="w-3 h-3" />
            Saved
          </span>
        );
      case 'downloading':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-mono text-amber-400 bg-amber-950/40 border border-amber-800/50 px-2 py-0.5 rounded">
            <Clock className="w-3 h-3 animate-spin" />
            Fetching
          </span>
        );
      case 'failed':
        return (
          <span
            className="inline-flex items-center gap-1 text-[11px] font-mono text-rose-400 bg-rose-950/40 border border-rose-800/50 px-2 py-0.5 rounded"
            title={error || 'Failed to download'}
          >
            <AlertTriangle className="w-3 h-3" />
            Failed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-mono text-zinc-500 bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded">
            Queued
          </span>
        );
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '-';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const typesCount = {
    all: assets.length,
    css: assets.filter((a) => a.type === 'css').length,
    js: assets.filter((a) => a.type === 'js').length,
    image: assets.filter((a) => a.type === 'image').length,
    font: assets.filter((a) => a.type === 'font').length,
  };

  return (
    <div className="bg-zinc-950 border border-zinc-800/90 rounded-xl overflow-hidden shadow-sm flex flex-col h-[380px]">
      {/* Table Toolbar */}
      <div className="bg-zinc-900/90 px-4 py-2.5 border-b border-zinc-800 flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Type Filter Buttons */}
        <div className="flex items-center gap-1 overflow-x-auto p-0.5 bg-zinc-950 rounded-lg border border-zinc-800">
          {(['all', 'css', 'js', 'image', 'font'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition ${
                typeFilter === t
                  ? 'bg-zinc-800 text-zinc-100 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {t.toUpperCase()} ({typesCount[t] || 0})
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search path or URL..."
            className="bg-zinc-950 text-zinc-300 border border-zinc-800 rounded pl-7 pr-3 py-1 text-xs font-mono outline-none w-48 placeholder:text-zinc-600 focus:border-amber-500/80"
          />
          <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-2 top-2" />
        </div>
      </div>

      {/* Table Body */}
      <div className="flex-1 overflow-y-auto">
        {filteredAssets.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-zinc-600 text-xs p-6 space-y-1">
            <Layers className="w-8 h-8 text-zinc-700" />
            <p>No assets discovered yet or none matching filters.</p>
          </div>
        ) : (
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-zinc-900/60 text-zinc-400 font-mono text-[11px] sticky top-0 border-b border-zinc-800/80 z-10">
              <tr>
                <th className="py-2 px-3">Type</th>
                <th className="py-2 px-3">Local Offline Path</th>
                <th className="py-2 px-3 hidden md:table-cell">Source URL</th>
                <th className="py-2 px-3">Status</th>
                <th className="py-2 px-3 text-right">Size</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-900 font-mono">
              {filteredAssets.map((asset) => (
                <tr key={asset.id} className="hover:bg-zinc-900/40 transition">
                  <td className="py-2 px-3 flex items-center gap-1.5 whitespace-nowrap">
                    {getTypeIcon(asset.type)}
                    <span className="uppercase text-[10px] text-zinc-400">
                      {asset.type}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-zinc-200 truncate max-w-xs" title={asset.localPath}>
                    {asset.localPath}
                  </td>
                  <td className="py-2 px-3 text-zinc-500 truncate max-w-sm hidden md:table-cell">
                    <a
                      href={asset.resolvedWaybackUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-amber-400 flex items-center gap-1 truncate"
                      title={asset.originalUrl}
                    >
                      <span className="truncate">{asset.originalUrl}</span>
                      <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                    </a>
                  </td>
                  <td className="py-2 px-3 whitespace-nowrap">
                    {getStatusBadge(asset.status, asset.error)}
                  </td>
                  <td className="py-2 px-3 text-right text-zinc-400 whitespace-nowrap">
                    {formatSize(asset.sizeBytes)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
