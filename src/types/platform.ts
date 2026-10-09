export interface VideoMetadata {
  caption: string;
  hashtags: string[];
  creatorHandle: string;
  soundTitle: string;
  isAd?: boolean;
}

export interface PlatformAdapter {
  platformId: 'tiktok' | 'instagram' | 'youtube';
  isMatch(url: string): boolean;
  getActiveContainer(): HTMLElement | null;
  getActiveVideoElement(): HTMLVideoElement | null;
  extractMetadata(): VideoMetadata;
  isLiked(): boolean;
  isAd?(): boolean;
  clickLike(): Promise<boolean>;
  scrollNext(): Promise<void>;
}
