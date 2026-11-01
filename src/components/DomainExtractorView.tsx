import React, { useMemo, useState } from 'react';
import { Globe, Copy, Check, Download, Trash2, AlertCircle } from 'lucide-react';

// ---------- Domain extraction ----------

/** 'remove_all' strips the scheme, path and "www."; 'keep_www' strips the scheme and path only. */
export type DomainMode = 'remove_all' | 'keep_www';

const HOST_RE = /^[a-z0-9\u00a1-\uffff](?:[a-z0-9\u00a1-\uffff-]*[a-z0-9\u00a1-\uffff])?(?:\.[a-z0-9\u00a1-\uffff](?:[a-z0-9\u00a1-\uffff-]*[a-z0-9\u00a1-\uffff])?)+$/i;

/**
 * Turns one URL into its host name.
 *   https://patna.wingshospitals.com/page?x=1  ->  patna.wingshospitals.com
 *   https://www.lmchassam.org/                 ->  lmchassam.org (remove_all) / www.lmchassam.org (keep_www)
 * Subdomains other than "www" are always kept. Returns null if no valid host is found.
 */
export function extractDomain(raw: string, mode: DomainMode): string | null {
  let s = raw.trim().replace(/^["'<(\[]+|["'>)\],;]+$/g, '');
  s = s.replace(/^[a-z][a-z0-9+.-]*:\/\//i, ''); // scheme: https://, http://, ftp:// ...
  s = s.replace(/^\/\//, ''); // protocol-relative //example.com
  s = s.split(/[/?#\s\\]/)[0]; // drop path, query, hash
  s = s.replace(/^[^@]*@/, ''); // drop user:pass@
  s = s.replace(/:\d+$/, ''); // drop :port
  s = s.replace(/\.+$/, '').toLowerCase(); // trailing dot

  if (mode === 'remove_all' && s.startsWith('www.') && s.indexOf('.', 4) !== -1) {
    s = s.slice(4);
  }
  return HOST_RE.test(s) ? s : null;
}

function parseList(text: string, mode: DomainMode) {
  const tokens = text.split(/[\s,;]+/).filter(Boolean);
  const seen = new Set<string>();
  const domains: string[] = [];
  const invalid: string[] = [];
  let duplicates = 0;
  for (const t of tokens) {
    const d = extractDomain(t, mode);
    if (!d) {
      invalid.push(t);
    } else if (seen.has(d)) {
      duplicates++;
    } else {
      seen.add(d);
      domains.push(d);
    }
  }
  return { domains, invalid, duplicates };
}

const MODES: { id: DomainMode; label: string; example: string }[] = [
  { id: 'remove_all', label: 'Remove all', example: 'www.site.com → site.com' },
  { id: 'keep_www', label: 'ទុក www', example: 'www.site.com → www.site.com' },
];

export const DomainExtractorView: React.FC = () => {
  const [inputText, setInputText] = useState('');
  const [mode, setMode] = useState<DomainMode>('remove_all');
  const [copied, setCopied] = useState(false);

  const result = useMemo(() => parseList(inputText, mode), [inputText, mode]);
  const outputText = result.domains.join('\n');
  const hasOutput = result.domains.length > 0;

  const handleCopy = async () => {
    if (!hasOutput) return;
    try {
      await navigator.clipboard.writeText(outputText);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard blocked; ignore */
    }
  };

  const handleDownload = () => {
    if (!hasOutput) return;
    const blob = new Blob([outputText + '\n'], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
    a.href = url;
    a.download = `domains-${stamp}.txt`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex items-start gap-3">
        <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
          <Globe className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-white">Domain Extractor</h2>
          <p className="text-sm text-zinc-400">
            ដាក់បញ្ជី URL ចូល ហើយវានឹងដក https://, http:// និង / ចេញ ទុកតែ domain។ Subdomain ត្រូវបានរក្សាទុកជានិច្ច។
          </p>
        </div>
      </div>

      {/* Mode buttons */}
      <div className="flex flex-wrap items-center gap-2" role="group" aria-label="របៀបដក www">
        {MODES.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => setMode(m.id)}
            aria-pressed={mode === m.id}
            className={`flex flex-col items-start px-4 py-2 rounded-xl border text-left transition cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 ${
              mode === m.id
                ? 'bg-amber-500 border-amber-500 text-zinc-950'
                : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:border-zinc-700'
            }`}
          >
            <span className="text-sm font-bold">{m.label}</span>
            <span className={`text-[11px] font-mono ${mode === m.id ? 'text-zinc-800' : 'text-zinc-500'}`}>
              {m.example}
            </span>
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Input */}
        <section className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4 space-y-3 flex flex-col">
          <div className="flex items-center justify-between">
            <label htmlFor="domain-input" className="text-sm font-semibold text-zinc-200">
              បញ្ជី URL
            </label>
            <button
              type="button"
              onClick={() => setInputText('')}
              disabled={!inputText}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-300 bg-zinc-950 border border-zinc-800 hover:border-rose-900 disabled:opacity-40 rounded-lg px-3 py-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              លុប
            </button>
          </div>
          <textarea
            id="domain-input"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={'https://www.example.com/\nhttps://shop.example.org/page\nhttp://another-site.net'}
            rows={16}
            spellCheck={false}
            className="flex-1 w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-sm font-mono text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-amber-500/50 resize-y"
          />
          <p className="text-xs text-zinc-500">មួយបន្ទាត់មួយ URL ឬបំបែកដោយ comma / space។</p>
        </section>

        {/* Output */}
        <section className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4 space-y-3 flex flex-col">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-zinc-200">
              លទ្ធផល {hasOutput && <span className="text-zinc-500">({result.domains.length})</span>}
            </h3>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleCopy}
                disabled={!hasOutput}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-300 bg-zinc-950 border border-zinc-800 hover:border-zinc-700 disabled:opacity-40 rounded-lg px-3 py-1.5"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'បាន Copy' : 'Copy ទាំងអស់'}
              </button>
              <button
                type="button"
                onClick={handleDownload}
                disabled={!hasOutput}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-zinc-950 bg-amber-500 hover:bg-amber-400 disabled:bg-zinc-800 disabled:text-zinc-500 rounded-lg px-3 py-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                Download .txt
              </button>
            </div>
          </div>
          <textarea
            readOnly
            value={outputText}
            placeholder="Domain នឹងបង្ហាញនៅទីនេះ"
            rows={16}
            spellCheck={false}
            aria-label="លទ្ធផល domain"
            className="flex-1 w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-sm font-mono text-amber-200 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-amber-500/50 resize-y"
          />
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="px-2 py-1 rounded-md bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
              Domain: {result.domains.length}
            </span>
            {result.duplicates > 0 && (
              <span className="px-2 py-1 rounded-md bg-zinc-800 text-zinc-300 border border-zinc-700">
                ស្ទួន (បានរំលង): {result.duplicates}
              </span>
            )}
            {result.invalid.length > 0 && (
              <span
                className="px-2 py-1 rounded-md bg-rose-500/10 text-rose-300 border border-rose-500/20 inline-flex items-center gap-1"
                title={result.invalid.slice(0, 20).join('\n')}
              >
                <AlertCircle className="w-3 h-3" />
                មិនត្រឹមត្រូវ (បានរំលង): {result.invalid.length}
              </span>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};
