import type { AutoPilotSettings } from '../types/settings';
import type { VideoMetadata } from '../types/platform';

export interface EvaluationResult {
  score: number; // 0 - 100
  matchedTags: string[];
  isMatch: boolean;
  disqualified: boolean;
  isAd?: boolean;
}

export function evaluateVideo(
  metadata: VideoMetadata,
  settings: AutoPilotSettings,
): EvaluationResult {
  // If content is an ad / sponsored, instantly disqualify
  if (metadata.isAd) {
    return {
      score: 0,
      matchedTags: [],
      isMatch: false,
      disqualified: true,
      isAd: true,
    };
  }

  const normalizedTags = metadata.hashtags.map((t) =>
    t.toLowerCase().replace(/^#/, '').trim(),
  );

  const captionWords = metadata.caption
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);

  const allTokens = new Set([...normalizedTags, ...captionWords]);

  // 1. Check for blacklist / disqualifying keywords
  const blacklistMatches: string[] = [];
  for (const black of settings.blacklistKeywords) {
    const cleanBlack = black.toLowerCase().trim();
    if (cleanBlack && allTokens.has(cleanBlack)) {
      blacklistMatches.push(cleanBlack);
    }
  }

  if (blacklistMatches.length > 0) {
    return {
      score: 0,
      matchedTags: [],
      isMatch: false,
      disqualified: true,
    };
  }

  // 2. Score target keywords
  const matchedTags: string[] = [];
  let rawScore = 0;

  for (const target of settings.targetKeywords) {
    const cleanTarget = target.toLowerCase().trim();
    if (!cleanTarget) continue;

    if (normalizedTags.includes(cleanTarget)) {
      matchedTags.push(cleanTarget);
      rawScore += 35; // Hashtags carry high weight
    } else if (allTokens.has(cleanTarget)) {
      matchedTags.push(cleanTarget);
      rawScore += 20; // Words in caption carry moderate weight
    }
  }

  // Normalize score between 0 and 100
  const score = Math.min(100, Math.max(0, rawScore));
  const isMatch = score >= settings.confidenceThreshold && score > 0;

  return {
    score,
    matchedTags,
    isMatch,
    disqualified: false,
  };
}
