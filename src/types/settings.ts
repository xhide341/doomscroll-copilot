export type PlatformType = 'tiktok' | 'instagram' | 'youtube' | 'idle';

export interface PlatformConfig {
  tiktok: boolean;
  instagram: boolean;
  youtube: boolean;
}

export interface AutoPilotSettings {
  masterEnabled: boolean;
  autoLikeEnabled: boolean;
  confidenceThreshold: number; // 0 - 100
  dwellCap: number; // in seconds (5 - 30)
  earlySkipDelay: number; // in seconds (1.0 - 5.0)
  platforms: PlatformConfig;
  targetKeywords: string[];
  blacklistKeywords: string[];
}

export interface MetricsData {
  scrolledCount: number;
  likedCount: number;
  skippedCount: number;
}

export interface TelemetryData {
  platform: PlatformType;
  creator: string;
  sound: string;
  caption: string;
  tags: string[];
  matchedTags: string[];
  score: number; // 0 - 100
  action: 'watching' | 'liked' | 'skipping' | 'idle';
  countdown?: number | null;
}

export const DEFAULT_TARGET_KEYWORDS: string[] = [
  'baddie',
  'fitcheck',
  'ootd',
  'grwm',
  'slay',
  'model',
  'glam',
  'glowup',
  'makeup',
  'gymgirl',
  'hotgirl',
  'fashion',
  'cleangirl',
];

export const DEFAULT_BLACKLIST_KEYWORDS: string[] = [
  'gaming',
  'minecraft',
  'subwaysurfers',
  'gta',
  'podcast',
  'coding',
  'news',
];

export const DEFAULT_SETTINGS: AutoPilotSettings = {
  masterEnabled: false,
  autoLikeEnabled: true,
  confidenceThreshold: 50,
  dwellCap: 15,
  earlySkipDelay: 2.5,
  platforms: {
    tiktok: true,
    instagram: true,
    youtube: true,
  },
  targetKeywords: DEFAULT_TARGET_KEYWORDS,
  blacklistKeywords: DEFAULT_BLACKLIST_KEYWORDS,
};

export const DEFAULT_METRICS: MetricsData = {
  scrolledCount: 0,
  likedCount: 0,
  skippedCount: 0,
};

export const DEFAULT_TELEMETRY: TelemetryData = {
  platform: 'idle',
  creator: '@waiting_for_feed',
  sound: 'No active audio detected',
  caption: 'Open TikTok, Instagram Reels, or YouTube Shorts to engage co-pilot.',
  tags: [],
  matchedTags: [],
  score: 0,
  action: 'idle',
  countdown: null,
};
