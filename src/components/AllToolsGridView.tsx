import React, { useState } from 'react';
import {
  Archive,
  Cloud,
  UserPlus,
  TrendingUp,
  Send,
  ArrowRight,
  Search,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import { ToolMode } from './Header';

export interface ToolItem {
  id: ToolMode;
  name: string;
  category: 'Generative AI' | 'Web Archiving' | 'Cloud Storage' | 'Cloudflare' | 'Social Growth' | 'Automation';
  description: string;
  icon: React.ReactNode;
  tag: string;
  features: string[];
}

interface AllToolsGridViewProps {
  onSelectTool: (tool: ToolMode) => void;
}

export const TOOLS_LIST: ToolItem[] = [
  {
    id: 'super_intelligent',
    name: 'Super-Intelligent AI Studio (Gemini)',
    category: 'Generative AI',
    tag: 'Gemini 3.8 AI',
    icon: <Sparkles className="w-5 h-5 text-amber-400" />,
    description:
      'Personal AI Creation Suite powered by Gemini API. Generate photorealistic 8K images, synthesize natural voiceovers (Text to Sound WAV 24kHz), create multi-shot cinematic video storyboards, and generate viral scripts.',
    features: ['Text-to-Image (8K/Presets)', 'Text-to-Sound (TTS 24kHz)', 'Video Storyboard & Motion', 'AI Brain Script Writer'],
  },
  {
    id: 'wayback',
    name: 'Wayback Site Cloner & Media Downloader',
    category: 'Web Archiving',
    tag: 'Web Archiving',
    icon: <Archive className="w-5 h-5" />,
    description:
      'Clone full websites from Internet Archive snapshots, extract raw pristine HTML/CSS/JS with "id_" flag, strip intrusive Wayback toolbar telemetry, and download all media (.jpg, .png, .webp) directly or in a standalone ZIP.',
    features: ['Direct Media Downloader', 'Raw id_ Sniffer', 'Offline ZIP Bundler'],
  },
  {
    id: 'rclone_r2',
    name: 'Rclone / Cloudflare R2 & S3 Backup',
    category: 'Cloud Storage',
    tag: 'Cloud Storage',
    icon: <Cloud className="w-5 h-5" />,
    description:
      'Manage S3-compatible Cloudflare R2 and AWS S3 buckets. Auto-generate rclone.conf profiles, verify live credentials, browse remote directories, and run automated sync & backup jobs.',
    features: ['rclone.conf Generator', 'Live S3 Verification', 'Cloud Bucket Explorer'],
  },
  {
    id: 'cf_accounts',
    name: 'CF Account Creator & Domain Provisioner',
    category: 'Cloudflare',
    tag: 'Cloudflare',
    icon: <UserPlus className="w-5 h-5" />,
    description:
      'Batch create and manage 100+ Cloudflare accounts with custom wildcard domain mappings, generate global API tokens, and export full credentials to CSV/JSON format.',
    features: ['100+ Batch Accounts', 'API Token Management', 'CSV / JSON Export'],
  },
  {
    id: 'trend_analytics',
    name: 'Trends & TikTok / Meta Audience Analytics',
    category: 'Social Growth',
    tag: 'Social Growth',
    icon: <TrendingUp className="w-5 h-5" />,
    description:
      'Discover viral trending hashtags, curate trending TikTok & Reels background audio, and analyze 24x7 audience engagement peak hours to maximize organic reach and growth.',
    features: ['Viral Hashtags Tracker', 'Trending Audio Engine', '24x7 Posting Heatmap'],
  },
  {
    id: 'telegram_auto_reply',
    name: 'Telegram Auto-Reply & Anti-Spam Deflector',
    category: 'Automation',
    tag: 'Automation',
    icon: <Send className="w-5 h-5" />,
    description:
      'Automatically deflect annoying spam, loan scams, and harassment on Telegram DMs with custom keyword triggers, fallback timers, and 24/7 personal UserBot automation scripts.',
    features: ['Anti-Spam Filter', 'UserBot Python Script', 'Live DM Simulator'],
  },
];

export const AllToolsGridView: React.FC<AllToolsGridViewProps> = ({ onSelectTool }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const categories = ['All', 'Generative AI', 'Web Archiving', 'Cloud Storage', 'Cloudflare', 'Social Growth', 'Automation'];

  const filteredTools = TOOLS_LIST.filter((tool) => {
    const matchesCategory = selectedCategory === 'All' || tool.category === selectedCategory;
    const matchesSearch =
      tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tool.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tool.tag.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Top Banner / Hero Section matching reference */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-2 border-b border-zinc-800/80">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-100 tracking-tight">
              All Tools
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
              {TOOLS_LIST.length} Available
            </span>
          </div>
          <p className="text-sm text-zinc-400 max-w-2xl leading-relaxed">
            {TOOLS_LIST.length} tools across 5 categories — pick one to run a scan, clone snapshots, or trigger automation.
          </p>
        </div>

        {/* Search bar */}
        <div className="flex items-center gap-3">
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tools or features..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-amber-500 transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setSelectedCategory(cat)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer shrink-0 ${
              selectedCategory === cat
                ? 'bg-amber-500 text-zinc-950 shadow-md font-bold'
                : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850 border border-zinc-800/80'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* 3-Column Grid matching reference image image_00e964cf.png */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredTools.map((tool) => (
          <div
            key={tool.id}
            onClick={() => onSelectTool(tool.id)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                onSelectTool(tool.id);
              }
            }}
            className="group relative p-6 rounded-2xl bg-[#141518] hover:bg-[#191b22] border border-zinc-800/80 hover:border-amber-500/60 transition-all duration-200 cursor-pointer flex flex-col justify-between shadow-lg hover:shadow-amber-500/5 hover:-translate-y-1"
          >
            {/* Top row: Icon box and Title */}
            <div>
              <div className="flex items-start gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-center text-amber-400 group-hover:scale-105 group-hover:border-amber-500/50 group-hover:bg-amber-500/10 transition-all shrink-0">
                  {tool.icon}
                </div>

                <div className="space-y-1">
                  <h3 className="font-bold text-zinc-100 text-base leading-snug group-hover:text-amber-400 transition-colors">
                    {tool.name}
                  </h3>
                </div>
              </div>

              {/* Description */}
              <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed mt-4">
                {tool.description}
              </p>

              {/* Key Highlights */}
              <div className="mt-4 pt-3 border-t border-zinc-850/80 flex flex-wrap gap-1.5">
                {tool.features.map((feat) => (
                  <span
                    key={feat}
                    className="inline-flex items-center gap-1 text-[11px] text-zinc-400 font-mono bg-zinc-900 px-2 py-0.5 rounded-md border border-zinc-800"
                  >
                    <CheckCircle2 className="w-2.5 h-2.5 text-amber-400" />
                    {feat}
                  </span>
                ))}
              </div>
            </div>

            {/* Bottom row: Category Tag & Arrow */}
            <div className="mt-5 pt-4 border-t border-zinc-800/60 flex items-center justify-between">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-zinc-900 text-zinc-300 border border-zinc-800">
                {tool.tag}
              </span>

              <span className="text-xs font-semibold text-zinc-400 group-hover:text-amber-400 flex items-center gap-1 transition-colors">
                <span>Launch Tool</span>
                <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
              </span>
            </div>
          </div>
        ))}
      </div>

      {filteredTools.length === 0 && (
        <div className="text-center py-12 bg-zinc-900/40 rounded-2xl border border-zinc-800">
          <p className="text-sm text-zinc-400">No tools found matching &quot;{searchQuery}&quot;.</p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('All');
            }}
            className="mt-3 px-3 py-1.5 bg-amber-500 text-zinc-950 text-xs font-bold rounded-lg cursor-pointer"
          >
            Reset Filters
          </button>
        </div>
      )}
    </div>
  );
};
