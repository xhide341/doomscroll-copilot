# 2. Popup-Only UI Architecture

Date: 2026-10-03

## Status

Accepted

## Context

We need an interface for users to configure the Auto-Pilot settings (Auto-Like Baddies toggle, confidence threshold slider, scroll thresholds) and monitor real-time execution status (last evaluated video, classification score, action taken). 

We considered:
1. In-page floating HUD widget / overlay injected into the active platform's DOM.
2. Extension action popup (`popup.html`) exclusively.

## Decision

We will isolate all user controls, configuration, and live activity logs into the Chrome Extension Action Popup (`popup.html`). The content scripts injected into YouTube Shorts, TikTok, and Instagram Reels will remain purely non-visual worker scripts responsible for video inspection, metadata extraction, and simulated DOM interactions. State and logs will synchronize via `chrome.storage.local` and runtime message passing (`chrome.runtime.sendMessage`).

## Consequences

- Zero risk of visual CSS clashes, z-index pollution, or breaking host layout on TikTok/Instagram/YouTube.
- Lower chance of bot detection from host sites detecting custom DOM overlay elements.
- During demos, the popup can be pinned, inspected in a side window, or popped out via Chrome developer tools/side panel.
