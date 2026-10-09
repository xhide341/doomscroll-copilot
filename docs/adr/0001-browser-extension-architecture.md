# 1. Browser Extension Architecture for Short-Form Video Automation

Date: 2026-10-03

## Status

Accepted

## Context

For the wackathon project, we need automated scrolling and liking on YouTube Shorts, Instagram Reels, and TikTok, along with content evaluation (e.g. detecting "baddies" to auto-like). 

We considered two architectural alternatives:
1. Headless scraping / backend bot running Puppeteer/Playwright: Requires session cookies or account logins, easily hits IP rate-limits and bot-detection challenges (Cloudflare, Akamai, TikTok captcha).
2. Chrome/Edge Extension (Manifest V3): Runs directly inside the user's active, authenticated browser tab.

## Decision

We will implement the project as a Chrome Extension (Manifest V3) that injects content scripts into TikTok, Instagram Reels, and YouTube Shorts. The extension interacts directly with the active feed via native DOM event simulation and inspects in-page metadata to trigger engagement actions.

## Consequences

- Direct access to user's logged-in session without re-authentication or credential storage.
- Immediate DOM manipulation for like button clicks and synthetic keyboard/wheel scroll events.
- Zero server hosting, proxy maintenance, or headless browser overhead.
