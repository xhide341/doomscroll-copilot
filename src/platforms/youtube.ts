import type { PlatformAdapter, VideoMetadata } from '../types/platform';

export class YouTubeAdapter implements PlatformAdapter {
  readonly platformId = 'youtube' as const;

  private lastLoggedShortId = '';
  private lastWarnTime = 0;

  isMatch(url: string): boolean {
    return url.includes('youtube.com/shorts');
  }

  /**
   * Determines if the active YouTube user is signed in to avoid clicking
   * Like and triggering the intrusive Google 'Sign in to like this video' modal.
   */
  isUserSignedIn(): boolean {
    const avatar = document.querySelector(
      '#avatar-btn, button#avatar-btn, img.yt-spec-avatar-shape__image, #masthead ytd-topbar-menu-button-renderer'
    );
    if (avatar) return true;

    const signInBtn = document.querySelector(
      'a[href*="accounts.google.com"], ytd-button-renderer a[aria-label*="Sign in" i], button[aria-label*="Sign in" i]'
    );
    if (signInBtn) return false;

    // Default to true if ambiguous to allow normal functionality
    return true;
  }

  /**
   * Locates the active YouTube Shorts container (<ytd-reel-video-renderer>).
   */
  getActiveContainer(): HTMLElement | null {
    // 1. Look for YouTube's native is-active attribute
    const activeRenderer = document.querySelector<HTMLElement>(
      'ytd-reel-video-renderer[is-active]'
    );
    if (activeRenderer) {
      this.logActiveRenderer(activeRenderer);
      return activeRenderer;
    }

    // 2. Viewport-based detection among all renderers
    const renderers = Array.from(
      document.querySelectorAll<HTMLElement>('ytd-reel-video-renderer')
    );

    if (renderers.length === 0) {
      const now = Date.now();
      if (now - this.lastWarnTime > 3000) {
        this.lastWarnTime = now;
        console.warn(
          '[YouTube Detection] ⚠️ No <ytd-reel-video-renderer> elements found on page.'
        );
      }
      return null;
    }

    const viewportMidY = window.innerHeight / 2;
    let closestRenderer: HTMLElement | null = null;
    let minDistance = Infinity;

    for (const renderer of renderers) {
      const rect = renderer.getBoundingClientRect();
      if (rect.height < 50) continue;

      const rendererMidY = rect.top + rect.height / 2;
      const distance = Math.abs(rendererMidY - viewportMidY);

      if (distance < minDistance) {
        minDistance = distance;
        closestRenderer = renderer;
      }
    }

    if (closestRenderer) {
      this.logActiveRenderer(closestRenderer);
    }

    return closestRenderer;
  }

  private logActiveRenderer(renderer: HTMLElement) {
    const identifier =
      renderer.getAttribute('id') ||
      renderer.getAttribute('video-id') ||
      'active-short';
    if (identifier !== this.lastLoggedShortId) {
      this.lastLoggedShortId = identifier;
      console.log(
        `%c[YouTube Detection] 🎯 Active Short: ${identifier}`,
        'color: #ef4444; font-weight: bold;'
      );
    }
  }

  getActiveVideoElement(): HTMLVideoElement | null {
    // 1. Check inside active container first
    const activeContainer = this.getActiveContainer();
    if (activeContainer) {
      const video = activeContainer.querySelector<HTMLVideoElement>('video');
      if (video) return video;
    }

    // 2. Fallback: find <video> closest to vertical center
    const videos = Array.from(
      document.querySelectorAll<HTMLVideoElement>('video')
    );
    if (videos.length === 0) return null;

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

  extractMetadata(): VideoMetadata {
    const container = this.getActiveContainer();

    // 1. Channel / Creator handle
    const authorEl = container?.querySelector<HTMLElement>(
      'ytd-reel-player-header-renderer #channel-name, ytd-channel-name yt-formatted-string, ytd-reel-player-header-renderer a[href*="/@"], a[href*="/@"]'
    );
    let creatorHandle = authorEl?.textContent?.trim() || '@unknown';
    if (!creatorHandle.startsWith('@') && creatorHandle !== '@unknown') {
      creatorHandle = `@${creatorHandle}`;
    }

    // 2. Caption / Title
    const titleEl = container?.querySelector<HTMLElement>(
      'h2.title, yt-formatted-string.title, #title.ytd-reel-player-header-renderer, [id="shorts-title"]'
    );
    const caption = titleEl?.textContent?.trim() || '';

    // 3. Hashtags (from inline links, pre-rendered tags, and title text)
    const tags: string[] = [];
    const tagElements = container?.querySelectorAll<HTMLElement>(
      'a[href*="/hashtag/"], a[href*="/shorts/tag/"], .yt-core-attributed-string__link'
    );

    if (tagElements && tagElements.length > 0) {
      tagElements.forEach((el) => {
        const text = el.textContent?.trim().replace(/^#/, '');
        if (text && !tags.includes(text.toLowerCase())) {
          tags.push(text.toLowerCase());
        }
      });
    }

    // Parse inline hashtags in caption
    const inlineMatches = caption.match(/#([\w\u4e00-\u9fa5]+)/g);
    if (inlineMatches) {
      for (const m of inlineMatches) {
        const clean = m.replace(/^#/, '').toLowerCase();
        if (!tags.includes(clean)) {
          tags.push(clean);
        }
      }
    }

    // Inspect pre-rendered description if available without opening modal dialogs
    const descEl = container?.querySelector<HTMLElement>(
      'ytd-reel-player-overlay-renderer #description, [id="description"]'
    );
    if (descEl) {
      const descText = descEl.textContent || '';
      const descMatches = descText.match(/#([\w\u4e00-\u9fa5]+)/g);
      if (descMatches) {
        for (const m of descMatches) {
          const clean = m.replace(/^#/, '').toLowerCase();
          if (!tags.includes(clean)) {
            tags.push(clean);
          }
        }
      }
    }

    // 4. Sound Title
    const musicEl = container?.querySelector<HTMLElement>(
      'ytd-reel-player-header-renderer #sound-title, a[href*="/source/"], yt-formatted-string.sound-title'
    );
    const soundTitle = musicEl?.textContent?.trim() || 'Original Audio';

    const isAd = this.isAd();

    console.log(
      '%c[YouTube Metadata] 📝 Extracted Shorts Metadata',
      'color: #ef4444; font-weight: bold;',
      {
        creator: creatorHandle,
        title: caption || '(empty)',
        hashtags: tags,
        tagCount: tags.length,
        sound: soundTitle,
        isAd,
      }
    );

    return {
      creatorHandle,
      caption,
      hashtags: tags,
      soundTitle,
      isAd,
    };
  }

  isAd(): boolean {
    const container = this.getActiveContainer();
    if (!container) return false;

    // 1. Dedicated YouTube Shorts Ad renderers & badges
    const adSelectors = [
      'ytd-ad-slot-renderer',
      'ytd-in-feed-ad-layout-renderer',
      '[id="ad-badge"]',
      '.badge-shape-wiz--ad',
      '[aria-label*="Sponsored" i]',
      'ad-button-view-model',
      '.ytd-badge-supported-renderer',
    ];

    for (const selector of adSelectors) {
      const el = container.querySelector(selector);
      if (el) {
        const text = el.textContent?.toLowerCase() || '';
        if (
          text.includes('sponsored') ||
          text.includes('promoted') ||
          text.includes('ad') ||
          el.matches(
            '[id="ad-badge"], .badge-shape-wiz--ad, ytd-ad-slot-renderer'
          )
        ) {
          return true;
        }
      }
    }

    // 2. Scan text nodes in container for Sponsored indicators
    const badges = container.querySelectorAll('span, div, p');
    for (const el of badges) {
      const text = el.textContent?.trim().toLowerCase();
      if (
        text === 'sponsored' ||
        text === 'promoted' ||
        text?.startsWith('ad •')
      ) {
        return true;
      }
    }

    return false;
  }

  isLiked(): boolean {
    const container = this.getActiveContainer();
    if (!container) return false;

    const likeBtn = container.querySelector<HTMLElement>(
      'ytd-like-button-renderer #like-button button, like-button-view-model button, button[aria-label*="like this video" i], button[aria-label*="unlike" i]'
    );
    if (!likeBtn) return false;

    // Check aria-pressed or aria-label for liked state
    const ariaPressed = likeBtn.getAttribute('aria-pressed');
    if (ariaPressed === 'true') return true;

    const ariaLabel = likeBtn.getAttribute('aria-label')?.toLowerCase() || '';
    if (ariaLabel.includes('unlike') || ariaLabel.includes('remove like')) {
      return true;
    }

    return false;
  }

  async clickLike(): Promise<boolean> {
    if (!this.isUserSignedIn()) {
      console.warn(
        '%c[YouTube Like] ⚠️ User is signed out. Skipped auto-like to avoid Google sign-in modal.',
        'color: #f59e0b; font-weight: bold;'
      );
      return false;
    }

    const container = this.getActiveContainer();
    if (!container) return false;

    const likeBtn = container.querySelector<HTMLButtonElement>(
      'ytd-like-button-renderer #like-button button, like-button-view-model button, button[aria-label*="like this video" i]'
    );

    if (likeBtn) {
      likeBtn.click();
      return true;
    }

    return false;
  }

  async scrollNext(): Promise<void> {
    // 1. Try YouTube's native Next Video button
    const nextBtnSelectors = [
      '#navigation-button-down button',
      'ytd-shorts #navigation-button-down button',
      'button[aria-label*="Next video" i]',
      'button[aria-label*="Next short" i]',
    ];

    for (const selector of nextBtnSelectors) {
      const btn = document.querySelector<HTMLButtonElement>(selector);
      if (btn) {
        console.log(
          `%c[YouTube Navigation] 🎯 Clicked next video button (${selector})`,
          'color: #10b981; font-weight: bold;'
        );
        btn.click();
        return;
      }
    }

    // 2. Fallback: scroll next <ytd-reel-video-renderer> into view
    const activeContainer = this.getActiveContainer();
    if (activeContainer) {
      const nextRenderer =
        activeContainer.nextElementSibling as HTMLElement | null;
      if (nextRenderer && nextRenderer.tagName.toLowerCase().includes('reel')) {
        console.log(
          '%c[YouTube Navigation] 📜 Smooth scrolling next renderer into view',
          'color: #10b981; font-weight: bold;'
        );
        nextRenderer.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }
    }

    // 3. Fallback: Dispatch synthetic ArrowDown and 'j' keyboard events
    console.log(
      '%c[YouTube Navigation] ⌨️ Dispatching synthetic ArrowDown & "j" keyboard events fallback',
      'color: #f59e0b; font-weight: bold;'
    );

    const downEvent = new KeyboardEvent('keydown', {
      key: 'ArrowDown',
      code: 'ArrowDown',
      keyCode: 40,
      which: 40,
      bubbles: true,
      cancelable: true,
    });
    window.dispatchEvent(downEvent);
    document.dispatchEvent(downEvent);

    const jEvent = new KeyboardEvent('keydown', {
      key: 'j',
      code: 'KeyJ',
      keyCode: 74,
      which: 74,
      bubbles: true,
      cancelable: true,
    });
    window.dispatchEvent(jEvent);
    document.dispatchEvent(jEvent);
  }
}
