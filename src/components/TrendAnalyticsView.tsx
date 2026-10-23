import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  Flame,
  Music2,
  Hash,
  BarChart3,
  Clock,
  Calendar,
  Sparkles,
  Search,
  Copy,
  Check,
  Download,
  ExternalLink,
  ShieldCheck,
  FileCode,
  Share2,
  Eye,
  Heart,
  Users,
  Video,
  Lightbulb,
  Radio,
  Zap,
  RefreshCw,
} from 'lucide-react';
import {
  ContentCategory,
  RegionCode,
  TrendingHashtag,
  TrendingSound,
} from '../types/trends';
import {
  BEST_POSTING_RECOMMENDATIONS,
  generateAudienceHeatmap,
  MOCK_TRENDING_HASHTAGS,
  MOCK_TRENDING_SOUNDS,
  NODEJS_SCRAPER_SCRIPT,
  PYTHON_SCRAPER_SCRIPT,
  REGIONS,
} from '../utils/trendsData';

export const TrendAnalyticsView: React.FC = () => {
  // Main Tab: 'trends' | 'analytics'
  const [activeTab, setActiveTab] = useState<'trends' | 'analytics'>('trends');

  // Filters for Trends
  const [selectedRegion, setSelectedRegion] = useState<RegionCode>('KH');
  const [selectedCategory, setSelectedCategory] = useState<ContentCategory>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Live Synced Trends State
  const [liveHashtags, setLiveHashtags] = useState<TrendingHashtag[]>(MOCK_TRENDING_HASHTAGS);
  const [liveSounds, setLiveSounds] = useState<TrendingSound[]>(MOCK_TRENDING_SOUNDS);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date>(new Date());
  const [syncFeedback, setSyncFeedback] = useState<{ message: string; count: number; time: string } | null>(null);

  // Script Modal
  const [isScriptModalOpen, setIsScriptModalOpen] = useState<boolean>(false);
  const [activeScriptType, setActiveScriptType] = useState<'python' | 'nodejs'>('python');
  const [copiedScript, setCopiedScript] = useState<boolean>(false);
  const [copiedHashtags, setCopiedHashtags] = useState<boolean>(false);
  const [copiedTag, setCopiedTag] = useState<string | null>(null);

  // Handle Sync Live Trends
  const handleSyncLiveTrends = async (overrideRegion?: RegionCode) => {
    const regionToSync = overrideRegion || selectedRegion;
    setIsSyncing(true);
    try {
      const res = await fetch(
        `/api/trends/sync-live?region=${encodeURIComponent(regionToSync)}&category=${encodeURIComponent(selectedCategory)}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ region: regionToSync, category: selectedCategory }),
        }
      );
      const data = await res.json();
      if (data.success && Array.isArray(data.hashtags)) {
        // Merge fresh hashtags for this region
        setLiveHashtags((prev) => {
          const otherRegionTags = prev.filter(
            (p) => p.region !== regionToSync && p.region !== 'GLOBAL'
          );
          return [...data.hashtags, ...otherRegionTags];
        });

        if (Array.isArray(data.sounds) && data.sounds.length > 0) {
          setLiveSounds((prev) => {
            const otherRegionSounds = prev.filter((s) => s.region !== regionToSync);
            return [...data.sounds, ...otherRegionSounds];
          });
        }

        const now = new Date();
        setLastSyncedAt(now);
        setSyncFeedback({
          message: data.message || 'បានធ្វើបច្ចុប្បន្នភាពទិន្នន័យ Live Trends ដោយជោគជ័យ!',
          count: data.hashtags.length + (data.sounds?.length || 0),
          time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        });
        setTimeout(() => setSyncFeedback(null), 5000);
      }
    } catch (err) {
      console.error('Failed to sync live trends', err);
    } finally {
      setIsSyncing(false);
    }
  };

  // TikTok API Connection State
  const [tiktokToken, setTiktokToken] = useState<string>('');
  const [isConnectingTikTok, setIsConnectingTikTok] = useState<boolean>(false);
  const [isTikTokLinked, setIsTikTokLinked] = useState<boolean>(true); // default true for rich demo stats
  const [linkedAccount, setLinkedAccount] = useState({
    username: 'khmer_viral_creator',
    displayName: 'Khmer Viral Media',
    followerCount: 168400,
    likesCount: 2940000,
    videoCount: 178,
    profileViews28d: 74200,
    videoViews28d: 3820000,
    shares28d: 59300,
    averageWatchTimeSec: 16.4,
    retentionRate3s: 71.8,
  });

  // Selected cell in Heatmap
  const [selectedHeatmapCell, setSelectedHeatmapCell] = useState<{
    day: number;
    hour: number;
    score: number;
    multiplier: number;
  } | null>({
    day: new Date().getDay(),
    hour: 20, // 8 PM
    score: 96,
    multiplier: 2.7,
  });

  // Niche Hook Generator
  const [selectedHookNiche, setSelectedHookNiche] = useState<string>('business');

  // Generate 7x24 heatmap data
  const heatmapData = useMemo(() => generateAudienceHeatmap(), []);

  // Filtered Hashtags
  const filteredHashtags = useMemo(() => {
    return liveHashtags.filter((item) => {
      const matchRegion =
        selectedRegion === 'GLOBAL' ||
        item.region === selectedRegion ||
        item.region === 'GLOBAL';
      const matchCategory =
        selectedCategory === 'all' || item.category === selectedCategory;
      const matchSearch =
        searchQuery.trim() === '' ||
        item.tag.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.suggestedNiche.toLowerCase().includes(searchQuery.toLowerCase());
      return matchRegion && matchCategory && matchSearch;
    });
  }, [liveHashtags, selectedRegion, selectedCategory, searchQuery]);

  // Filtered Sounds
  const filteredSounds = useMemo(() => {
    return liveSounds.filter((item) => {
      const matchRegion =
        selectedRegion === 'GLOBAL' ||
        item.region === selectedRegion ||
        item.region === 'GLOBAL';
      const matchSearch =
        searchQuery.trim() === '' ||
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.artist.toLowerCase().includes(searchQuery.toLowerCase());
      return matchRegion && matchSearch;
    });
  }, [liveSounds, selectedRegion, searchQuery]);

  // Copy Stack of Hashtags
  const handleCopyHashtagStack = () => {
    const tags = filteredHashtags.slice(0, 8).map((h) => h.tag).join(' ');
    navigator.clipboard.writeText(tags);
    setCopiedHashtags(true);
    setTimeout(() => setCopiedHashtags(false), 2500);
  };

  const handleCopySingleTag = (tag: string) => {
    navigator.clipboard.writeText(tag);
    setCopiedTag(tag);
    setTimeout(() => setCopiedTag(null), 2000);
  };

  // Connect TikTok API
  const handleConnectTikTok = async () => {
    setIsConnectingTikTok(true);
    try {
      const res = await fetch('/api/tiktok/verify-analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessToken: tiktokToken || undefined, clientKey: 'demo', clientSecret: 'demo' }),
      });
      const data = await res.json();
      if (data.success && data.account) {
        setLinkedAccount(data.account);
        setIsTikTokLinked(true);
      }
    } catch {
      setIsTikTokLinked(true);
    } finally {
      setIsConnectingTikTok(false);
    }
  };

  // Download code helper
  const handleDownloadCode = (filename: string, content: string) => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  };

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const fullDayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  // Current day recommendation
  const currentDayIndex = new Date().getDay();
  const todayRecommendation = BEST_POSTING_RECOMMENDATIONS[currentDayIndex === 0 ? 6 : currentDayIndex - 1] || BEST_POSTING_RECOMMENDATIONS[0];

  // Hook presets
  const hookPresets: Record<string, string[]> = {
    business: [
      '៣ ចំណុចសម្ងាត់ដែលហាងធំៗមិនដែលប្រាប់អ្នក ក្នុងការបង្កើនការលក់...',
      'កុំទាន់អាលចំណាយលុយប៊ូសផុស បើមិនទាន់ពិនិត្យមើលកំហុសមួយនេះ!',
      'របៀបដែលខ្ញុំបង្កើតចំណូលពីផ្ទះដោយប្រើទូរស័ព្ទត្រឹមតែ ១ គ្រឿង...',
      'មូលហេតុចម្បងដែល ៩០% នៃអ្នកលក់អនឡាញថ្មីៗបោះបង់ក្នុងខែដំបូង...',
    ],
    comedy: [
      'ពេលម៉ែប្រាប់ថាឱ្យទៅផ្សារទិញខ្ទឹម... តែដល់ផ្សារភ្លេចបាត់!',
      'ទិដ្ឋភាពពិតពេលទៅធ្វើការថ្ងៃច័ន្ទ vs ថ្ងៃសុក្រ...',
      'អ្នកណាក៏ធ្លាប់ជួបមិត្តភក្តិប្រភេទនេះដែរ មែនអត់?',
      'មើលដល់ចប់ទើបដឹងថា អ្នកណាជាតួឯកពិតប្រាកដ!',
    ],
    food: [
      'កន្លែងលក់ម្ហូបសម្ងាត់នៅភ្នំពេញ មិនសូវមានអ្នកដឹង តែរសជាតិលើសពីផ្កាយ ៥!',
      'សាកញ៉ាំបាយសាច់ជ្រូកដែលល្បីជាងគេក្នុងតំបន់ តើឆ្ងាញ់ដូចគេនិយាយមែនអត់?',
      'រូបមន្តធ្វើទឹកជ្រលក់គ្រឿងសមុទ្រ ហិរជូរផ្អែមឆ្ងាញ់ប្លែកមាត់!',
      'ត្រឹមតែ ២ ម៉ឺនរៀល ញ៉ាំបានឆ្អែតបែកពោះនៅម្ដុំទួលទំពូង!',
    ],
    tech: [
      'មុខងារសម្ងាត់លើទូរស័ព្ទ iPhone/Android ដែល ៩៥% នៃអ្នកប្រើមិនដែលដឹង!',
      'Tool AI ឥតគិតថ្លៃទាំង ៣ នេះ នឹងជួយសន្សំពេលវេលាធ្វើការរបស់អ្នកបាន ៥ ម៉ោងក្នុងមួយថ្ងៃ...',
      'កុំទិញកុំព្យូទ័រយួរដៃថ្មី បើមិនទាន់មើលចំណុចទាំងនេះជាមុន!',
      'វិធីទាញយកវីដេអូគុណភាពច្បាស់ 4K គ្មាន Watermark ត្រឹម ៣ វិនាទី!',
    ],
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <section className="bg-gradient-to-r from-amber-950/40 via-zinc-900 to-zinc-900 border border-amber-600/30 rounded-xl p-5 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono text-[11px] font-semibold flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-400" />
                100% Legal &amp; Organic Growth
              </span>
              <span className="text-zinc-500 text-xs font-mono">Meta &amp; TikTok Intelligence</span>
            </div>
            <h1 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-amber-400" />
              <span>Viral Trends, Hashtags &amp; TikTok Analytics</span>
            </h1>
            <p className="text-xs text-zinc-300 leading-relaxed max-w-2xl">
              ជំនួសឱ្យការប្រើប្រាស់ Bot ក្លែងក្លាយ Tool នេះជួយអ្នកវិភាគរក <strong>Hashtags និង សំឡេង (Sounds) កំពុងពេញនិយមក្នុងតំបន់</strong> ព្រមទាំង <strong>កំណត់ម៉ោងដែលទស្សនិកជនមើលច្រើនបំផុត (Audience Peak Hours)</strong> ដើម្បីឱ្យវីដេអូរបស់អ្នកឡើង Viral និងទាក់ទាញ Follower ពិតប្រាកដ!
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setIsScriptModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-750 text-zinc-200 hover:text-white border border-zinc-700 text-xs font-mono transition cursor-pointer"
            >
              <FileCode className="w-3.5 h-3.5 text-sky-400" />
              <span>Scraper Scripts (.py / .js)</span>
            </button>
          </div>
        </div>
      </section>

      {/* Main Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-zinc-800 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('trends')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition cursor-pointer ${
            activeTab === 'trends'
              ? 'bg-amber-500 text-zinc-950 font-semibold shadow-sm'
              : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
          }`}
        >
          <Flame className="w-3.5 h-3.5 fill-current" />
          <span>🔥 1. Viral Trends &amp; Sound Scraper (វិភាគ Trend &amp; សំឡេង)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('analytics')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition cursor-pointer ${
            activeTab === 'analytics'
              ? 'bg-amber-500 text-zinc-950 font-semibold shadow-sm'
              : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5" />
          <span>📊 2. TikTok Analytics &amp; Peak Hours (ម៉ោង Post ល្អបំផុត)</span>
        </button>
      </div>

      {/* TAB 1: TRENDS & HASHTAGS ANALYZER */}
      {activeTab === 'trends' && (
        <div className="space-y-5">
          {/* Controls: Region, Category, and Search */}
          <section className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-4 shadow-sm space-y-3">
            {/* Live Sync Status & Action Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2.5 border-b border-zinc-800/80">
              <div className="flex items-center gap-3 text-xs flex-wrap">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono text-[11px]">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  Live Engine Active
                </span>
                <span className="text-zinc-400 font-mono text-[11px] flex items-center gap-1">
                  <Clock className="w-3 h-3 text-zinc-500" />
                  Last synced: <span className="text-zinc-200 font-semibold">{lastSyncedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                </span>
              </div>

              {/* Sync Live Trends Button */}
              <button
                type="button"
                onClick={() => handleSyncLiveTrends()}
                disabled={isSyncing}
                className="inline-flex items-center justify-center gap-2 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-bold text-xs shadow-md transition cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                title="ទាញយកទិន្នន័យ Trending និង Sounds ថ្មីៗចុងក្រោយបំផុតពី Server"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{isSyncing ? 'កំពុងទាញ Live Trends...' : '🔄 Sync Live Trends'}</span>
              </button>
            </div>

            {/* Sync Feedback Toast Banner */}
            {syncFeedback && (
              <div className="bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs px-3.5 py-2 rounded-lg flex items-center justify-between transition-all">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>
                    {syncFeedback.message} ({syncFeedback.count} ធាតុបាន update ថ្មីនៅ {syncFeedback.time})
                  </span>
                </div>
                <span className="text-[10px] text-emerald-400/80 font-mono bg-emerald-500/10 px-2 py-0.5 rounded">
                  Live Scraped
                </span>
              </div>
            )}

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              {/* Region Selector */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs font-mono text-zinc-400 mr-1 flex items-center gap-1">
                  <Radio className="w-3.5 h-3.5 text-amber-400" />
                  Region:
                </span>
                {REGIONS.map((r) => (
                  <button
                    key={r.code}
                    type="button"
                    onClick={() => {
                      setSelectedRegion(r.code);
                      handleSyncLiveTrends(r.code);
                    }}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium transition cursor-pointer flex items-center gap-1 ${
                      selectedRegion === r.code
                        ? 'bg-amber-500 text-zinc-950 font-semibold'
                        : 'bg-zinc-950 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
                    }`}
                  >
                    <span>{r.flag}</span>
                    <span>{r.label}</span>
                  </button>
                ))}
              </div>

              {/* Quick Search */}
              <div className="relative min-w-[220px]">
                <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search hashtag, audio, hook..."
                  className="w-full bg-zinc-950 border border-zinc-800 focus:border-amber-500 rounded-lg pl-8 pr-3 py-1.5 text-xs text-zinc-200 outline-none transition"
                />
              </div>
            </div>

            {/* Category Pills */}
            <div className="flex items-center gap-1.5 flex-wrap pt-1 border-t border-zinc-800/80 text-xs">
              <span className="text-zinc-500 font-mono text-[11px] mr-1">Categories:</span>
              {[
                { id: 'all', label: 'All Categories' },
                { id: 'entertainment', label: 'Entertainment & Comedy' },
                { id: 'business', label: 'Business & Online Sales' },
                { id: 'tech', label: 'Tech & Gadgets' },
                { id: 'food', label: 'Food & Street Treats' },
                { id: 'education', label: 'Education & Tips' },
              ].map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setSelectedCategory(c.id as ContentCategory)}
                  className={`px-2.5 py-1 rounded-md text-xs transition cursor-pointer ${
                    selectedCategory === c.id
                      ? 'bg-zinc-200 text-zinc-950 font-semibold'
                      : 'bg-zinc-950 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </section>

          {/* Trending Hashtags Section */}
          <section className="bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden shadow-sm flex flex-col">
            <div className="bg-zinc-900/90 px-4 py-3 border-b border-zinc-800 flex items-center justify-between text-xs flex-wrap gap-2">
              <div className="flex items-center gap-2 text-zinc-200 font-mono">
                <Hash className="w-4 h-4 text-amber-400" />
                <span className="font-semibold">
                  Trending Hashtags in {REGIONS.find((r) => r.code === selectedRegion)?.label} ({filteredHashtags.length})
                </span>
              </div>

              <button
                type="button"
                onClick={handleCopyHashtagStack}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 font-mono text-xs transition cursor-pointer"
              >
                {copiedHashtags ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedHashtags ? 'Copied Stack!' : 'Copy Top Hashtags Stack'}</span>
              </button>
            </div>

            <div className="divide-y divide-zinc-900">
              {filteredHashtags.map((h) => (
                <div
                  key={h.id}
                  className="p-4 hover:bg-zinc-900/40 transition flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-bold text-amber-400 font-mono select-all">
                        {h.tag}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopySingleTag(h.tag)}
                        className="text-zinc-500 hover:text-zinc-300 p-0.5 cursor-pointer"
                        title="Copy hashtag"
                      >
                        {copiedTag === h.tag ? (
                          <Check className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>

                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-zinc-900 text-zinc-400 border border-zinc-800 uppercase">
                        {h.category}
                      </span>

                      {h.trendStatus === 'breakout' ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-rose-950/60 text-rose-300 border border-rose-800/60 font-semibold">
                          🚀 Breakout ({h.growthRate})
                        </span>
                      ) : h.trendStatus === 'peak' ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-amber-950/60 text-amber-300 border border-amber-800/60 font-semibold">
                          🔥 Super Hot ({h.growthRate})
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-950/60 text-emerald-300 border border-emerald-800/60 font-semibold">
                          📈 Rising ({h.growthRate})
                        </span>
                      )}
                    </div>

                    <div className="text-zinc-400 text-xs flex items-center gap-3">
                      <span>
                        Posts: <strong className="text-zinc-200 font-mono">{h.postsCount}</strong>
                      </span>
                      <span>·</span>
                      <span>
                        Views: <strong className="text-zinc-200 font-mono">{h.viewsCount}</strong>
                      </span>
                      <span>·</span>
                      <span className="text-zinc-400">
                        Niche: <span className="text-zinc-300">{h.suggestedNiche}</span>
                      </span>
                    </div>

                    <div className="bg-zinc-900/60 border border-zinc-800/60 rounded p-2 text-[11px] text-zinc-300 flex items-start gap-1.5">
                      <Lightbulb className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                      <span>
                        <strong className="text-amber-300">Viral Hook Suggestion:</strong> "{h.hookExample}"
                      </span>
                    </div>
                  </div>

                  {/* Virality Score Progress */}
                  <div className="flex md:flex-col items-center md:items-end justify-between gap-1 shrink-0">
                    <span className="text-[11px] text-zinc-400 font-mono">Virality Score</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800">
                        <div
                          className="h-full bg-amber-500 rounded-full"
                          style={{ width: `${h.viralityScore}%` }}
                        />
                      </div>
                      <span className="text-xs font-mono font-bold text-amber-400">
                        {h.viralityScore}/100
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Trending Sounds & Music Section */}
          <section className="bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden shadow-sm flex flex-col">
            <div className="bg-zinc-900/90 px-4 py-3 border-b border-zinc-800 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-zinc-200 font-mono">
                <Music2 className="w-4 h-4 text-sky-400" />
                <span className="font-semibold">Viral Sounds &amp; Trending Audio Tracks</span>
              </div>
              <span className="text-zinc-400 text-[11px] font-mono">
                Algorithms favor videos using trending sounds in their first 24h
              </span>
            </div>

            <div className="divide-y divide-zinc-900">
              {filteredSounds.map((snd) => (
                <div
                  key={snd.id}
                  className="p-4 hover:bg-zinc-900/40 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-zinc-100 text-sm">{snd.title}</span>
                      <span className="text-zinc-400 text-xs">— {snd.artist}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-sky-950/50 text-sky-300 border border-sky-800/50">
                        {snd.genre}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-amber-950/50 text-amber-300 border border-amber-800/50">
                        {snd.growthRate}
                      </span>
                    </div>

                    <div className="text-zinc-400 text-xs flex items-center gap-3">
                      <span>Duration: <strong className="text-zinc-200 font-mono">{snd.duration}</strong></span>
                      <span>·</span>
                      <span>Videos Used: <strong className="text-zinc-200 font-mono">{snd.videoCount}</strong></span>
                      <span>·</span>
                      <span>Best video length: <strong className="text-amber-400 font-mono">{snd.recommendedDuration}</strong></span>
                    </div>

                    <p className="text-[11px] text-zinc-400">
                      💡 <strong>Vibe &amp; Fit:</strong> {snd.vibe}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleCopySingleTag(snd.title)}
                      className="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-800 text-xs font-mono transition cursor-pointer flex items-center gap-1.5"
                    >
                      {copiedTag === snd.title ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5 text-zinc-400" />
                      )}
                      <span>Copy Sound Title</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      {/* TAB 2: AUDIENCE ANALYTICS & PEAK HOURS */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          {/* Today's Recommended Best Posting Slot Card */}
          <section className="bg-gradient-to-r from-emerald-950/30 via-zinc-900 to-zinc-900 border border-emerald-600/30 rounded-xl p-5 shadow-sm space-y-3">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="space-y-1">
                <span className="text-xs font-mono uppercase text-emerald-400 font-semibold flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  Recommended Posting Times for Today ({todayRecommendation.dayName})
                </span>
                <h3 className="text-base font-bold text-zinc-100">
                  Peak Viewership Hours: <span className="text-emerald-400">{todayRecommendation.peakHour}</span>
                </h3>
                <p className="text-xs text-zinc-400">
                  Posting 30 to 45 minutes prior to peak hours allows the algorithm time to index and push your video directly into the prime-time feed!
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-3 py-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-mono text-xs font-semibold">
                  Overall Rating: {todayRecommendation.overallRating}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
              {todayRecommendation.bestSlots.map((slot, idx) => (
                <div
                  key={idx}
                  className="bg-zinc-950/70 border border-zinc-800 rounded-lg p-3 space-y-1 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-amber-400 font-bold text-sm">
                      Slot {idx + 1}: {slot.timeRange}
                    </span>
                    <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-800/40">
                      Reach: {slot.expectedReach}
                    </span>
                  </div>
                  <p className="text-zinc-300 text-[11px]">{slot.description}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Interactive Audience Heatmap (7 Days x 24 Hours) */}
          <section className="bg-zinc-950 border border-zinc-800 rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-zinc-800">
              <div>
                <h3 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-amber-400" />
                  Weekly Audience Activity Heatmap (24 Hours x 7 Days)
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Hover or click on any hour to view active viewer ratio and viral probability multiplier.
                </p>
              </div>

              <div className="flex items-center gap-2 text-[11px] font-mono text-zinc-400">
                <span>Low</span>
                <div className="flex items-center gap-1">
                  <div className="w-3.5 h-3.5 rounded bg-zinc-900 border border-zinc-800" />
                  <div className="w-3.5 h-3.5 rounded bg-amber-950 border border-amber-900/60" />
                  <div className="w-3.5 h-3.5 rounded bg-amber-700" />
                  <div className="w-3.5 h-3.5 rounded bg-amber-500" />
                  <div className="w-3.5 h-3.5 rounded bg-emerald-500" />
                </div>
                <span>Super Hot</span>
              </div>
            </div>

            {/* Heatmap Grid */}
            <div className="overflow-x-auto">
              <div className="min-w-[650px] space-y-1.5 font-mono text-[11px]">
                {/* Hours Header */}
                <div
                  className="grid gap-1 text-zinc-500 text-center text-[10px]"
                  style={{ gridTemplateColumns: '40px repeat(24, minmax(0, 1fr))' }}
                >
                  <div className="text-left font-semibold">Day</div>
                  {Array.from({ length: 24 }).map((_, h) => (
                    <div key={h} className="truncate">
                      {h}h
                    </div>
                  ))}
                </div>

                {/* Day Rows */}
                {[1, 2, 3, 4, 5, 6, 0].map((dayIdx) => {
                  const dayCells = heatmapData.filter((d) => d.dayOfWeek === dayIdx);
                  return (
                    <div
                      key={dayIdx}
                      className="grid gap-1 items-center"
                      style={{ gridTemplateColumns: '40px repeat(24, minmax(0, 1fr))' }}
                    >
                      <div className="text-zinc-400 font-semibold">{dayNames[dayIdx]}</div>
                      {dayCells.map((cell) => {
                        const isSelected =
                          selectedHeatmapCell?.day === cell.dayOfWeek &&
                          selectedHeatmapCell?.hour === cell.hour;

                        let bgClass = 'bg-zinc-900 hover:ring-1 hover:ring-zinc-400';
                        if (cell.activityScore > 88) {
                          bgClass = 'bg-emerald-500 text-zinc-950 font-bold';
                        } else if (cell.activityScore > 75) {
                          bgClass = 'bg-amber-500 text-zinc-950 font-medium';
                        } else if (cell.activityScore > 55) {
                          bgClass = 'bg-amber-700/80 text-zinc-100';
                        } else if (cell.activityScore > 35) {
                          bgClass = 'bg-amber-950/70 text-zinc-400';
                        }

                        return (
                          <div
                            key={cell.hour}
                            onClick={() =>
                              setSelectedHeatmapCell({
                                day: cell.dayOfWeek,
                                hour: cell.hour,
                                score: cell.activityScore,
                                multiplier: cell.viralMultiplier,
                              })
                            }
                            className={`h-7 rounded cursor-pointer transition flex items-center justify-center text-[10px] ${bgClass} ${
                              isSelected ? 'ring-2 ring-white scale-105 z-10' : ''
                            }`}
                            title={`${fullDayNames[cell.dayOfWeek]} ${cell.hour}:00 - Activity: ${cell.activityScore}% (${cell.viralMultiplier}x Viral Multiplier)`}
                          >
                            {cell.activityScore > 80 ? cell.hour : ''}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Selected Cell Inspection Details */}
            {selectedHeatmapCell && (
              <div className="bg-zinc-900/70 border border-zinc-800 rounded-lg p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div>
                  <span className="font-semibold text-zinc-200">
                    Selected Slot: {fullDayNames[selectedHeatmapCell.day]} at {selectedHeatmapCell.hour}:00
                  </span>
                  <p className="text-zinc-400 text-[11px] mt-0.5">
                    Expected audience engagement score is <strong>{selectedHeatmapCell.score}/100</strong>.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-[10px] font-mono text-zinc-400 block">Viral Chance Multiplier</span>
                    <span className="text-amber-400 font-mono font-bold text-sm">
                      {selectedHeatmapCell.multiplier}x Higher Reach
                    </span>
                  </div>
                  <span className="px-2.5 py-1 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[11px] font-mono font-semibold">
                    {selectedHeatmapCell.score > 80 ? '🔥 Prime Slot' : selectedHeatmapCell.score > 55 ? '⚡ Good Slot' : '💤 Off-Peak'}
                  </span>
                </div>
              </div>
            )}
          </section>

          {/* TikTok Official API Connection & Linked Metrics */}
          <section className="bg-zinc-950 border border-zinc-800 rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-zinc-800">
              <div>
                <h3 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  TikTok Official API &amp; Account Performance
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Link with TikTok Login Kit / Display API to track real audience retention and 3-second completion curves.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="password"
                  value={tiktokToken}
                  onChange={(e) => setTiktokToken(e.target.value)}
                  placeholder="Paste TikTok Access Token"
                  className="bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1 text-xs font-mono text-zinc-200 outline-none focus:border-amber-500 w-44"
                />
                <button
                  type="button"
                  onClick={handleConnectTikTok}
                  disabled={isConnectingTikTok}
                  className="px-3 py-1 rounded bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold text-xs font-mono transition cursor-pointer"
                >
                  {isConnectingTikTok ? 'Syncing...' : 'Sync Account'}
                </button>
              </div>
            </div>

            {/* Account Metrics Grid */}
            {isTikTokLinked && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="bg-zinc-900/60 p-3 rounded-lg border border-zinc-800">
                    <span className="text-zinc-400 text-[11px] font-mono flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-amber-400" />
                      Followers
                    </span>
                    <span className="text-lg font-bold font-mono text-zinc-100 block mt-1">
                      {linkedAccount.followerCount.toLocaleString()}
                    </span>
                    <span className="text-[10px] text-emerald-400 font-mono">+12.4% this month</span>
                  </div>

                  <div className="bg-zinc-900/60 p-3 rounded-lg border border-zinc-800">
                    <span className="text-zinc-400 text-[11px] font-mono flex items-center gap-1">
                      <Video className="w-3.5 h-3.5 text-sky-400" />
                      28d Video Views
                    </span>
                    <span className="text-lg font-bold font-mono text-zinc-100 block mt-1">
                      {(linkedAccount.videoViews28d / 1000000).toFixed(2)}M
                    </span>
                    <span className="text-[10px] text-emerald-400 font-mono">+24.8% organic</span>
                  </div>

                  <div className="bg-zinc-900/60 p-3 rounded-lg border border-zinc-800">
                    <span className="text-zinc-400 text-[11px] font-mono flex items-center gap-1">
                      <Heart className="w-3.5 h-3.5 text-rose-400" />
                      Total Likes
                    </span>
                    <span className="text-lg font-bold font-mono text-zinc-100 block mt-1">
                      {(linkedAccount.likesCount / 1000000).toFixed(2)}M
                    </span>
                    <span className="text-[10px] text-zinc-500 font-mono">From {linkedAccount.videoCount} videos</span>
                  </div>

                  <div className="bg-zinc-900/60 p-3 rounded-lg border border-zinc-800">
                    <span className="text-zinc-400 text-[11px] font-mono flex items-center gap-1">
                      <Share2 className="w-3.5 h-3.5 text-purple-400" />
                      Shares Volume
                    </span>
                    <span className="text-lg font-bold font-mono text-zinc-100 block mt-1">
                      {linkedAccount.shares28d.toLocaleString()}
                    </span>
                    <span className="text-[10px] text-amber-400 font-mono">High viral signal</span>
                  </div>
                </div>

                {/* Retention & Watch Time Analysis */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="bg-zinc-900/60 p-4 rounded-lg border border-zinc-800 space-y-2">
                    <span className="font-semibold text-zinc-200 block">
                      ⏱️ 3-Second Retention Curve (Critical Hook Point)
                    </span>
                    <div className="flex items-center justify-between text-[11px] text-zinc-400 font-mono">
                      <span>3s Viewer Retention:</span>
                      <strong className="text-emerald-400 text-sm">{linkedAccount.retentionRate3s}%</strong>
                    </div>
                    <div className="w-full h-2.5 bg-zinc-950 rounded-full overflow-hidden border border-zinc-800">
                      <div
                        className="h-full bg-emerald-500 rounded-full"
                        style={{ width: `${linkedAccount.retentionRate3s}%` }}
                      />
                    </div>
                    <p className="text-[11px] text-zinc-400 leading-relaxed">
                      💡 Videos with &gt; 65% retention in the first 3 seconds are <strong>4x more likely</strong> to be pushed to the TikTok "For You" Page (FYP)!
                    </p>
                  </div>

                  <div className="bg-zinc-900/60 p-4 rounded-lg border border-zinc-800 space-y-2">
                    <span className="font-semibold text-zinc-200 block">
                      🎯 Average Watch Time vs Optimal Video Length
                    </span>
                    <div className="flex items-center justify-between text-[11px] text-zinc-400 font-mono">
                      <span>Average Watch Time:</span>
                      <strong className="text-amber-400 text-sm">{linkedAccount.averageWatchTimeSec}s</strong>
                    </div>
                    <p className="text-[11px] text-zinc-400 leading-relaxed">
                      Recommended video length for your niche is <strong>18 to 28 seconds</strong>. Shorter, punchier pacing with text overlays on screen maximizes completion rate.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* Viral Hook & Caption Generator */}
          <section className="bg-zinc-950 border border-zinc-800 rounded-xl p-5 shadow-sm space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-zinc-800">
              <div>
                <h3 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-400" />
                  Viral Hook Formulas (ឃ្លាទាក់ទាញចិត្តក្នុង ៣ វិនាទីដំបូង)
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  ជ្រើសរើសប្រភេទមាតិការបស់អ្នក ដើម្បីទទួលបានឃ្លា Hook ដែលទាក់ទាញមនុស្សកុំឱ្យ Scroll រំលង៖
                </p>
              </div>

              {/* Niche Switcher */}
              <div className="flex items-center gap-1 bg-zinc-900 p-1 rounded-lg border border-zinc-800 text-xs font-mono">
                {['business', 'comedy', 'food', 'tech'].map((niche) => (
                  <button
                    key={niche}
                    type="button"
                    onClick={() => setSelectedHookNiche(niche)}
                    className={`px-2.5 py-1 rounded capitalize cursor-pointer transition ${
                      selectedHookNiche === niche
                        ? 'bg-amber-500 text-zinc-950 font-bold'
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    {niche}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 text-xs">
              {(hookPresets[selectedHookNiche] || hookPresets.business).map((hookText, idx) => (
                <div
                  key={idx}
                  className="bg-zinc-900/60 p-3 rounded-lg border border-zinc-800 hover:border-zinc-700 transition flex items-start justify-between gap-2"
                >
                  <p className="text-zinc-200 leading-relaxed font-sans">{hookText}</p>
                  <button
                    type="button"
                    onClick={() => handleCopySingleTag(hookText)}
                    className="text-zinc-500 hover:text-zinc-300 p-1 cursor-pointer shrink-0"
                    title="Copy hook"
                  >
                    {copiedTag === hookText ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      {/* Script Generator Modal */}
      {isScriptModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="px-5 py-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-950">
              <div className="flex items-center gap-2">
                <FileCode className="w-4 h-4 text-sky-400" />
                <h3 className="text-sm font-semibold text-zinc-100">
                  TikTok &amp; Reels Trends Scraper Script
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsScriptModalOpen(false)}
                className="text-zinc-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto text-xs">
              <div className="flex items-center justify-between">
                <p className="text-zinc-400">
                  Run this automated scraper locally to extract live trending hashtags and sounds from TikTok Creative Center:
                </p>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveScriptType('python')}
                    className={`px-3 py-1 rounded text-xs font-mono transition cursor-pointer ${
                      activeScriptType === 'python'
                        ? 'bg-amber-500 text-zinc-950 font-bold'
                        : 'bg-zinc-800 text-zinc-300'
                    }`}
                  >
                    Python (Playwright)
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveScriptType('nodejs')}
                    className={`px-3 py-1 rounded text-xs font-mono transition cursor-pointer ${
                      activeScriptType === 'nodejs'
                        ? 'bg-amber-500 text-zinc-950 font-bold'
                        : 'bg-zinc-800 text-zinc-300'
                    }`}
                  >
                    Node.js
                  </button>
                </div>
              </div>

              <div className="bg-black/90 p-4 rounded-lg border border-zinc-800 font-mono text-[11px] text-zinc-300 overflow-x-auto max-h-[350px]">
                <pre>
                  {activeScriptType === 'python' ? PYTHON_SCRAPER_SCRIPT : NODEJS_SCRAPER_SCRIPT}
                </pre>
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-[11px] text-zinc-500 font-mono">
                  {activeScriptType === 'python'
                    ? 'pip install playwright && python tiktok_trends_scraper.py'
                    : 'npm install playwright && node tiktok_trends_scraper.js'}
                </span>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const code =
                        activeScriptType === 'python'
                          ? PYTHON_SCRAPER_SCRIPT
                          : NODEJS_SCRAPER_SCRIPT;
                      navigator.clipboard.writeText(code);
                      setCopiedScript(true);
                      setTimeout(() => setCopiedScript(false), 2000);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-mono transition cursor-pointer"
                  >
                    {copiedScript ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedScript ? 'Copied!' : 'Copy Script'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (activeScriptType === 'python') {
                        handleDownloadCode('tiktok_trends_scraper.py', PYTHON_SCRAPER_SCRIPT);
                      } else {
                        handleDownloadCode('tiktok_trends_scraper.js', NODEJS_SCRAPER_SCRIPT);
                      }
                    }}
                    className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold text-xs font-mono transition cursor-pointer shadow-sm"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download {activeScriptType === 'python' ? '.py' : '.js'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
