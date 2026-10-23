import React, { useState } from 'react';
import { X, Copy, Check, Terminal, Download, FileText, ExternalLink } from 'lucide-react';
import { R2Credentials } from '../types/r2';

interface RcloneConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  credentials: R2Credentials;
}

export const RcloneConfigModal: React.FC<RcloneConfigModalProps> = ({
  isOpen,
  onClose,
  credentials,
}) => {
  const [copiedConf, setCopiedConf] = useState(false);
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);

  if (!isOpen) return null;

  const confContent = `[cloudflare-r2]
type = s3
provider = Cloudflare
access_key_id = ${credentials.accessKeyId || '<YOUR_ACCESS_KEY_ID>'}
secret_access_key = ${credentials.secretAccessKey || '<YOUR_SECRET_ACCESS_KEY>'}
endpoint = ${credentials.endpoint || 'https://<ACCOUNT_ID>.r2.cloudflarestorage.com'}
acl = private`;

  const syncCommand = `rclone sync cloudflare-r2:${credentials.bucket || '<bucket_name>'} ./r2-backup --progress`;
  const copyCommand = `rclone copy cloudflare-r2:${credentials.bucket || '<bucket_name>'} ./r2-backup --progress`;
  const listCommand = `rclone ls cloudflare-r2:${credentials.bucket || '<bucket_name>'}`;

  const handleCopyConf = () => {
    navigator.clipboard.writeText(confContent);
    setCopiedConf(true);
    setTimeout(() => setCopiedConf(false), 2000);
  };

  const handleCopyCmd = (cmd: string, id: string) => {
    navigator.clipboard.writeText(cmd);
    setCopiedCmd(id);
    setTimeout(() => setCopiedCmd(null), 2000);
  };

  const handleDownloadConf = () => {
    const blob = new Blob([confContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'rclone.conf';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Terminal className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-zinc-100">
                Rclone CLI Configuration Generator
              </h3>
              <p className="text-xs text-zinc-400">
                Ready-to-use configuration for automated backups via Rclone CLI
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-5 overflow-y-auto font-sans text-xs">
          {/* rclone.conf section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-zinc-300 font-semibold flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-amber-400" />
                rclone.conf (Save to ~/.config/rclone/rclone.conf)
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDownloadConf}
                  className="flex items-center gap-1 px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-750 text-zinc-300 hover:text-white border border-zinc-700 text-[11px] font-mono transition"
                >
                  <Download className="w-3 h-3 text-zinc-400" />
                  <span>Download .conf</span>
                </button>
                <button
                  type="button"
                  onClick={handleCopyConf}
                  className="flex items-center gap-1 px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-750 text-zinc-300 hover:text-white border border-zinc-700 text-[11px] font-mono transition"
                >
                  {copiedConf ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3 text-zinc-400" />
                      <span>Copy Config</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="bg-black/80 border border-zinc-800 rounded-lg p-3 font-mono text-[11px] text-zinc-300 select-all overflow-x-auto">
              <pre>{confContent}</pre>
            </div>
          </div>

          {/* Useful CLI Commands */}
          <div className="space-y-2.5">
            <span className="font-mono text-zinc-300 font-semibold block">
              Quick Rclone Terminal Commands
            </span>

            {[
              {
                id: 'sync',
                label: 'Sync Entire R2 Bucket to Local Directory (Exact Mirror):',
                cmd: syncCommand,
              },
              {
                id: 'copy',
                label: 'Download / Copy All Files from R2 to Local Directory:',
                cmd: copyCommand,
              },
              {
                id: 'list',
                label: 'List All Files in R2 Bucket:',
                cmd: listCommand,
              },
            ].map((item) => (
              <div
                key={item.id}
                className="bg-zinc-950/80 border border-zinc-800/80 rounded-lg p-3 space-y-1.5"
              >
                <div className="flex items-center justify-between text-zinc-400 text-[11px]">
                  <span>{item.label}</span>
                  <button
                    type="button"
                    onClick={() => handleCopyCmd(item.cmd, item.id)}
                    className="hover:text-white text-zinc-400 flex items-center gap-1 font-mono"
                  >
                    {copiedCmd === item.id ? (
                      <Check className="w-3 h-3 text-emerald-400" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                    <span>{copiedCmd === item.id ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <div className="bg-black/60 p-2 rounded border border-zinc-900 font-mono text-amber-300 select-all overflow-x-auto text-[11px]">
                  <code>{item.cmd}</code>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-zinc-800 bg-zinc-950 flex items-center justify-between">
          <a
            href="https://rclone.org/s3/#cloudflare-r2"
            target="_blank"
            rel="noopener noreferrer"
            className="text-zinc-500 hover:text-zinc-300 flex items-center gap-1 text-xs"
          >
            <span>Rclone Cloudflare R2 Documentation</span>
            <ExternalLink className="w-3 h-3" />
          </a>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-100 font-medium text-xs transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
