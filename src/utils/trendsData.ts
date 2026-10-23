import {
  BestTimeRecommendation,
  HourlyAudienceData,
  RegionCode,
  TrendingHashtag,
  TrendingSound,
} from '../types/trends';

export const REGIONS: { code: RegionCode; label: string; flag: string }[] = [
  { code: 'KH', label: 'Cambodia', flag: '🇰🇭' },
  { code: 'SEA', label: 'Southeast Asia', flag: '🌏' },
  { code: 'TH', label: 'Thailand', flag: '🇹🇭' },
  { code: 'VN', label: 'Vietnam', flag: '🇻🇳' },
  { code: 'US', label: 'United States', flag: '🇺🇸' },
  { code: 'GLOBAL', label: 'Global Trends', flag: '🌐' },
];

export const MOCK_TRENDING_HASHTAGS: TrendingHashtag[] = [
  // Cambodia Trends
  {
    id: 'tag-kh-1',
    tag: '#cambodiatiktok',
    category: 'entertainment',
    region: 'KH',
    postsCount: '3.8M',
    viewsCount: '12.4B',
    growthRate: '+240%',
    viralityScore: 98,
    trendStatus: 'peak',
    hookExample: 'រឿងពិតមួយដែលមនុស្សភាគច្រើនមិនធ្លាប់ដឹងនៅស្រុកខ្មែរ...',
    suggestedNiche: 'Daily Vlog, Cultural, Comedy',
  },
  {
    id: 'tag-kh-2',
    tag: '#khmertok',
    category: 'entertainment',
    region: 'KH',
    postsCount: '2.1M',
    viewsCount: '6.9B',
    growthRate: '+195%',
    viralityScore: 94,
    trendStatus: 'rising',
    hookExample: 'មើលដល់ចប់ទើបដឹងថាមានរឿងអីកើតឡើង!',
    suggestedNiche: 'Comedy, Funny Reactions, Storytelling',
  },
  {
    id: 'tag-kh-3',
    tag: '#businesskhmer',
    category: 'business',
    region: 'KH',
    postsCount: '480K',
    viewsCount: '1.2B',
    growthRate: '+310%',
    viralityScore: 92,
    trendStatus: 'breakout',
    hookExample: '៣ ចំណុចដែលអ្នករកស៊ីអនឡាញថ្មីៗតែងតែខាតលុយ...',
    suggestedNiche: 'E-commerce, Startup, Marketing Strategy',
  },
  {
    id: 'tag-kh-4',
    tag: '#foodiekhtiktok',
    category: 'food',
    region: 'KH',
    postsCount: '1.4M',
    viewsCount: '4.8B',
    growthRate: '+180%',
    viralityScore: 89,
    trendStatus: 'rising',
    hookExample: 'កន្លែងញ៉ាំប្លែកៗនៅភ្នំពេញ តម្លៃសមរម្យ រសជាតិឆ្ងាញ់កប់!',
    suggestedNiche: 'Street Food, Restaurant Reviews, Cooking',
  },
  {
    id: 'tag-kh-5',
    tag: '#khmertechnology',
    category: 'tech',
    region: 'KH',
    postsCount: '320K',
    viewsCount: '890M',
    growthRate: '+275%',
    viralityScore: 88,
    trendStatus: 'rising',
    hookExample: 'មុខងារសម្ងាត់លើទូរស័ព្ទដែល ៩០% នៃអ្នកប្រើមិនដឹង...',
    suggestedNiche: 'Smartphones, AI Tools, Tech Tips',
  },
  {
    id: 'tag-kh-6',
    tag: '#khmereducation',
    category: 'education',
    region: 'KH',
    postsCount: '650K',
    viewsCount: '1.9B',
    growthRate: '+140%',
    viralityScore: 84,
    trendStatus: 'evergreen',
    hookExample: 'វិធីរៀនភាសាអង់គ្លេសដោយខ្លួនឯងត្រឹម ៣ ខែ និយាយបានយ៉ាងរលូន...',
    suggestedNiche: 'English learning, Motivation, Book Summaries',
  },

  // Southeast Asia Trends
  {
    id: 'tag-sea-1',
    tag: '#seasiacreators',
    category: 'entertainment',
    region: 'SEA',
    postsCount: '5.2M',
    viewsCount: '18.7B',
    growthRate: '+380%',
    viralityScore: 97,
    trendStatus: 'peak',
    hookExample: 'Wait until the end... you will not believe this!',
    suggestedNiche: 'Viral Challenges, Visual Effects, Duets',
  },
  {
    id: 'tag-sea-2',
    tag: '#capcut_edit',
    category: 'tech',
    region: 'SEA',
    postsCount: '14.8M',
    viewsCount: '48.2B',
    growthRate: '+420%',
    viralityScore: 99,
    trendStatus: 'peak',
    hookExample: 'Use this 1-click CapCut template before it trends out!',
    suggestedNiche: 'Templates, Cinematography, Travel Montages',
  },
  {
    id: 'tag-sea-3',
    tag: '#aitools2026',
    category: 'tech',
    region: 'SEA',
    postsCount: '890K',
    viewsCount: '3.4B',
    growthRate: '+520%',
    viralityScore: 96,
    trendStatus: 'breakout',
    hookExample: 'Top 3 AI tools that will replace 10 hours of video editing...',
    suggestedNiche: 'AI workflow, Content Creation, Productivity',
  },

  // Global Trends
  {
    id: 'tag-gl-1',
    tag: '#viralvideo',
    category: 'entertainment',
    region: 'GLOBAL',
    postsCount: '84.2M',
    viewsCount: '290B',
    growthRate: '+150%',
    viralityScore: 99,
    trendStatus: 'evergreen',
    hookExample: 'This took 48 hours to edit, please don’t let it flop!',
    suggestedNiche: 'High Production, Satisfying, Experiments',
  },
  {
    id: 'tag-gl-2',
    tag: '#marketingtips',
    category: 'business',
    region: 'GLOBAL',
    postsCount: '3.9M',
    viewsCount: '14.2B',
    growthRate: '+260%',
    viralityScore: 91,
    trendStatus: 'rising',
    hookExample: 'The psychological hack brands use to get you to buy...',
    suggestedNiche: 'Psychology, Sales, Growth Marketing',
  },
  {
    id: 'tag-gl-3',
    tag: '#contentcreator',
    category: 'business',
    region: 'GLOBAL',
    postsCount: '9.4M',
    viewsCount: '32.1B',
    growthRate: '+210%',
    viralityScore: 93,
    trendStatus: 'rising',
    hookExample: 'How I went from 0 to 100k followers without paid ads...',
    suggestedNiche: 'Growth case studies, Algorithm breakdowns',
  },
];

export const MOCK_TRENDING_SOUNDS: TrendingSound[] = [
  {
    id: 'snd-1',
    title: 'Phum Romduol Beat (Club Remix)',
    artist: 'DJ Khmer Viral',
    duration: '0:28',
    region: 'KH',
    videoCount: '184.2K',
    growthRate: '+480%',
    viralityStatus: 'breakout',
    genre: 'Remix / Dance Beat',
    vibe: 'High Energy, Trend Dance',
    recommendedDuration: '7-15s',
  },
  {
    id: 'snd-2',
    title: 'Nostalgic Acoustic Guitar Melody',
    artist: 'Khmer Acoustic Chill',
    duration: '0:35',
    region: 'KH',
    videoCount: '96.5K',
    growthRate: '+220%',
    viralityStatus: 'rising',
    genre: 'Acoustic / Emotional',
    vibe: 'Storytelling, Deep Quotes, Sunset Vlog',
    recommendedDuration: '15-30s',
  },
  {
    id: 'snd-3',
    title: 'Fast Bass Drop Transition',
    artist: 'SoundFX Producer',
    duration: '0:12',
    region: 'SEA',
    videoCount: '412.8K',
    growthRate: '+310%',
    viralityStatus: 'peak',
    genre: 'Electronic / Drop',
    vibe: 'Before/After Transformation, Tech Reveal',
    recommendedDuration: '5-12s',
  },
  {
    id: 'snd-4',
    title: 'Upbeat Lo-fi Study Groove',
    artist: 'Chillhop Lab',
    duration: '0:45',
    region: 'GLOBAL',
    videoCount: '890.1K',
    growthRate: '+160%',
    viralityStatus: 'rising',
    genre: 'Lo-Fi / Background',
    vibe: 'Educational, Coding, Cooking, Talking Head',
    recommendedDuration: '30-60s',
  },
  {
    id: 'snd-5',
    title: 'Dramatic Suspense Hit (Cinematic)',
    artist: 'Epic Soundtrack FX',
    duration: '0:18',
    region: 'GLOBAL',
    videoCount: '520.4K',
    growthRate: '+390%',
    viralityStatus: 'breakout',
    genre: 'Cinematic / Suspense',
    vibe: 'Mystery, Conspiracy, Plot Twist',
    recommendedDuration: '10-20s',
  },
];

/**
 * Generate 7 days x 24 hours heatmap data simulating audience engagement
 */
export function generateAudienceHeatmap(): HourlyAudienceData[] {
  const data: HourlyAudienceData[] = [];
  const days = [0, 1, 2, 3, 4, 5, 6];

  for (const day of days) {
    for (let hour = 0; hour < 24; hour++) {
      let baseActivity = 15;

      // Late night: 00:00 - 05:00 (Low)
      if (hour >= 0 && hour <= 5) {
        baseActivity = 10 + Math.random() * 12;
      }
      // Morning commute: 06:00 - 08:30 (Moderate)
      else if (hour >= 6 && hour <= 8) {
        baseActivity = 45 + Math.random() * 15;
      }
      // Morning work: 09:00 - 11:00 (Medium)
      else if (hour >= 9 && hour <= 11) {
        baseActivity = 55 + Math.random() * 15;
      }
      // Lunch break peak: 11:30 - 13:30 (HIGH PEAK)
      else if (hour >= 12 && hour <= 13) {
        baseActivity = 82 + Math.random() * 12;
      }
      // Afternoon slump: 14:00 - 16:30 (Moderate)
      else if (hour >= 14 && hour <= 16) {
        baseActivity = 58 + Math.random() * 14;
      }
      // Evening return: 17:00 - 18:30 (High)
      else if (hour >= 17 && hour <= 18) {
        baseActivity = 75 + Math.random() * 12;
      }
      // PRIME TIME PEAK: 19:00 - 22:30 (SUPER HOT)
      else if (hour >= 19 && hour <= 22) {
        baseActivity = 88 + Math.random() * 11;
        // Weekends have even higher prime time
        if (day === 5 || day === 6 || day === 0) {
          baseActivity = Math.min(100, baseActivity + 5);
        }
      }
      // Winding down: 23:00 (Moderate-High)
      else {
        baseActivity = 60 + Math.random() * 10;
      }

      const score = Math.round(baseActivity);
      const multiplier = Number((1 + (score / 100) * 1.8).toFixed(1));

      data.push({
        hour,
        dayOfWeek: day,
        activityScore: score,
        viralMultiplier: multiplier,
      });
    }
  }

  return data;
}

export const BEST_POSTING_RECOMMENDATIONS: BestTimeRecommendation[] = [
  {
    dayName: 'Monday',
    peakHour: '8:00 PM',
    overallRating: 'High',
    bestSlots: [
      {
        timeRange: '12:00 PM - 1:00 PM',
        expectedReach: '85%',
        description: 'Lunch break scrolling — keep it short and snackable (under 15s).',
      },
      {
        timeRange: '7:30 PM - 9:30 PM',
        expectedReach: '92%',
        description: 'Evening leisure time — best for educational or storytelling videos.',
      },
    ],
  },
  {
    dayName: 'Tuesday',
    peakHour: '8:30 PM',
    overallRating: 'High',
    bestSlots: [
      {
        timeRange: '11:30 AM - 1:30 PM',
        expectedReach: '88%',
        description: 'Midday entertainment & trending meme videos perform great.',
      },
      {
        timeRange: '7:45 PM - 9:45 PM',
        expectedReach: '94%',
        description: 'Prime evening slot with strong algorithmic retention.',
      },
    ],
  },
  {
    dayName: 'Wednesday',
    peakHour: '8:00 PM',
    overallRating: 'Super Hot',
    bestSlots: [
      {
        timeRange: '12:00 PM - 1:30 PM',
        expectedReach: '91%',
        description: 'Mid-week peak engagement — high sharing rate across TikTok & Reels.',
      },
      {
        timeRange: '7:00 PM - 9:30 PM',
        expectedReach: '98%',
        description: 'Top viral slot of the week! Best for your highest effort content.',
      },
    ],
  },
  {
    dayName: 'Thursday',
    peakHour: '8:15 PM',
    overallRating: 'High',
    bestSlots: [
      {
        timeRange: '12:30 PM - 2:00 PM',
        expectedReach: '86%',
        description: 'Lunch & afternoon break engagement.',
      },
      {
        timeRange: '7:30 PM - 9:30 PM',
        expectedReach: '93%',
        description: 'Steady evening viewership.',
      },
    ],
  },
  {
    dayName: 'Friday',
    peakHour: '7:30 PM',
    overallRating: 'Super Hot',
    bestSlots: [
      {
        timeRange: '11:00 AM - 1:00 PM',
        expectedReach: '89%',
        description: 'Pre-weekend excitement & dining/travel recommendations.',
      },
      {
        timeRange: '6:30 PM - 9:00 PM',
        expectedReach: '99%',
        description: 'Massive organic reach — best for lifestyle, food, and music.',
      },
    ],
  },
  {
    dayName: 'Saturday',
    peakHour: '1:00 PM & 9:00 PM',
    overallRating: 'Super Hot',
    bestSlots: [
      {
        timeRange: '10:30 AM - 2:00 PM',
        expectedReach: '94%',
        description: 'Morning & afternoon leisure time — longer format videos (30-60s) shine.',
      },
      {
        timeRange: '8:00 PM - 10:30 PM',
        expectedReach: '96%',
        description: 'Night entertainment, comedy, and trending dance challenges.',
      },
    ],
  },
  {
    dayName: 'Sunday',
    peakHour: '8:00 PM',
    overallRating: 'Super Hot',
    bestSlots: [
      {
        timeRange: '9:30 AM - 12:00 PM',
        expectedReach: '88%',
        description: 'Sunday morning coffee & relaxed browsing.',
      },
      {
        timeRange: '7:00 PM - 9:45 PM',
        expectedReach: '97%',
        description: 'Peak preparation for the week — motivational, tips, and comedy.',
      },
    ],
  },
];

export const PYTHON_SCRAPER_SCRIPT = `# ==============================================================
# TikTok & Reels Viral Trends, Hashtags & Sounds Scraper (Python)
# Extract trending sounds, video counts, and hashtags in your region
# ==============================================================
# Requirements:
#   pip install playwright pandas
#   playwright install chromium
# Run:
#   python tiktok_trends_scraper.py
# ==============================================================

import asyncio
import json
import pandas as pd
from playwright.async_api import async_playwright

REGION = "KH" # "KH", "TH", "VN", "US", "GLOBAL"
CATEGORY = "all"

async def scrape_trending_hashtags():
    print(f"🚀 Starting TikTok Creative Center Scraper for region: {REGION}...")
    
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
            locale="en-US"
        )
        page = await context.new_page()

        # Target: TikTok Creative Center Trending Hashtags & Audio
        url = f"https://ads.tiktok.com/business/creativecenter/inspiration/popular/hashtag/pc/en?countryCode={REGION}"
        print(f"Opening: {url}")
        
        await page.goto(url, wait_until="networkidle", timeout=30000)
        await page.wait_for_timeout(3000)

        # Extract hashtag items
        items = await page.eval_on_selector_all(
            ".card-item, tr.el-table__row, [class*='hashtag-item']",
            """nodes => nodes.map(n => ({
                tag: n.querySelector('[class*=\"title\"], [class*=\"name\"]')?.innerText?.trim() || '',
                posts: n.querySelector('[class*=\"post\"], [class*=\"count\"]')?.innerText?.trim() || '',
                trend: n.querySelector('[class*=\"rank\"], [class*=\"trend\"]')?.innerText?.trim() || ''
            })).filter(x => x.tag.length > 0)"""
        )

        print(f"✓ Extracted {len(items)} trending hashtags!")
        
        # Save results
        with open("tiktok_trending_results.json", "w", encoding="utf-8") as f:
            json.dump(items, f, ensure_ascii=False, indent=2)
            
        print("✓ Saved to tiktok_trending_results.json")
        await browser.close()

if __name__ == "__main__":
    asyncio.run(scrape_trending_hashtags())
`;

export const NODEJS_SCRAPER_SCRIPT = `/**
 * TikTok & Meta Reels Trending Scraper (Node.js)
 * Setup:
 *   npm install playwright
 *   npx playwright install chromium
 * Run:
 *   node tiktok_trends_scraper.js
 */
const { chromium } = require('playwright');
const fs = require('fs');

const REGION = 'KH'; // Change to KH, TH, VN, US, GLOBAL

async function main() {
  console.log(\`Fetching trending hashtags and viral sounds for region: \${REGION}...\`);
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
  });

  try {
    const url = \`https://ads.tiktok.com/business/creativecenter/inspiration/popular/hashtag/pc/en?countryCode=\${REGION}\`;
    await page.goto(url, { waitUntil: 'networkidle', timeout: 35000 });
    await page.waitForTimeout(3000);

    const trends = await page.evaluate(() => {
      const rows = document.querySelectorAll('tr.el-table__row, [class*="card-item"]');
      return Array.from(rows).map(row => ({
        tag: row.querySelector('[class*="title"], [class*="name"]')?.textContent?.trim() || '',
        volume: row.querySelector('[class*="post"], [class*="count"]')?.textContent?.trim() || '',
        status: 'Trending'
      })).filter(t => t.tag.length > 0);
    });

    console.log(\`Successfully scraped \${trends.length} hashtags!\`);
    fs.writeFileSync('tiktok_trends.json', JSON.stringify(trends, null, 2));
    console.log('Saved to tiktok_trends.json');
  } catch (err) {
    console.error('Scraper error:', err.message);
  } finally {
    await browser.close();
  }
}

main().catch(console.error);`;
