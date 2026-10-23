import React from 'react';
import { X, SlidersHorizontal, Check, RefreshCw } from 'lucide-react';
import { CloneConfig } from '../types';

interface ConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: CloneConfig;
  onChangeConfig: (newConfig: CloneConfig) => void;
  onResetDefaults: () => void;
}

export const ConfigModal: React.FC<ConfigModalProps> = ({
  isOpen,
  onClose,
  config,
  onChangeConfig,
  onResetDefaults,
}) => {
  if (!isOpen) return null;

  const toggle = (key: keyof CloneConfig) => {
    onChangeConfig({
      ...config,
      [key]: !config[key],
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-semibold text-zinc-100">
              Cloning &amp; Extraction Settings
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-5 text-xs text-zinc-300 max-h-[70vh] overflow-y-auto">
          {/* Asset Inclusions */}
          <div className="space-y-3">
            <span className="text-[11px] font-mono uppercase text-zinc-500 font-semibold block">
              Asset Filters
            </span>

            <div className="grid grid-cols-2 gap-2.5">
              {[
                { key: 'includeStyles' as const, label: 'CSS Stylesheets' },
                { key: 'includeScripts' as const, label: 'JavaScript Files' },
                { key: 'includeImages' as const, label: 'Images & Icons' },
                { key: 'includeFonts' as const, label: 'Web Fonts (.woff2)' },
              ].map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => toggle(item.key)}
                  className={`flex items-center justify-between p-2.5 rounded-lg border text-left transition ${
                    config[item.key]
                      ? 'bg-amber-950/20 border-amber-800/60 text-amber-200'
                      : 'bg-zinc-950/60 border-zinc-800 text-zinc-500'
                  }`}
                >
                  <span className="font-medium">{item.label}</span>
                  <div
                    className={`w-4 h-4 rounded border flex items-center justify-center ${
                      config[item.key]
                        ? 'bg-amber-500 border-amber-500 text-zinc-950'
                        : 'border-zinc-700 bg-zinc-900'
                    }`}
                  >
                    {config[item.key] && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Cleaning & Transformation Options */}
          <div className="space-y-3">
            <span className="text-[11px] font-mono uppercase text-zinc-500 font-semibold block">
              Cleaning &amp; Offline Adjustments
            </span>

            <div className="space-y-2">
              <label className="flex items-start gap-3 p-2.5 rounded-lg border border-zinc-800 bg-zinc-950/60 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.cleanToolbarComments}
                  onChange={() => toggle('cleanToolbarComments')}
                  className="mt-0.5 rounded text-amber-500 focus:ring-0 bg-zinc-900 border-zinc-700"
                />
                <div>
                  <span className="text-zinc-200 font-medium block">
                    Strip Archive Toolbars, Wombat &amp; Analytics
                  </span>
                  <span className="text-zinc-500 text-[11px]">
                    Removes archive comments, injected wombat.js, ruffle, and banner stylesheets.
                  </span>
                </div>
              </label>

              <label className="flex items-start gap-3 p-2.5 rounded-lg border border-zinc-800 bg-zinc-950/60 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.rewriteInternalLinks}
                  onChange={() => toggle('rewriteInternalLinks')}
                  className="mt-0.5 rounded text-amber-500 focus:ring-0 bg-zinc-900 border-zinc-700"
                />
                <div>
                  <span className="text-zinc-200 font-medium block">
                    Make Internal Links Offline-Friendly
                  </span>
                  <span className="text-zinc-500 text-[11px]">
                    Prevents broken navigation when double clicking index.html offline.
                  </span>
                </div>
              </label>
            </div>
          </div>

          {/* Limits and Concurrency */}
          <div className="space-y-4 pt-2 border-t border-zinc-800">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-zinc-300 font-medium">Max Discovered Assets Limit</span>
                <span className="font-mono text-amber-400 font-semibold">{config.maxAssets} assets</span>
              </div>
              <input
                type="range"
                min={10}
                max={300}
                step={10}
                value={config.maxAssets}
                onChange={(e) =>
                  onChangeConfig({ ...config, maxAssets: Number(e.target.value) })
                }
                className="w-full accent-amber-500 bg-zinc-800 h-1.5 rounded-lg appearance-none cursor-pointer"
              />
              <span className="text-[11px] text-zinc-500 mt-1 block">
                Prevents accidental recursive mega-crawls on bloated legacy sites.
              </span>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-zinc-300 font-medium">Download Concurrency Pool</span>
                <span className="font-mono text-amber-400 font-semibold">{config.concurrency} threads</span>
              </div>
              <input
                type="range"
                min={1}
                max={8}
                step={1}
                value={config.concurrency}
                onChange={(e) =>
                  onChangeConfig({ ...config, concurrency: Number(e.target.value) })
                }
                className="w-full accent-amber-500 bg-zinc-800 h-1.5 rounded-lg appearance-none cursor-pointer"
              />
              <span className="text-[11px] text-zinc-500 mt-1 block">
                Simultaneous asset fetch requests sent via backend proxy.
              </span>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-zinc-800 bg-zinc-950 flex items-center justify-between">
          <button
            type="button"
            onClick={onResetDefaults}
            className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-200 transition"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Reset to Defaults</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-100 font-medium text-xs transition"
          >
            Apply &amp; Close
          </button>
        </div>
      </div>
    </div>
  );
};
