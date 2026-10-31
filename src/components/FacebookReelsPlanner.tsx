import React, { useEffect, useMemo, useState } from 'react';
import {
  Sparkles,
  Loader2,
  Copy,
  Check,
  Hash,
  Clock,
  Type as TypeIcon,
  MessageCircle,
  AlertCircle,
  Info,
  MonitorPlay,
} from 'lucide-react';

// ---------- Types ----------

interface ReelsPlan {
  model: string;
  captions: { style: string; text: string }[];
  onScreenHooks: string[];
  hashtags: { topic: string[]; location: string[]; brand: string[] };
  commentQuestion: string;
}

type Lang = 'km' | 'en' | 'mixed';

// ---------- Small localStorage helpers (non-secret preferences only) ----------

const PREFS_KEY = 'reels_planner_prefs';
const DEFAULT_PEAK_HOURS = [12, 19, 20, 21];

interface Prefs {
  location: string;
  pageTag: string;
  language: Lang;
  peakHours: number[];
  peakHoursFromInsights: boolean;
}

function loadPrefs(): Prefs {
  const fallback: Prefs = {
    location: '',
    pageTag: '',
    language: 'km',
    peakHours: DEFAULT_PEAK_HOURS,
    peakHoursFromInsights: false,
  };
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (!raw) return fallback;
    const p = JSON.parse(raw);
    const hours = Array.isArray(p.peakHours)
      ? p.peakHours.filter((h: unknown) => Number.isInteger(h) && (h as number) >= 0 && (h as number) <= 23)
      : [];
    return {
      location: String(p.location || ''),
      pageTag: String(p.pageTag || ''),
      language: ['km', 'en', 'mixed'].includes(p.language) ? p.language : 'km',
      peakHours: hours.length ? hours : DEFAULT_PEAK_HOURS,
      peakHoursFromInsights: Boolean(p.peakHoursFromInsights) && hours.length > 0,
    };
  } catch {
    return fallback;
  }
}

function savePrefs(p: Prefs) {
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify(p));
  } catch {
    // ignore
  }
}

// ---------- Posting time helpers ----------

const KH_DAYS = ['អាទិត្យ', 'ច័ន្ទ', 'អង្គារ', 'ពុធ', 'ព្រហស្បតិ៍', 'សុក្រ', 'សៅរ៍'];

function pad(n: number) {
  return n.toString().padStart(2, '0');
}

/** Next posting times: 30 minutes before each peak hour, starting from now. */
function nextPostingTimes(peakHours: number[], now: Date, count = 3) {
  const sorted = [...new Set(peakHours)].sort((a, b) => a - b);
  const out: { post: Date; peak: Date }[] = [];
  for (let dayOffset = 0; dayOffset < 3 && out.length < count; dayOffset++) {
    for (const h of sorted) {
      const peak = new Date(now);
      peak.setDate(now.getDate() + dayOffset);
      peak.setHours(h, 0, 0, 0);
      const post = new Date(peak.getTime() - 30 * 60 * 1000);
      if (post.getTime() > now.getTime()) out.push({ post, peak });
      if (out.length >= count) break;
    }
  }
  return out;
}

function dayLabel(d: Date, now: Date) {
  const startOf = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const diff = Math.round((startOf(d) - startOf(now)) / 86400000);
  if (diff === 0) return 'ថ្ងៃនេះ';
  if (diff === 1) return 'ថ្ងៃស្អែក';
  return `ថ្ងៃ${KH_DAYS[d.getDay()]}`;
}

// ---------- Component ----------

export const FacebookReelsPlanner: React.FC = () => {
  const initial = useMemo(loadPrefs, []);
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState(initial.location);
  const [pageTag, setPageTag] = useState(initial.pageTag);
  const [language, setLanguage] = useState<Lang>(initial.language);
  const [peakHours, setPeakHours] = useState<number[]>(initial.peakHours);
  const [peakFromInsights, setPeakFromInsights] = useState(initial.peakHoursFromInsights);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [plan, setPlan] = useState<ReelsPlan | null>(null);

  const [selectedCaption, setSelectedCaption] = useState(0);
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
  const [includeQuestion, setIncludeQuestion] = useState(true);
  const [finalText, setFinalText] = useState('');
  const [copied, setCopied] = useState<string | null>(null);
  const [now, setNow] = useState(() => new Date());

  // Keep the clock fresh for the posting-time card
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    savePrefs({ location, pageTag, language, peakHours, peakHoursFromInsights: peakFromInsights });
  }, [location, pageTag, language, peakHours, peakFromInsights]);

  const allTags = plan ? [...plan.hashtags.topic, ...plan.hashtags.location, ...plan.hashtags.brand] : [];

  // Rebuild the final caption whenever the user's choices change
  useEffect(() => {
    if (!plan) return;
    const caption = plan.captions[selectedCaption]?.text || '';
    const question =
      includeQuestion && plan.commentQuestion && !caption.includes(plan.commentQuestion)
        ? `\n\n${plan.commentQuestion}`
        : '';
    const tags = allTags.filter((t) => selectedTags.has(t)).join(' ');
    setFinalText(`${caption}${question}${tags ? `\n\n${tags}` : ''}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plan, selectedCaption, selectedTags, includeQuestion]);

  const handleGenerate = async () => {
    if (description.trim().length < 5 || loading) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/ai/reels-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description, location, pageTag, language }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        throw new Error(data.error || `HTTP ${res.status}`);
      }
      const p: ReelsPlan = data;
      setPlan(p);
      setSelectedCaption(0);
      setSelectedTags(new Set([...p.hashtags.topic, ...p.hashtags.location, ...p.hashtags.brand]));
      setIncludeQuestion(true);
    } catch (err: any) {
      setError(err?.message || String(err));
    } finally {
      setLoading(false);
    }
  };

  const copy = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied((c) => (c === key ? null : c)), 1500);
    } catch {
      // clipboard blocked
    }
  };

  const toggleTag = (tag: string) =>
    setSelectedTags((prev) => {
      const next = new Set(prev);
      if (next.has(tag)) next.delete(tag);
      else next.add(tag);
      return next;
    });

  const toggleHour = (h: number) => {
    setPeakHours((prev) => {
      const next = prev.includes(h) ? prev.filter((x) => x !== h) : [...prev, h].sort((a, b) => a - b);
      return next.length ? next : prev; // keep at least one hour
    });
    setPeakFromInsights(true);
  };

  const postingTimes = nextPostingTimes(peakHours, now);
  const selectedCount = allTags.filter((t) => selectedTags.has(t)).length;

  const CopyBtn = ({ text, id, label }: { text: string; id: string; label?: string }) => (
    <button
      type="button"
      onClick={() => copy(text, id)}
      className="inline-flex items-center gap-1 text-[11px] font-semibold text-zinc-400 hover:text-zinc-100 px-2 py-1 rounded-md hover:bg-zinc-800 transition cursor-pointer"
      aria-label={label || 'Copy'}
    >
      {copied === id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
      {label && <span>{copied === id ? 'បាន Copy' : label}</span>}
    </button>
  );

  return (
    <div className="space-y-5">
      {/* Intro */}
      <section className="bg-gradient-to-r from-blue-950/40 via-zinc-900 to-zinc-900 border border-blue-600/30 rounded-xl p-5 space-y-1">
        <span className="text-xs font-mono uppercase text-blue-300 font-semibold flex items-center gap-1.5">
          <MonitorPlay className="w-3.5 h-3.5" />
          Facebook Reels · មុនពេល Post
        </span>
        <h3 className="text-base font-bold text-zinc-100">ចំណងជើង · Hashtag · ម៉ោង Post</h3>
        <p className="text-xs text-zinc-400">
          ពិពណ៌នាពីអ្វីដែល video បង្ហាញ នោះ AI នឹងសរសេរចំណងជើង ៥ ជម្រើស, អក្សរសម្រាប់វិនាទីដំបូង និង hashtag
          ដែលពាក់ព័ន្ធ។ ម៉ោង post គណនាពីម៉ោងដែលបងកំណត់ខាងក្រោម។
        </p>
      </section>

      <div className="grid lg:grid-cols-5 gap-5">
        {/* LEFT: inputs + posting time */}
        <div className="lg:col-span-2 space-y-5">
          <section className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 space-y-3 text-xs">
            <div className="space-y-1">
              <label htmlFor="reel-desc" className="text-zinc-200 font-semibold block">
                Video និយាយពីអ្វី? <span className="text-rose-400">*</span>
              </label>
              <textarea
                id="reel-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={5}
                maxLength={1500}
                placeholder="ឧ. ញ៉ាំបាយសាច់ជ្រូកនៅផ្សារទួលទំពូង តម្លៃ ៦០០០ រៀល ហាងបើកតាំងពីម៉ោង ៦ ព្រឹក មនុស្សតម្រង់ជួរច្រើន"
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-sm text-zinc-100 placeholder:text-zinc-600 outline-none focus:border-blue-500 resize-y"
              />
              <p className="text-[11px] text-zinc-500">
                កាន់តែលម្អិត (តម្លៃ, ទីកន្លែង, អ្វីពិសេស) ចំណងជើងកាន់តែល្អ។ AI ប្រើតែព័ត៌មានដែលបងសរសេរប៉ុណ្ណោះ។
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label htmlFor="reel-loc" className="text-zinc-300 font-medium block">
                  ទីតាំង
                </label>
                <input
                  id="reel-loc"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  maxLength={100}
                  placeholder="ភ្នំពេញ"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 placeholder:text-zinc-600 outline-none focus:border-blue-500"
                />
              </div>
              <div className="space-y-1">
                <label htmlFor="reel-tag" className="text-zinc-300 font-medium block">
                  Hashtag ម៉ាករបស់ Page
                </label>
                <input
                  id="reel-tag"
                  value={pageTag}
                  onChange={(e) => setPageTag(e.target.value)}
                  maxLength={40}
                  placeholder="#KrisnaEats"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 placeholder:text-zinc-600 outline-none focus:border-blue-500 font-mono"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label htmlFor="reel-lang" className="text-zinc-300 font-medium block">
                ភាសា
              </label>
              <select
                id="reel-lang"
                value={language}
                onChange={(e) => setLanguage(e.target.value as Lang)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 outline-none focus:border-blue-500"
              >
                <option value="km">ខ្មែរ</option>
                <option value="mixed">ខ្មែរ + English</option>
                <option value="en">English</option>
              </select>
            </div>

            <button
              type="button"
              onClick={handleGenerate}
              disabled={loading || description.trim().length < 5}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-800 disabled:text-zinc-500 disabled:cursor-not-allowed text-white font-bold text-sm rounded-lg py-2.5 transition cursor-pointer"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              {loading ? 'កំពុងសរសេរ...' : plan ? 'បង្កើតម្តងទៀត' : 'បង្កើតចំណងជើង & Hashtag'}
            </button>

            {error && (
              <div className="flex items-start gap-2 text-rose-300 bg-rose-950/30 border border-rose-900/50 rounded-lg p-3">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <p className="break-words">{error}</p>
              </div>
            )}
          </section>

          {/* Posting time */}
          <section className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 space-y-3 text-xs">
            <h4 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-400" />
              ម៉ោង Post បន្ទាប់
            </h4>

            <ul className="space-y-1.5">
              {postingTimes.map(({ post, peak }) => (
                <li
                  key={post.toISOString()}
                  className="flex items-center justify-between bg-emerald-950/20 border border-emerald-900/40 rounded-lg px-3 py-2"
                >
                  <span className="text-zinc-300">{dayLabel(post, now)}</span>
                  <span className="font-mono font-bold text-emerald-300 text-sm">
                    {pad(post.getHours())}:{pad(post.getMinutes())}
                  </span>
                  <span className="text-[11px] text-zinc-500">
                    មុនម៉ោងកំពូល {pad(peak.getHours())}:00
                  </span>
                </li>
              ))}
            </ul>

            <div className="space-y-1.5">
              <p className="text-zinc-300 font-medium">ម៉ោងដែលអ្នកតាមដាន online ច្រើនជាងគេ</p>
              <div className="grid grid-cols-8 gap-1" role="group" aria-label="Peak hours">
                {Array.from({ length: 24 }, (_, h) => (
                  <button
                    key={h}
                    type="button"
                    onClick={() => toggleHour(h)}
                    aria-pressed={peakHours.includes(h)}
                    className={`py-1 rounded font-mono text-[11px] transition cursor-pointer ${
                      peakHours.includes(h)
                        ? 'bg-emerald-500 text-zinc-950 font-bold'
                        : 'bg-zinc-900 text-zinc-500 hover:text-zinc-200 border border-zinc-800'
                    }`}
                  >
                    {pad(h)}
                  </button>
                ))}
              </div>
            </div>

            <p
              className={`flex items-start gap-1.5 text-[11px] ${
                peakFromInsights ? 'text-zinc-500' : 'text-amber-300'
              }`}
            >
              <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              {peakFromInsights
                ? 'ម៉ោងដែលបងបានកំណត់ផ្ទាល់។ ពិនិត្យ Insights ម្តងម្កាល ព្រោះវាអាចប្រែប្រួល។'
                : 'នេះជាម៉ោងទូទៅសម្រាប់ចាប់ផ្តើមតេស្ត (ថ្ងៃត្រង់ និងពេលល្ងាច) មិនមែនទិន្នន័យរបស់ Page បងទេ។ មើលម៉ោងពិតនៅ Meta Business Suite → Insights → Audience រួចចុចម៉ោងខាងលើដើម្បីកែ។'}
            </p>
          </section>
        </div>

        {/* RIGHT: results */}
        <div className="lg:col-span-3 space-y-5">
          {!plan && !loading && (
            <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-center bg-zinc-950 border border-dashed border-zinc-800 rounded-xl p-8 text-zinc-500 text-sm">
              <Sparkles className="w-8 h-8 mb-3 text-zinc-700" />
              សរសេរពី video នៅខាងឆ្វេង រួចចុច “បង្កើតចំណងជើង & Hashtag”
            </div>
          )}

          {loading && !plan && (
            <div className="min-h-[300px] flex items-center justify-center bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-400 text-sm gap-2">
              <Loader2 className="w-4 h-4 animate-spin" /> AI កំពុងសរសេរ...
            </div>
          )}

          {plan && (
            <>
              {/* Captions */}
              <section className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 space-y-2 text-xs">
                <h4 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
                  <MessageCircle className="w-4 h-4 text-blue-400" />
                  ចំណងជើង (ជ្រើសមួយ)
                </h4>
                <div className="space-y-2" role="radiogroup" aria-label="Captions">
                  {plan.captions.map((c, i) => (
                    <div
                      key={i}
                      role="radio"
                      aria-checked={selectedCaption === i}
                      tabIndex={0}
                      onClick={() => setSelectedCaption(i)}
                      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setSelectedCaption(i)}
                      className={`rounded-lg border p-3 cursor-pointer transition ${
                        selectedCaption === i
                          ? 'border-blue-500 bg-blue-950/30'
                          : 'border-zinc-800 bg-zinc-900/50 hover:border-zinc-700'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="text-[10px] font-mono uppercase text-zinc-500">{c.style}</span>
                        <CopyBtn text={c.text} id={`cap-${i}`} label="Copy" />
                      </div>
                      <p className="text-sm text-zinc-100 whitespace-pre-wrap leading-relaxed">{c.text}</p>
                    </div>
                  ))}
                </div>
              </section>

              {/* On-screen hooks */}
              {plan.onScreenHooks.length > 0 && (
                <section className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 space-y-2 text-xs">
                  <h4 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
                    <TypeIcon className="w-4 h-4 text-amber-400" />
                    អក្សរលើអេក្រង់ ក្នុងវិនាទីទី ១
                  </h4>
                  <ul className="space-y-1.5">
                    {plan.onScreenHooks.map((h, i) => (
                      <li
                        key={i}
                        className="flex items-center justify-between gap-2 bg-zinc-900/50 border border-zinc-800 rounded-lg px-3 py-2"
                      >
                        <span className="text-sm font-bold text-amber-200">{h}</span>
                        <CopyBtn text={h} id={`hook-${i}`} />
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {/* Hashtags */}
              <section className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
                    <Hash className="w-4 h-4 text-emerald-400" />
                    Hashtag
                  </h4>
                  <span className={`font-mono ${selectedCount > 5 ? 'text-amber-300' : 'text-zinc-500'}`}>
                    {selectedCount} បានជ្រើស {selectedCount > 5 && '(គួរ ៣-៥)'}
                  </span>
                </div>
                {(
                  [
                    ['ប្រធានបទ', plan.hashtags.topic],
                    ['ទីតាំង', plan.hashtags.location],
                    ['ម៉ាក', plan.hashtags.brand],
                  ] as const
                ).map(([label, tags]) =>
                  tags.length ? (
                    <div key={label} className="flex flex-wrap items-center gap-1.5">
                      <span className="text-zinc-500 w-16 shrink-0">{label}</span>
                      {tags.map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => toggleTag(t)}
                          aria-pressed={selectedTags.has(t)}
                          className={`px-2.5 py-1 rounded-full font-mono transition cursor-pointer ${
                            selectedTags.has(t)
                              ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/40'
                              : 'bg-zinc-900 text-zinc-500 border border-zinc-800 line-through'
                          }`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  ) : null
                )}
                {!pageTag && (
                  <p className="text-[11px] text-zinc-500">
                    បន្ថែម Hashtag ម៉ាករបស់ Page នៅខាងឆ្វេង ដើម្បីឱ្យគេរក Reel ទាំងអស់របស់បងឃើញ។
                  </p>
                )}
              </section>

              {/* Final caption */}
              <section className="bg-zinc-950 border border-blue-900/50 rounded-xl p-4 space-y-2 text-xs">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h4 className="text-sm font-semibold text-zinc-100">Caption សម្រាប់ Paste ទៅ Facebook</h4>
                  <label className="flex items-center gap-1.5 text-zinc-400 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeQuestion}
                      onChange={(e) => setIncludeQuestion(e.target.checked)}
                      className="accent-blue-500"
                    />
                    បន្ថែមសំណួរ comment
                  </label>
                </div>
                <textarea
                  value={finalText}
                  onChange={(e) => setFinalText(e.target.value)}
                  rows={6}
                  aria-label="Final caption"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-sm text-zinc-100 outline-none focus:border-blue-500 resize-y leading-relaxed"
                />
                <button
                  type="button"
                  onClick={() => copy(finalText, 'final')}
                  disabled={!finalText}
                  className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white font-bold text-sm rounded-lg py-2.5 transition cursor-pointer"
                >
                  {copied === 'final' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copied === 'final' ? 'បាន Copy ✓' : 'Copy Caption ទាំងអស់'}
                </button>
                <p className="text-[11px] text-zinc-500">
                  អាចកែអក្សរខាងលើបានផ្ទាល់។ សូមអានពិនិត្យមុនពេល post ព្រោះ AI អាចសរសេរខុស។ · Model: {plan.model}
                </p>
              </section>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
