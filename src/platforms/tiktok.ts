import type { PlatformAdapter, VideoMetadata } from '../types/platform';

export class TikTokAdapter implements PlatformAdapter {
  readonly platformId = 'tiktok' as const;

  isMatch(url: string): boolean {
    return url.includes('tiktok.com');
  }

  private lastLoggedCardId = '';
  private lastCardWarnTime = 0;
  private lastVideoWarnTime = 0;

  /**
   * Finds the active media card (e.g. #media-card-0, #media-card-1) in the viewport.
   */
  getActiveCard(): HTMLElement | null {
    const cards = Array.from(
      document.querySelectorAll<HTMLElement>('[id^="media-card-"]')
    );
    if (cards.length === 0) {
      const now = Date.now();
      if (now - this.lastCardWarnTime > 3000) {
        this.lastCardWarnTime = now;
        const sampleIds = Array.from(document.querySelectorAll('[id]'))
          .slice(0, 8)
          .map((el) => el.id);
        console.warn(
          '[TikTok Detection] ⚠️ No elements matching [id^="media-card-"]. Sample IDs in page:',
          sampleIds
        );
      }
      return null;
    }

    const viewportMidY = window.innerHeight / 2;
    let closestCard: HTMLElement | null = null;
    let minDistance = Infinity;

    for (const card of cards) {
      const rect = card.getBoundingClientRect();
      if (rect.height < 50) continue;

      const cardMidY = rect.top + rect.height / 2;
      const distance = Math.abs(cardMidY - viewportMidY);

      if (distance < minDistance) {
        minDistance = distance;
        closestCard = card;
      }
    }

    if (closestCard && closestCard.id !== this.lastLoggedCardId) {
      this.lastLoggedCardId = closestCard.id;
      console.log(
        `%c[TikTok Detection] 🎯 Active Card: #${closestCard.id} (out of ${cards.length} cards in DOM)`,
        'color: #818cf8; font-weight: bold;'
      );
    }

    return closestCard;
  }

  getActiveVideoElement(): HTMLVideoElement | null {
    // 1. Try to find the <video> tag within the active media-card container
    const activeCard = this.getActiveCard();
    if (activeCard) {
      const cardVideo = activeCard.querySelector<HTMLVideoElement>('video');
      if (cardVideo) {
        return cardVideo;
      }
    }

    // 2. Global search: find <video> closest to viewport vertical center
    const videos = Array.from(
      document.querySelectorAll<HTMLVideoElement>('video')
    );
    if (videos.length === 0) {
      const now = Date.now();
      if (now - this.lastVideoWarnTime > 3000) {
        this.lastVideoWarnTime = now;
        console.warn(
          '[TikTok Detection] ⚠️ No <video> elements found anywhere on page.'
        );
      }
      return null;
    }

    const viewportMidY = window.innerHeight / 2;
    let closestVideo: HTMLVideoElement | null = null;
    let minDistance = Infinity;

    for (const video of videos) {
      const rect = video.getBoundingClientRect();
      if (rect.height < 50 || rect.width < 50) continue;

      const videoMidY = rect.top + rect.height / 2;
      const distance = Math.abs(videoMidY - viewportMidY);

      if (distance < minDistance) {
        minDistance = distance;
        closestVideo = video;
      }
    }

    return closestVideo;
  }

  getActiveContainer(): HTMLElement | null {
    // 1. Active media-card container (#media-card-0, etc.)
    const activeCard = this.getActiveCard();
    if (activeCard) return activeCard;

    // 2. Fall back to active video parent/ancestor
    const activeVideo = this.getActiveVideoElement();
    if (!activeVideo) return null;

    const container = activeVideo.closest<HTMLElement>(
      '[id^="media-card-"], [data-e2e="recommend-list-item-container"], [data-e2e="browse-video-item"], [data-e2e="feed-item"]'
    );

    return container ?? activeVideo.parentElement;
  }

  extractMetadata(): VideoMetadata {
    const container = this.getActiveContainer();

    // Strict data-e2e selectors
    const authorEl = container?.querySelector<HTMLElement>(
      '[data-e2e="video-author-uniqueid"], [data-e2e="browse-author-uniqueid"]'
    );
    const creatorHandle = authorEl?.textContent?.trim() || '@unknown';

    const descEl = container?.querySelector<HTMLElement>(
      '[data-e2e="video-desc"], [data-e2e="browse-video-desc"]'
    );
    const caption = descEl?.textContent?.trim() || '';

    // Extract hashtags from strict data-e2e tag links or inline text
    const tagElements = container?.querySelectorAll<HTMLElement>(
      '[data-e2e="search-common-link"], a[data-e2e="video-desc-hashtag"]'
    );
    const tags: string[] = [];

    if (tagElements && tagElements.length > 0) {
      tagElements.forEach((el) => {
        const text = el.textContent?.trim().replace(/^#/, '');
        if (text && !tags.includes(text.toLowerCase())) {
          tags.push(text.toLowerCase());
        }
      });
    }

    // Also parse any hashtags from the caption text
    const inlineMatches = caption.match(/#([\w\u4e00-\u9fa5]+)/g);
    if (inlineMatches) {
      for (const m of inlineMatches) {
        const clean = m.replace(/^#/, '').toLowerCase();
        if (!tags.includes(clean)) {
          tags.push(clean);
        }
      }
    }

    const isAd = this.isAd();

    console.log(
      '%c[TikTok Metadata] 📝 Extracted Title & Hashtags',
      'color: #06b6d4; font-weight: bold;',
      {
        containerId: container?.id || 'none',
        title: caption || '(empty)',
        titleElement: descEl
          ? descEl.getAttribute('data-e2e') || descEl.className
          : 'not found',
        hashtags: tags,
        tagCount: tags.length,
        isAd,
      }
    );

    const musicEl = container?.querySelector<HTMLElement>(
      '[data-e2e="video-music"], [data-e2e="browse-music-title"]'
    );
    const soundTitle = musicEl?.textContent?.trim() || 'Original Sound';

    return {
      creatorHandle: creatorHandle.startsWith('@')
        ? creatorHandle
        : `@${creatorHandle}`,
      caption,
      hashtags: tags,
      soundTitle,
      isAd,
    };
  }

  isAd(): boolean {
    const container = this.getActiveContainer();
    if (!container) return false;

    // 1. Direct check on tags container or overlay bottom content (e.g. DivItemTagsContainer > div > p)
    const adBadge = container.querySelector(
      '[class*="DivItemTagsContainer"] p, [class*="DivOverlayBottomContent"] p, [data-e2e*="ad"]'
    );
    if (adBadge && /sponsored/i.test(adBadge.textContent || '')) {
      return true;
    }

    // 2. Scan all paragraphs/spans in container for exact "Sponsored" or "Promoted" text
    const textNodes = container.querySelectorAll('p, span, div');
    for (const el of textNodes) {
      const text = el.textContent?.trim().toLowerCase();
      if (
        text === 'sponsored' ||
        text === 'promoted' ||
        text === 'paid partnership'
      ) {
        return true;
      }
    }

    return false;
  }

  isLiked(): boolean {
    const container = this.getActiveContainer();
    const likeIcon = container?.querySelector<HTMLElement>(
      '[data-e2e="like-icon"], [data-e2e="browse-like-icon"]'
    );
    if (!likeIcon) return false;

    // TikTok marks liked state with color or filled paths or parent state
    const svg = likeIcon.querySelector('svg');
    const fill =
      svg?.getAttribute('fill') || getComputedStyle(svg || likeIcon).color;
    return (
      fill.includes('254, 44, 85') ||
      fill.includes('rgb(254, 44, 85)') ||
      fill.includes('#fe2c55')
    );
  }

  async clickLike(): Promise<boolean> {
    const container = this.getActiveContainer();
    const likeButton = container?.querySelector<HTMLElement>(
      '[data-e2e="like-icon"], [data-e2e="browse-like-icon"]'
    );

    if (likeButton) {
      likeButton.click();
      return true;
    }
    return false;
  }

  async scrollNext(): Promise<void> {
    // 1. Try clicking TikTok's native next / scroll-down button
    const nextBtnSelectors = [
      '#main-content-homepage_hot > aside > div > div:nth-child(2) > button',
      'aside div:nth-child(2) > button',
      '[data-e2e="arrow-down"]',
      '[data-e2e="browse-next-btn"]',
      'button[aria-label*="next" i]',
      'button[aria-label*="down" i]',
    ];

    for (const selector of nextBtnSelectors) {
      const btn = document.querySelector<HTMLButtonElement>(selector);
      if (btn) {
        console.log(
          `%c[TikTok Navigation] 🎯 Clicked next video button (${selector})`,
          'color: #10b981; font-weight: bold;'
        );
        btn.click();
        return;
      }
    }

    // 2. Fallback: scroll next media card into view (#media-card-X+1)
    const activeCard = this.getActiveCard();
    if (activeCard) {
      const match = activeCard.id.match(/media-card-(\d+)/);
      if (match && match[1]) {
        const nextIndex = parseInt(match[1], 10) + 1;
        const nextCard = document.querySelector<HTMLElement>(
          `#media-card-${nextIndex}`
        );
        if (nextCard) {
          console.log(
            `%c[TikTok Navigation] 📜 Scrolling to next card: #media-card-${nextIndex}`,
            'color: #10b981; font-weight: bold;'
          );
          nextCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
          return;
        }
      }

      if (activeCard.nextElementSibling) {
        console.log(
          '%c[TikTok Navigation] 📜 Scrolling to activeCard.nextElementSibling',
          'color: #10b981; font-weight: bold;'
        );
        activeCard.nextElementSibling.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
        return;
      }
    }

    // 3. Fallback: synthetic ArrowDown event
    console.log(
      '%c[TikTok Navigation] ⚠️ Next button/card not found. Dispatched ArrowDown event fallback',
      'color: #f59e0b; font-weight: bold;'
    );
    const event = new KeyboardEvent('keydown', {
      key: 'ArrowDown',
      code: 'ArrowDown',
      keyCode: 40,
      which: 40,
      bubbles: true,
      cancelable: true,
    });
    window.dispatchEvent(event);
    document.dispatchEvent(event);
  }
}
