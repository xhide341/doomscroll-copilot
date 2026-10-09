import { defineContentScript } from '#imports';
import { evaluateVideo } from '../engine/evaluator';
import { TikTokAdapter } from '../platforms/tiktok';
import type { TelemetryData } from '../types/settings';
import { metricsItem, settingsItem, telemetryItem } from '../utils/storage';

export default defineContentScript({
  matches: ['*://*.tiktok.com/*'],
  runAt: 'document_idle',
  main() {
    console.log('[Doomscroll Co-Pilot] TikTok content script active');
    const adapter = new TikTokAdapter();
    let currentVideoEl: HTMLVideoElement | null = null;
    let lastEvaluatedKey = '';
    let lastDiagnosticTime = 0;
    let scrollTimer: number | null = null;

    const clearScrollTimer = () => {
      if (scrollTimer !== null) {
        window.clearTimeout(scrollTimer);
        scrollTimer = null;
      }
    };

    const checkActiveVideo = async () => {
      const activeVideo = adapter.getActiveVideoElement();
      const activeContainer = adapter.getActiveContainer();

      if (!activeVideo && !activeContainer) {
        const now = Date.now();
        if (now - lastDiagnosticTime > 2000) {
          lastDiagnosticTime = now;
          const cardsCount = document.querySelectorAll('[id^="media-card-"]').length;
          const videoCount = document.querySelectorAll('video').length;
          console.warn(
            '%c[Doomscroll Co-Pilot] ❌ NO VIDEO DETECTED in viewport',
            'color: #f87171; font-weight: bold;',
            {
              mediaCardsInDOM: cardsCount,
              videoElementsInDOM: videoCount,
              currentUrl: window.location.href,
            },
          );
        }
        return;
      }

      // Identify video uniquely by source src, video element, or container ID
      const videoKey = activeVideo
        ? (activeVideo.currentSrc || activeVideo.src || `${activeVideo.getBoundingClientRect().top}`)
        : (activeContainer?.id || 'active-card');

      // If the video or container has changed or hasn't been evaluated yet
      if (activeVideo !== currentVideoEl || videoKey !== lastEvaluatedKey) {
        clearScrollTimer();
        currentVideoEl = activeVideo;
        lastEvaluatedKey = videoKey;

        const metadata = adapter.extractMetadata();
        const settings = await settingsItem.getValue();
        const evaluation = evaluateVideo(metadata, settings);
        const liked = adapter.isLiked();

        const action: TelemetryData['action'] = liked
          ? 'liked'
          : evaluation.isMatch
            ? 'watching'
            : 'skipping';

        console.log(
          '%c[Doomscroll Co-Pilot] 🎬 VIDEO DETECTED',
          'background: #4f46e5; color: #ffffff; padding: 2px 8px; border-radius: 4px; font-weight: bold;',
          {
            card: activeContainer?.id || 'none',
            hasVideoTag: Boolean(activeVideo),
            creator: metadata.creatorHandle,
            sound: metadata.soundTitle,
            tags: metadata.hashtags,
            score: `${evaluation.score}%`,
            isMatch: evaluation.isMatch,
            action,
            masterEnabled: settings.masterEnabled,
          },
        );

        const telemetry: TelemetryData = {
          platform: 'tiktok',
          creator: metadata.creatorHandle,
          sound: metadata.soundTitle,
          caption: metadata.caption,
          tags: metadata.hashtags,
          matchedTags: evaluation.matchedTags,
          score: evaluation.score,
          action,
        };

        await telemetryItem.setValue(telemetry);

        // --- Auto-Pilot Cadence Execution ---
        if (!settings.masterEnabled) {
          console.log(
            '%c[Doomscroll Co-Pilot] ⏸️ Auto-Pilot is STANDBY (turn ON "Master Auto-Pilot" in extension popup to auto-scroll)',
            'color: #94a3b8; font-style: italic;',
          );
          return;
        }

        if (evaluation.isAd) {
          console.log(
            '%c[Doomscroll Co-Pilot] 🛑 SPONSORED AD DETECTED! Fast-skipping in 0.5s...',
            'background: #dc2626; color: white; padding: 2px 8px; border-radius: 4px; font-weight: bold;',
          );

          scrollTimer = window.setTimeout(async () => {
            console.log(
              '%c[Doomscroll Co-Pilot] 🚀 Ad fast-skip fired! Auto-scrolling now...',
              'color: #ef4444; font-weight: bold;',
            );
            await adapter.scrollNext();
            const m = await metricsItem.getValue();
            await metricsItem.setValue({
              ...m,
              scrolledCount: m.scrolledCount + 1,
              skippedCount: m.skippedCount + 1,
            });
          }, 500);
        } else if (evaluation.isMatch) {
          // 1. Auto-Like if enabled and not already liked
          if (settings.autoLikeEnabled && !liked) {
            void adapter.clickLike().then((didLike) => {
              if (didLike) {
                console.log(
                  '%c[Doomscroll Co-Pilot] ❤️ Target Matched! Auto-liked clip.',
                  'color: #ec4899; font-weight: bold;',
                );
                void metricsItem.getValue().then((m) => {
                  void metricsItem.setValue({ ...m, likedCount: m.likedCount + 1 });
                });
              }
            });
          }

          // 2. Watch full match up to dwell cap
          const dwellSec = settings.dwellCap || 15;
          console.log(
            `%c[Doomscroll Co-Pilot] ⏳ Target Match! Watching for ${dwellSec}s before auto-scrolling...`,
            'color: #a855f7; font-weight: bold;',
          );

          scrollTimer = window.setTimeout(async () => {
            console.log(
              `%c[Doomscroll Co-Pilot] 🚀 Dwell Cap (${dwellSec}s) reached! Auto-scrolling now!`,
              'color: #10b981; font-weight: bold;',
            );
            await adapter.scrollNext();
            const m = await metricsItem.getValue();
            await metricsItem.setValue({ ...m, scrolledCount: m.scrolledCount + 1 });
          }, dwellSec * 1000);
        } else {
          // 3. Early skip non-match
          const skipSec = settings.earlySkipDelay || 2.5;
          console.log(
            `%c[Doomscroll Co-Pilot] ⏩ Non-matching clip. Early-skipping in ${skipSec}s...`,
            'color: #f59e0b; font-weight: bold;',
          );

          scrollTimer = window.setTimeout(async () => {
            console.log(
              `%c[Doomscroll Co-Pilot] 🚀 Early-skip timer (${skipSec}s) fired! Auto-scrolling now!`,
              'color: #10b981; font-weight: bold;',
            );
            await adapter.scrollNext();
            const m = await metricsItem.getValue();
            await metricsItem.setValue({
              ...m,
              scrolledCount: m.scrolledCount + 1,
              skippedCount: m.skippedCount + 1,
            });
          }, skipSec * 1000);
        }
      }
    };

    // Watch for live setting toggles from the popup
    settingsItem.watch((newSettings) => {
      if (!newSettings.masterEnabled) {
        clearScrollTimer();
        console.log(
          '%c[Doomscroll Co-Pilot] ⏸️ Master Auto-Pilot turned OFF. Pending auto-scroll cancelled.',
          'color: #94a3b8;',
        );
      } else {
        console.log(
          '%c[Doomscroll Co-Pilot] ▶️ Master Auto-Pilot turned ON. Auto-scrolling active!',
          'color: #10b981; font-weight: bold;',
        );
        lastEvaluatedKey = ''; // Force re-evaluation of current video with auto-pilot active
      }
    });

    // Poll every 600ms to detect viewport changes & video transitions
    setInterval(checkActiveVideo, 600);

    // Also trigger on scroll events for instant responsiveness
    window.addEventListener(
      'scroll',
      () => {
        void checkActiveVideo();
      },
      { passive: true },
    );
  },
});
