import { describe, expect, it } from 'vitest';
import { evaluateVideo } from './evaluator';
import { DEFAULT_SETTINGS } from '../types/settings';
import type { VideoMetadata } from '../types/platform';

describe('evaluateVideo with YouTube and TikTok metadata', () => {
  it('identifies target keywords from hashtags and caption with scoring above threshold', () => {
    const metadata: VideoMetadata = {
      creatorHandle: '@fashion_daily',
      caption: 'Summer style inspo for girls #ootd #baddie',
      hashtags: ['ootd', 'baddie', 'glam'],
      soundTitle: 'Original Audio',
    };

    const result = evaluateVideo(metadata, DEFAULT_SETTINGS);
    expect(result.isMatch).toBe(true);
    expect(result.disqualified).toBe(false);
    expect(result.score).toBeGreaterThanOrEqual(
      DEFAULT_SETTINGS.confidenceThreshold
    );
    expect(result.matchedTags).toContain('ootd');
    expect(result.matchedTags).toContain('baddie');
    expect(result.matchedTags).toContain('glam');
  });

  it('disqualifies blacklisted content even if target keywords are present', () => {
    const metadata: VideoMetadata = {
      creatorHandle: '@gamer_boy',
      caption: 'Playing Minecraft with aesthetic mod #ootd #minecraft',
      hashtags: ['ootd', 'minecraft'],
      soundTitle: 'Game Audio',
    };

    const result = evaluateVideo(metadata, DEFAULT_SETTINGS);
    expect(result.isMatch).toBe(false);
    expect(result.disqualified).toBe(true);
    expect(result.score).toBe(0);
  });

  it('disqualifies and flags sponsored ad clips', () => {
    const metadata: VideoMetadata = {
      creatorHandle: '@sponsored_brand',
      caption: 'Check out our new makeup line #makeup #glam',
      hashtags: ['makeup', 'glam'],
      soundTitle: 'Commercial Audio',
      isAd: true,
    };

    const result = evaluateVideo(metadata, DEFAULT_SETTINGS);
    expect(result.isMatch).toBe(false);
    expect(result.disqualified).toBe(true);
    expect(result.isAd).toBe(true);
    expect(result.score).toBe(0);
  });
});
