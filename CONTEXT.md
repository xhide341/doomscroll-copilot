# Doomscroll Co-Pilot (Wackathon Project)

An automated short-form video consumer, evaluator, and engagement agent running directly in modern web browsers.

## Language

**Evaluator**:
The DOM-based metadata and hashtag inspection subsystem that extracts captions, hashtags, creator handles, and audio titles to score content against criteria without external APIs.
_Avoid_: Vision API, scraper, bot detector

**Baddie Target**:
The primary aesthetic and visual classification target, configured via a master "Auto-Like Baddies" switch with an adjustable Confidence Threshold slider (0% to 100%).
_Avoid_: Archetype preset, prompt selector, multi-filter

**Engagement Action**:
A simulated user interaction performed on the host platform, specifically Liking or Favoriting/Bookmarking based on configured evaluation criteria.
_Avoid_: Webhook, API call, click event, repost

**Scroll Cadence**:
The timed or event-driven behavior that determines how long a clip is watched before advancing to the next short-form video in the feed.
_Avoid_: Delay, sleep timer, page scroll

**Early Skip**:
The intentional abortion of video playback after 2–3 seconds when the Evaluator confirms the content does not match the Baddie Target criteria, conserving attention and optimizing dopamine intake.
_Avoid_: Fast forward, glitch scroll, timeout

**Dwell Cap**:
The maximum ceiling of seconds (e.g. 15–20s) permitted on a single video before forcing a scroll, preventing infinite loops on long background-music shorts.
_Avoid_: Max watch time, video timeout

**Brainrot Dashboard**:
The centralized extension popup interface providing real-time telemetry, session metrics, configuration toggles, and live video analysis readouts.
_Avoid_: Control panel, settings page, options modal

**Brainrot Metrics**:
The humorous aggregate counters tracking total videos scrolled, total baddies liked, and calculated "Braincells Lost" / "Dopamine Optimized".
_Avoid_: Analytics, telemetry logs, session statistics

**Keyword Bank**:
The user-customizable weighted dictionary of hashtags, keywords, and audio titles used by the Evaluator to score content.
_Avoid_: Filter list, word array, tag block
