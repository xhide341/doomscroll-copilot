import { defineContentScript } from '#imports';
import { evaluateVideo } from '../engine/evaluator';
import { resolveAdapter } from '../platforms';
import type { PlatformAdapter } from '../types/platform';
import { DEFAULT_TELEMETRY, type TelemetryData } from '../types/settings';
import {
  incrementPlatformMetrics,
  setPlatformTelemetry,
  settingsItem,
  tiktokTelemetryItem,
  youtubeTelemetryItem,
} from '../utils/storage';

export default defineContentScript({
  matches: ['*://*.tiktok.com/*', '*://*.youtube.com/*'],
  runAt: 'document_idle',
  main() {
    const isTikTok = window.location.hostname.includes('tiktok.com');
    const isYouTube = window.location.hostname.includes('youtube.com');
    const hostPlatform = isTikTok ? 'tiktok' : isYouTube ? 'youtube' : null;

    if (!hostPlatform) return;

    console.log(
      `[Doomscroll Co-Pilot] Content script active for dedicated platform: ${hostPlatform.toUpperCase()}`
    );

    let currentVideoEl: HTMLVideoElement | null = null;
    let lastEvaluatedKey = '';
    let lastDiagnosticTime = 0;
    let scrollTimer: number | null = null;
    let activeVideoCleanup: (() => void) | null = null;
    let hasScrolledCurrentVideo = false;

    const clearCadence = () => {
      if (scrollTimer !== null) {
        window.clearTimeout(scrollTimer);
        scrollTimer = null;
      }
      if (activeVideoCleanup) {
        activeVideoCleanup();
        activeVideoCleanup = null;
      }
    };

    const triggerScrollNext = async (
      adapter: PlatformAdapter,
      reason: 'dwell' | 'ended' | 'skip' | 'ad'
    ) => {
      if (hasScrolledCurrentVideo) return;
      hasScrolledCurrentVideo = true;
      clearCadence();

      console.log(
        `%c[Doomscroll Co-Pilot] 🚀 Advancing to next video (${reason}) [${hostPlatform.toUpperCase()}]`,
        'color: #10b981; font-weight: bold;'
      );

      await adapter.scrollNext();
      const isSkipOrAd = reason === 'skip' || reason === 'ad';
      await incrementPlatformMetrics(hostPlatform, {
        scrolled: true,
        skipped: isSkipOrAd,
      });
    };

    const checkActiveVideo = async () => {
      const settings = await settingsItem.getValue();
      const adapter = resolveAdapter(window.location.href, settings);

      // If user is on host platform but outside active short-form feed (e.g. YouTube homepage or watch page)
      if (!adapter) {
        if (hostPlatform === 'youtube') {
          const currentYt = await youtubeTelemetryItem.getValue();
          if (currentYt.action !== 'idle') {
            clearCadence();
            currentVideoEl = null;
            lastEvaluatedKey = '';
            await youtubeTelemetryItem.setValue({
              ...DEFAULT_TELEMETRY,
              platform: 'youtube',
              caption:
                'Navigate to YouTube Shorts (/shorts) to activate co-pilot.',
              action: 'idle',
            });
          }
        } else if (hostPlatform === 'tiktok') {
          const currentTt = await tiktokTelemetryItem.getValue();
          if (currentTt.action !== 'idle') {
            clearCadence();
            currentVideoEl = null;
            lastEvaluatedKey = '';
            await tiktokTelemetryItem.setValue({
              ...DEFAULT_TELEMETRY,
              platform: 'tiktok',
              action: 'idle',
            });
          }
        }
        return;
      }

      const activeVideo = adapter.getActiveVideoElement();
      const activeContainer = adapter.getActiveContainer();

      if (!activeVideo && !activeContainer) {
        const now = Date.now();
        if (now - lastDiagnosticTime > 2500) {
          lastDiagnosticTime = now;
          console.warn(
            `%c[Doomscroll Co-Pilot] ❌ No active video found on ${hostPlatform.toUpperCase()}`,
            'color: #f87171; font-weight: bold;',
            { currentUrl: window.location.href }
          );
        }
        return;
      }

      // Unique identifier for current video clip
      const videoKey = activeVideo
        ? activeVideo.currentSrc ||
          activeVideo.src ||
          `${activeVideo.getBoundingClientRect().top}`
        : activeContainer?.id ||
          activeContainer?.getAttribute('video-id') ||
          'active-container';

      // If a new video clip is in viewport
      if (activeVideo !== currentVideoEl || videoKey !== lastEvaluatedKey) {
        clearCadence();
        hasScrolledCurrentVideo = false;
        currentVideoEl = activeVideo;
        lastEvaluatedKey = videoKey;

        const metadata = adapter.extractMetadata();
        const evaluation = evaluateVideo(metadata, settings);
        const liked = adapter.isLiked();

        const action: TelemetryData['action'] = liked
          ? 'liked'
          : evaluation.isMatch
            ? 'watching'
            : 'skipping';

        console.log(
          `%c[Doomscroll Co-Pilot] 🎬 VIDEO DETECTED [${hostPlatform.toUpperCase()}]`,
          'background: #4f46e5; color: #ffffff; padding: 2px 8px; border-radius: 4px; font-weight: bold;',
          {
            platform: hostPlatform,
            creator: metadata.creatorHandle,
            sound: metadata.soundTitle,
            tags: metadata.hashtags,
            score: `${evaluation.score}%`,
            isMatch: evaluation.isMatch,
            action,
            masterEnabled: settings.masterEnabled,
          }
        );

        const telemetry: TelemetryData = {
          platform: hostPlatform,
          creator: metadata.creatorHandle,
          sound: metadata.soundTitle,
          caption: metadata.caption,
          tags: metadata.hashtags,
          matchedTags: evaluation.matchedTags,
          score: evaluation.score,
          action,
        };

        // Write ONLY to this platform's dedicated telemetry
        await setPlatformTelemetry(hostPlatform, telemetry);

        // Standby check
        if (!settings.masterEnabled) {
          console.log(
            `%c[Doomscroll Co-Pilot] ⏸️ Auto-Pilot is STANDBY on ${hostPlatform.toUpperCase()}`,
            'color: #94a3b8; font-style: italic;'
          );
          return;
        }

        // --- Cadence Execution ---
        if (evaluation.isAd) {
          console.log(
            `%c[Doomscroll Co-Pilot] 🛑 SPONSORED AD DETECTED [${hostPlatform.toUpperCase()}]! Fast-skipping in 0.5s...`,
            'background: #dc2626; color: white; padding: 2px 8px; border-radius: 4px; font-weight: bold;'
          );

          scrollTimer = window.setTimeout(() => {
            void triggerScrollNext(adapter, 'ad');
          }, 500);
        } else if (evaluation.isMatch) {
          // 1. Auto-Like if enabled and not already liked
          if (settings.autoLikeEnabled && !liked) {
            void adapter.clickLike().then((didLike) => {
              if (didLike) {
                console.log(
                  `%c[Doomscroll Co-Pilot] ❤️ Target Matched! Auto-liked clip on ${hostPlatform.toUpperCase()}.`,
                  'color: #ec4899; font-weight: bold;'
                );
                void incrementPlatformMetrics(hostPlatform, { liked: true });
              }
            });
          }

          // 2. Watch cadence: natural completion or dwell cap (whichever comes first)
          const dwellSec = settings.dwellCap || 15;
          console.log(
            `%c[Doomscroll Co-Pilot] ⏳ Target Match [${hostPlatform.toUpperCase()}]! Watching (dwell cap: ${dwellSec}s)...`,
            'color: #a855f7; font-weight: bold;'
          );

          if (activeVideo) {
            const onTimeUpdate = () => {
              if (
                activeVideo.duration &&
                activeVideo.currentTime >=
                  Math.max(0, activeVideo.duration - 0.5)
              ) {
                void triggerScrollNext(adapter, 'ended');
              }
            };
            const onEnded = () => {
              void triggerScrollNext(adapter, 'ended');
            };

            activeVideo.addEventListener('timeupdate', onTimeUpdate);
            activeVideo.addEventListener('ended', onEnded);

            activeVideoCleanup = () => {
              activeVideo.removeEventListener('timeupdate', onTimeUpdate);
              activeVideo.removeEventListener('ended', onEnded);
            };
          }

          scrollTimer = window.setTimeout(() => {
            void triggerScrollNext(adapter, 'dwell');
          }, dwellSec * 1000);
        } else {
          // 3. Early skip non-match
          const skipSec = settings.earlySkipDelay || 2.5;
          console.log(
            `%c[Doomscroll Co-Pilot] ⏩ Non-matching clip [${hostPlatform.toUpperCase()}]. Early-skipping in ${skipSec}s...`,
            'color: #f59e0b; font-weight: bold;'
          );

          scrollTimer = window.setTimeout(() => {
            void triggerScrollNext(adapter, 'skip');
          }, skipSec * 1000);
        }
      }
    };

    // Watch live setting updates from popup
    settingsItem.watch((newSettings) => {
      if (!newSettings.masterEnabled) {
        clearCadence();
        console.log(
          `%c[Doomscroll Co-Pilot] ⏸️ Master Auto-Pilot turned OFF on ${hostPlatform.toUpperCase()}. Pending actions cancelled.`,
          'color: #94a3b8;'
        );
      } else {
        console.log(
          `%c[Doomscroll Co-Pilot] ▶️ Master Auto-Pilot turned ON on ${hostPlatform.toUpperCase()}. Auto-scrolling active!`,
          'color: #10b981; font-weight: bold;'
        );
        lastEvaluatedKey = ''; // Force re-evaluation with auto-pilot active
        void checkActiveVideo();
      }
    });

    // YouTube SPA navigation listeners
    if (isYouTube) {
      window.addEventListener('yt-navigate-finish', () => {
        lastEvaluatedKey = '';
        void checkActiveVideo();
      });
    }
    window.addEventListener('popstate', () => {
      lastEvaluatedKey = '';
      void checkActiveVideo();
    });

    // Regular polling interval to detect viewport transitions
    setInterval(checkActiveVideo, 500);

    // Scroll listener for immediate viewport check
    window.addEventListener(
      'scroll',
      () => {
        void checkActiveVideo();
      },
      { passive: true }
    );
  },
});
