import type { PlatformAdapter } from '../types/platform';
import type { AutoPilotSettings } from '../types/settings';
import { TikTokAdapter } from './tiktok';
import { YouTubeAdapter } from './youtube';

export { TikTokAdapter } from './tiktok';
export { YouTubeAdapter } from './youtube';

export function resolveAdapter(
  url: string,
  settings?: AutoPilotSettings
): PlatformAdapter | null {
  const tiktok = new TikTokAdapter();
  if (tiktok.isMatch(url)) {
    if (settings && !settings.platforms.tiktok) return null;
    return tiktok;
  }

  const youtube = new YouTubeAdapter();
  if (youtube.isMatch(url)) {
    if (settings && !settings.platforms.youtube) return null;
    return youtube;
  }

  return null;
}
