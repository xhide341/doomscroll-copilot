# 3. Client-Side DOM Metadata and Hashtag Evaluation Engine

Date: 2026-10-03

## Status

Accepted

## Context

To determine whether a short-form video matches the Baddie Target criteria for automated liking and cadence control, we need an evaluation mechanism.

We considered two approaches:
1. **External Remote Service**: Sending extracted metadata to an external server or remote model. This introduces network latency, external hosting/infrastructure costs, and dependency on external service availability during live hackathon demos.
2. **Client-Side DOM Metadata & Hashtag Engine**: Social media creators on TikTok, Instagram Reels, and YouTube Shorts already aggressively tag their content with explicit hashtags (`#baddie`, `#ootd`, `#fitcheck`, `#grwm`, `#slay`, `#glowup`) and trending audio titles. Processing these in-page provides deterministic, instant results.

## Decision

We will evaluate content using a 100% local, zero-latency DOM evaluation engine. The extension extracts captions, hashtags, creator handles, and audio track titles directly from the active reel container, scoring them against a weighted dictionary for the Baddie Target archetype entirely inside the browser tab in < 5ms.

## Consequences

- Zero external APIs, zero network latency, zero costs, and 100% offline-resilient for hackathon demos.
- No external credentials, tokens, or API keys required.
- High reliability across TikTok, Instagram Reels, and YouTube Shorts as long as platform DOM selectors are maintained.
