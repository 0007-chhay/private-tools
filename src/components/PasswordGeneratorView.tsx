import React, { useMemo, useState } from 'react';
import {
  KeyRound,
  Download,
  Copy,
  Check,
  RefreshCw,
  Eye,
  EyeOff,
  Trash2,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';

// ---------- Secure random helpers (Web Crypto, no Math.random) ----------

const SETS = {
  upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  lower: 'abcdefghijklmnopqrstuvwxyz',
  digits: '0123456789',
  symbols: '!@#$%^&*-_=+?',
};
const AMBIGUOUS = /[Il1O0o]/g;

/** Unbiased random integer in [0, max) using rejection sampling. */
function secureRandomInt(max: number): number {
  const limit = Math.floor(0x100000000 / max) * max;
  const buf = new Uint32Array(1);
  let n: number;
  do {
    crypto.getRandomValues(buf);
    n = buf[0];
  } while (n >= limit);
  return n % max;
}

function secureShuffle(chars: string[]): string[] {
  for (let i = chars.length - 1; i > 0; i--) {
    const j = secureRandomInt(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars;
}

interface PasswordOptions {
  length: number;
  upper: boolean;
  lower: boolean;
  digits: boolean;
  symbols: boolean;
  excludeAmbiguous: boolean;
}

function buildSets(opts: PasswordOptions): string[] {
  const keys = (['upper', 'lower', 'digits', 'symbols'] as const).filter((k) => opts[k]);
  return keys.map((k) => (opts.excludeAmbiguous ? SETS[k].replace(AMBIGUOUS, '') : SETS[k]));
}

/** Generates a password that contains at least one character from every selected set. */
function generatePassword(opts: PasswordOptions): string {
  const sets = buildSets(opts);
  const pool = sets.join('');
  const chars: string[] = sets.map((s) => s[secureRandomInt(s.length)]);
  while (chars.length < opts.length) {
    chars.push(pool[secureRandomInt(pool.length)]);
  }
  return secureShuffle(chars).join('');
}

// ---------- Email parsing ----------

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const MAX_EMAILS = 1000;

function parseEmails(text: string) {
  const tokens = text
    .split(/[\s,;]+/)
    .map((t) => t.trim())
    .filter(Boolean);
  const seen = new Set<string>();
  const valid: string[] = [];
  const invalid: string[] = [];
  let duplicates = 0;
  for (const t of tokens) {
    if (!EMAIL_RE.test(t)) {
      invalid.push(t);
      continue;
    }
    const key = t.toLowerCase();
    if (seen.has(key)) {
      duplicates++;
      continue;
    }
    seen.add(key);
    valid.push(t);
  }
  return { valid, invalid, duplicates };
}

// ---------- Output formats ----------

type OutputFormat = 'colon' | 'pipe' | 'comma' | 'tab';
const FORMATS: { id: OutputFormat; label: string; sep: string }[] = [
  { id: 'colon', label: 'email:password', sep: ':' },
  { id: 'pipe', label: 'email | password', sep: ' | ' },
  { id: 'comma', label: 'email,password', sep: ',' },
  { id: 'tab', label: 'email<Tab>password', sep: '\t' },
];

interface Row {
  email: string;
  password: string;
}

export const PasswordGeneratorView: React.FC = () => {
  const [emailsText, setEmailsText] = useState('');
  const [opts, setOpts] = useState<PasswordOptions>({
    length: 16,
    upper: true,
    lower: true,
    digits: true,
    symbols: true,
    excludeAmbiguous: true,
  });
  const [format, setFormat] = useState<OutputFormat>('colon');
  const [rows, setRows] = useState<Row[]>([]);
  const [showPasswords, setShowPasswords] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const parsed = useMemo(() => parseEmails(emailsText), [emailsText]);
  const noSetSelected = !opts.upper && !opts.lower && !opts.digits && !opts.symbols;
  const tooMany = parsed.valid.length > MAX_EMAILS;
  const canGenerate = parsed.valid.length > 0 && !noSetSelected && !tooMany;

  const sep = FORMATS.find((f) => f.id === format)!.sep;
  const outputText = useMemo(
    () => rows.map((r) => `${r.email}${sep}${r.password}`).join('\n'),
    [rows, sep]
  );

  const handleGenerate = () => {
    if (!canGenerate) return;
    setRows(parsed.valid.map((email) => ({ email, password: generatePassword(opts) })));
  };

  const regenerateOne = (index: number) => {
    setRows((prev) =>
      prev.map((r, i) => (i === index ? { ...r, password: generatePassword(opts) } : r))
    );
  };

  const copyText = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied((c) => (c === key ? null : c)), 1500);
    } catch {
      /* clipboard blocked; ignore */
    }
  };

  const handleDownload = () => {
    if (!rows.length) return;
    const blob = new Blob([outputText + '\n'], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
    a.href = url;
    a.download = `passwords-${stamp}.txt`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const handleClear = () => {
    setRows([]);
    setEmailsText('');
  };

  const toggle = (key: keyof Omit<PasswordOptions, 'length'>) =>
    setOpts((o) => ({ ...o, [key]: !o[key] }));

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex items-start gap-3">
        <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
          <KeyRound className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-white">Bulk Password Generator</h2>
          <p className="text-sm text-zinc-400">
            ដាក់ email ចូល រួចបង្កើត password ខ្លាំងៗសម្រាប់ email នីមួយៗ ហើយ download ជា file .txt
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* Left: input + options */}
        <section className="lg:col-span-2 space-y-4">
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4 space-y-3">
            <label htmlFor="emails" className="text-sm font-semibold text-zinc-200 block">
              បញ្ជី Email
            </label>
            <textarea
              id="emails"
              value={emailsText}
              onChange={(e) => setEmailsText(e.target.value)}
              placeholder={'user1@example.com\nuser2@example.com\nuser3@example.com'}
              rows={10}
              spellCheck={false}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-sm font-mono text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-amber-500/50 resize-y"
            />
            <p className="text-xs text-zinc-500">
              មួយបន្ទាត់មួយ email ឬបំបែកដោយ comma / space។ អតិបរមា {MAX_EMAILS} email។
            </p>
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="px-2 py-1 rounded-md bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                ត្រឹមត្រូវ: {parsed.valid.length}
              </span>
              {parsed.invalid.length > 0 && (
                <span
                  className="px-2 py-1 rounded-md bg-rose-500/10 text-rose-300 border border-rose-500/20"
                  title={parsed.invalid.slice(0, 20).join('\n')}
                >
                  មិនត្រឹមត្រូវ: {parsed.invalid.length}
                </span>
              )}
              {parsed.duplicates > 0 && (
                <span className="px-2 py-1 rounded-md bg-zinc-800 text-zinc-300 border border-zinc-700">
                  ស្ទួន (បានរំលង): {parsed.duplicates}
                </span>
              )}
            </div>
          </div>

          <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4 space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="pw-length" className="text-sm font-semibold text-zinc-200">
                  ប្រវែង Password
                </label>
                <span className="text-sm font-bold text-amber-400 tabular-nums">{opts.length}</span>
              </div>
              <input
                id="pw-length"
                type="range"
                min={8}
                max={64}
                value={opts.length}
                onChange={(e) => setOpts((o) => ({ ...o, length: Number(e.target.value) }))}
                className="w-full accent-amber-500"
              />
            </div>

            <fieldset className="grid grid-cols-2 gap-2">
              <legend className="sr-only">ប្រភេទតួអក្សរ</legend>
              {(
                [
                  ['upper', 'A–Z'],
                  ['lower', 'a–z'],
                  ['digits', '0–9'],
                  ['symbols', '!@#$%'],
                ] as const
              ).map(([key, label]) => (
                <label
                  key={key}
                  className="flex items-center gap-2 text-sm text-zinc-300 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 cursor-pointer hover:border-zinc-700"
                >
                  <input
                    type="checkbox"
                    checked={opts[key]}
                    onChange={() => toggle(key)}
                    className="accent-amber-500"
                  />
                  <span className="font-mono">{label}</span>
                </label>
              ))}
            </fieldset>

            <label className="flex items-center gap-2 text-sm text-zinc-300 cursor-pointer">
              <input
                type="checkbox"
                checked={opts.excludeAmbiguous}
                onChange={() => toggle('excludeAmbiguous')}
                className="accent-amber-500"
              />
              <span>
                ដកតួអក្សរដែលច្រឡំគ្នា (<span className="font-mono">I l 1 O 0 o</span>)
              </span>
            </label>

            <div>
              <label htmlFor="format" className="text-sm font-semibold text-zinc-200 block mb-2">
                ទម្រង់ក្នុង file .txt
              </label>
              <select
                id="format"
                value={format}
                onChange={(e) => setFormat(e.target.value as OutputFormat)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm font-mono text-zinc-200 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
              >
                {FORMATS.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.label}
                  </option>
                ))}
              </select>
            </div>

            {noSetSelected && (
              <p className="text-xs text-rose-300 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5" /> សូមជ្រើសរើសប្រភេទតួអក្សរយ៉ាងហោចណាស់មួយ។
              </p>
            )}
            {tooMany && (
              <p className="text-xs text-rose-300 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5" /> មាន email ច្រើនជាង {MAX_EMAILS}។ សូមបំបែកជាច្រើនលើក។
              </p>
            )}

            <button
              type="button"
              onClick={handleGenerate}
              disabled={!canGenerate}
              className="w-full flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 disabled:bg-zinc-800 disabled:text-zinc-500 disabled:cursor-not-allowed text-zinc-950 font-bold text-sm rounded-lg py-2.5 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
            >
              <KeyRound className="w-4 h-4" />
              {rows.length ? 'បង្កើត Password ម្តងទៀត' : 'បង្កើត Password'}
              {parsed.valid.length > 0 && ` (${parsed.valid.length})`}
            </button>
          </div>
        </section>

        {/* Right: results */}
        <section className="lg:col-span-3 bg-zinc-900/60 border border-zinc-800 rounded-xl flex flex-col min-h-[420px]">
          <div className="flex flex-wrap items-center justify-between gap-2 p-4 border-b border-zinc-800">
            <h3 className="text-sm font-semibold text-zinc-200">
              លទ្ធផល {rows.length > 0 && <span className="text-zinc-500">({rows.length})</span>}
            </h3>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setShowPasswords((s) => !s)}
                disabled={!rows.length}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-300 bg-zinc-950 border border-zinc-800 hover:border-zinc-700 disabled:opacity-40 rounded-lg px-3 py-1.5"
              >
                {showPasswords ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                {showPasswords ? 'លាក់' : 'បង្ហាញ'}
              </button>
              <button
                type="button"
                onClick={() => copyText(outputText, 'all')}
                disabled={!rows.length}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-300 bg-zinc-950 border border-zinc-800 hover:border-zinc-700 disabled:opacity-40 rounded-lg px-3 py-1.5"
              >
                {copied === 'all' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copied === 'all' ? 'បាន Copy' : 'Copy ទាំងអស់'}
              </button>
              <button
                type="button"
                onClick={handleDownload}
                disabled={!rows.length}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-zinc-950 bg-amber-500 hover:bg-amber-400 disabled:bg-zinc-800 disabled:text-zinc-500 rounded-lg px-3 py-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                Download .txt
              </button>
              <button
                type="button"
                onClick={handleClear}
                disabled={!rows.length && !emailsText}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-300 bg-zinc-950 border border-zinc-800 hover:border-rose-900 disabled:opacity-40 rounded-lg px-3 py-1.5"
                title="លុបទាំងអស់"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {rows.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-zinc-500">
              <KeyRound className="w-8 h-8 mb-3 text-zinc-700" />
              <p className="text-sm">ដាក់ email នៅខាងឆ្វេង រួចចុច “បង្កើត Password”។</p>
            </div>
          ) : (
            <div className="flex-1 overflow-auto max-h-[560px]">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-zinc-900 text-xs text-zinc-500">
                  <tr>
                    <th className="text-left font-medium px-4 py-2 w-10">#</th>
                    <th className="text-left font-medium px-2 py-2">Email</th>
                    <th className="text-left font-medium px-2 py-2">Password</th>
                    <th className="px-4 py-2 w-20" />
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => (
                    <tr key={r.email} className="border-t border-zinc-800/70 hover:bg-zinc-800/30">
                      <td className="px-4 py-2 text-zinc-600 tabular-nums">{i + 1}</td>
                      <td className="px-2 py-2 text-zinc-300 break-all">{r.email}</td>
                      <td className="px-2 py-2 font-mono text-amber-200 break-all">
                        {showPasswords ? r.password : '•'.repeat(Math.min(r.password.length, 16))}
                      </td>
                      <td className="px-4 py-2">
                        <div className="flex justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => copyText(r.password, `row-${i}`)}
                            className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800"
                            aria-label={`Copy password for ${r.email}`}
                          >
                            {copied === `row-${i}` ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => regenerateOne(i)}
                            className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800"
                            aria-label={`Regenerate password for ${r.email}`}
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="p-4 border-t border-zinc-800 text-xs text-zinc-500 flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
            <p>
              Password ត្រូវបានបង្កើតនៅក្នុង browser ដោយប្រើ <span className="font-mono">crypto.getRandomValues</span>{' '}
              ហើយមិនត្រូវបានផ្ញើទៅ server ឡើយ។ File .txt គឺជាអត្ថបទធម្មតា ដូច្នេះសូមរក្សាទុកវាឱ្យមានសុវត្ថិភាព
              ឬនាំចូល password manager រួចលុបវាចោល។
            </p>
          </div>
        </section>
      </div>
    </div>
  );
};
