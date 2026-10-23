export type RegionCode = 'KH' | 'SEA' | 'TH' | 'VN' | 'US' | 'GLOBAL';

export type ContentCategory =
  | 'all'
  | 'entertainment'
  | 'business'
  | 'tech'
  | 'music'
  | 'food'
  | 'lifestyle'
  | 'education';

export interface TrendingHashtag {
  id: string;
  tag: string;
  category: ContentCategory;
  region: RegionCode;
  postsCount: string;
  viewsCount: string;
  growthRate: string; // e.g., '+340%'
  viralityScore: number; // 1-100
  trendStatus: 'breakout' | 'rising' | 'peak' | 'evergreen';
  hookExample: string;
  suggestedNiche: string;
}

export interface TrendingSound {
  id: string;
  title: string;
  artist: string;
  duration: string;
  region: RegionCode;
  videoCount: string;
  growthRate: string;
  viralityStatus: 'breakout' | 'rising' | 'peak';
  genre: string;
  vibe: string;
  audioUrl?: string;
  recommendedDuration: string;
}

export interface HourlyAudienceData {
  hour: number; // 0-23
  dayOfWeek: number; // 0=Sunday, 1=Monday, ... 6=Saturday
  activityScore: number; // 0-100
  viralMultiplier: number; // e.g. 1.2x, 2.5x
}

export interface BestTimeRecommendation {
  dayName: string;
  bestSlots: {
    timeRange: string;
    expectedReach: string;
    description: string;
  }[];
  peakHour: string;
  overallRating: 'Super Hot' | 'High' | 'Moderate';
}

export interface TikTokAccountOverview {
  username: string;
  displayName: string;
  followerCount: number;
  likesCount: number;
  videoCount: number;
  profileViews28d: number;
  videoViews28d: number;
  shares28d: number;
  averageWatchTimeSec: number;
  retentionRate3s: number; // percentage
}
