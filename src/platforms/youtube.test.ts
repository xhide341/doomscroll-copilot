import { beforeEach, describe, expect, it, vi } from 'vitest';
import { YouTubeAdapter } from './youtube';
import { resolveAdapter } from './index';
import { DEFAULT_SETTINGS } from '../types/settings';

describe('YouTubeAdapter', () => {
  let adapter: YouTubeAdapter;

  beforeEach(() => {
    document.body.innerHTML = '';
    adapter = new YouTubeAdapter();
    vi.restoreAllMocks();
  });

  describe('isMatch', () => {
    it('matches youtube shorts URLs', () => {
      expect(adapter.isMatch('https://www.youtube.com/shorts/1234567890')).toBe(
        true
      );
      expect(
        adapter.isMatch('https://youtube.com/shorts/dQw4w9WgXcQ?feature=share')
      ).toBe(true);
    });

    it('rejects non-shorts youtube URLs and other domains', () => {
      expect(
        adapter.isMatch('https://www.youtube.com/watch?v=1234567890')
      ).toBe(false);
      expect(adapter.isMatch('https://www.youtube.com/')).toBe(false);
      expect(adapter.isMatch('https://www.tiktok.com/@user/video/123')).toBe(
        false
      );
    });
  });

  describe('getActiveContainer and getActiveVideoElement', () => {
    it('finds the active ytd-reel-video-renderer container and its video element', () => {
      document.body.innerHTML = `
        <ytd-reel-video-renderer id="short-1"></ytd-reel-video-renderer>
        <ytd-reel-video-renderer id="short-2" is-active>
          <video src="blob:https://www.youtube.com/video-2"></video>
        </ytd-reel-video-renderer>
      `;

      const container = adapter.getActiveContainer();
      expect(container).not.toBeNull();
      expect(container?.id).toBe('short-2');

      const video = adapter.getActiveVideoElement();
      expect(video).not.toBeNull();
      expect(video?.getAttribute('src')).toBe(
        'blob:https://www.youtube.com/video-2'
      );
    });
  });

  describe('extractMetadata', () => {
    it('extracts creator, caption, hashtags, and sound title', () => {
      document.body.innerHTML = `
        <ytd-reel-video-renderer id="short-active" is-active>
          <ytd-reel-player-header-renderer>
            <div id="channel-name">baddie_queen</div>
            <h2 class="title">My new outfit #baddie #ootd for summer!</h2>
            <div id="sound-title">Trending Glam Audio</div>
          </ytd-reel-player-header-renderer>
          <a href="/hashtag/fashion">#fashion</a>
          <div id="description">Check out the full transformation #glowup</div>
        </ytd-reel-video-renderer>
      `;

      const metadata = adapter.extractMetadata();
      expect(metadata.creatorHandle).toBe('@baddie_queen');
      expect(metadata.caption).toBe('My new outfit #baddie #ootd for summer!');
      expect(metadata.soundTitle).toBe('Trending Glam Audio');
      expect(metadata.isAd).toBe(false);

      expect(metadata.hashtags).toContain('baddie');
      expect(metadata.hashtags).toContain('ootd');
      expect(metadata.hashtags).toContain('fashion');
      expect(metadata.hashtags).toContain('glowup');
    });
  });

  describe('isAd detection', () => {
    it('detects sponsored ad renderers', () => {
      document.body.innerHTML = `
        <ytd-reel-video-renderer id="ad-short" is-active>
          <ytd-ad-slot-renderer>Sponsored Content</ytd-ad-slot-renderer>
        </ytd-reel-video-renderer>
      `;

      expect(adapter.isAd()).toBe(true);
    });

    it('detects sponsored badges', () => {
      document.body.innerHTML = `
        <ytd-reel-video-renderer id="ad-short" is-active>
          <div class="badge-shape-wiz--ad">Sponsored</div>
        </ytd-reel-video-renderer>
      `;

      expect(adapter.isAd()).toBe(true);
    });

    it('returns false for organic content', () => {
      document.body.innerHTML = `
        <ytd-reel-video-renderer id="normal-short" is-active>
          <h2 class="title">Normal Video</h2>
        </ytd-reel-video-renderer>
      `;

      expect(adapter.isAd()).toBe(false);
    });
  });

  describe('isLiked and clickLike', () => {
    it('identifies unliked and liked states correctly', () => {
      document.body.innerHTML = `
        <ytd-reel-video-renderer is-active>
          <ytd-like-button-renderer id="like-renderer">
            <div id="like-button">
              <button aria-label="Like this video" aria-pressed="false"></button>
            </div>
          </ytd-like-button-renderer>
        </ytd-reel-video-renderer>
      `;

      expect(adapter.isLiked()).toBe(false);

      const btn = document.querySelector('button');
      btn?.setAttribute('aria-pressed', 'true');
      expect(adapter.isLiked()).toBe(true);
    });

    it('bypasses clickLike if user is signed out to prevent Google modal', async () => {
      document.body.innerHTML = `
        <div id="masthead">
          <a href="https://accounts.google.com/signin">Sign in</a>
        </div>
        <ytd-reel-video-renderer is-active>
          <like-button-view-model>
            <button aria-label="Like this video"></button>
          </like-button-view-model>
        </ytd-reel-video-renderer>
      `;

      const btn = document.querySelector<HTMLButtonElement>(
        'like-button-view-model button'
      )!;
      const clickSpy = vi.spyOn(btn, 'click');

      const result = await adapter.clickLike();
      expect(result).toBe(false);
      expect(clickSpy).not.toHaveBeenCalled();
    });

    it('clicks like button when signed in', async () => {
      document.body.innerHTML = `
        <div id="masthead">
          <button id="avatar-btn"></button>
        </div>
        <ytd-reel-video-renderer is-active>
          <like-button-view-model>
            <button aria-label="Like this video"></button>
          </like-button-view-model>
        </ytd-reel-video-renderer>
      `;

      const btn = document.querySelector<HTMLButtonElement>(
        'like-button-view-model button'
      )!;
      const clickSpy = vi.spyOn(btn, 'click');

      const result = await adapter.clickLike();
      expect(result).toBe(true);
      expect(clickSpy).toHaveBeenCalled();
    });
  });

  describe('scrollNext', () => {
    it('clicks YouTube native navigation button if present', async () => {
      document.body.innerHTML = `
        <div id="navigation-button-down">
          <button aria-label="Next video"></button>
        </div>
        <ytd-reel-video-renderer is-active></ytd-reel-video-renderer>
      `;

      const nextBtn = document.querySelector<HTMLButtonElement>(
        '#navigation-button-down button'
      )!;
      const clickSpy = vi.spyOn(nextBtn, 'click');

      await adapter.scrollNext();
      expect(clickSpy).toHaveBeenCalled();
    });

    it('dispatches synthetic keyboard events if button not present', async () => {
      document.body.innerHTML = `<ytd-reel-video-renderer is-active></ytd-reel-video-renderer>`;

      const dispatchedKeys: string[] = [];
      const listener = (e: KeyboardEvent) => dispatchedKeys.push(e.key);
      window.addEventListener('keydown', listener);

      await adapter.scrollNext();
      expect(dispatchedKeys).toContain('ArrowDown');
      expect(dispatchedKeys).toContain('j');

      window.removeEventListener('keydown', listener);
    });
  });
});

describe('resolveAdapter', () => {
  it('resolves YouTubeAdapter for shorts URLs and TikTokAdapter for tiktok URLs', () => {
    const ytAdapter = resolveAdapter('https://www.youtube.com/shorts/xyz123');
    expect(ytAdapter?.platformId).toBe('youtube');

    const ttAdapter = resolveAdapter('https://www.tiktok.com/@user/video/999');
    expect(ttAdapter?.platformId).toBe('tiktok');

    const noneAdapter = resolveAdapter('https://www.youtube.com/watch?v=123');
    expect(noneAdapter).toBeNull();
  });

  it('respects platform toggles from settings', () => {
    const disabledYtSettings = {
      ...DEFAULT_SETTINGS,
      platforms: {
        ...DEFAULT_SETTINGS.platforms,
        youtube: false,
      },
    };

    const result = resolveAdapter(
      'https://www.youtube.com/shorts/xyz123',
      disabledYtSettings
    );
    expect(result).toBeNull();
  });
});
