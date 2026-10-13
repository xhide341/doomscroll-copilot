import { storage } from '#imports';
import {
  DEFAULT_METRICS,
  DEFAULT_SETTINGS,
  DEFAULT_TELEMETRY,
  type AutoPilotSettings,
  type MetricsData,
  type TelemetryData,
} from '../types/settings';

export const settingsItem = storage.defineItem<AutoPilotSettings>(
  'local:settings',
  {
    fallback: DEFAULT_SETTINGS,
  }
);

export const metricsItem = storage.defineItem<MetricsData>('local:metrics', {
  fallback: DEFAULT_METRICS,
});

export const tiktokMetricsItem = storage.defineItem<MetricsData>(
  'local:metrics:tiktok',
  {
    fallback: DEFAULT_METRICS,
  }
);

export const youtubeMetricsItem = storage.defineItem<MetricsData>(
  'local:metrics:youtube',
  {
    fallback: DEFAULT_METRICS,
  }
);

export const telemetryItem = storage.defineItem<TelemetryData>(
  'local:telemetry',
  {
    fallback: DEFAULT_TELEMETRY,
  }
);

export const tiktokTelemetryItem = storage.defineItem<TelemetryData>(
  'local:telemetry:tiktok',
  {
    fallback: {
      ...DEFAULT_TELEMETRY,
      platform: 'tiktok',
    },
  }
);

export const youtubeTelemetryItem = storage.defineItem<TelemetryData>(
  'local:telemetry:youtube',
  {
    fallback: {
      ...DEFAULT_TELEMETRY,
      platform: 'youtube',
    },
  }
);

export async function setPlatformTelemetry(
  platform: 'tiktok' | 'youtube',
  telemetry: TelemetryData
) {
  if (platform === 'tiktok') {
    await tiktokTelemetryItem.setValue(telemetry);
  } else if (platform === 'youtube') {
    await youtubeTelemetryItem.setValue(telemetry);
  }
  // Also update telemetryItem for single-platform backwards compatibility
  await telemetryItem.setValue(telemetry);
}

export async function incrementPlatformMetrics(
  platform: 'tiktok' | 'youtube',
  increments: { scrolled?: boolean; liked?: boolean; skipped?: boolean }
): Promise<MetricsData> {
  const item = platform === 'tiktok' ? tiktokMetricsItem : youtubeMetricsItem;
  const current = await item.getValue();
  const next: MetricsData = {
    scrolledCount: current.scrolledCount + (increments.scrolled ? 1 : 0),
    likedCount: current.likedCount + (increments.liked ? 1 : 0),
    skippedCount: current.skippedCount + (increments.skipped ? 1 : 0),
  };
  await item.setValue(next);

  // Compute aggregate totals across all platforms to update metricsItem
  const otherItem =
    platform === 'tiktok' ? youtubeMetricsItem : tiktokMetricsItem;
  const other = await otherItem.getValue();
  const total: MetricsData = {
    scrolledCount: next.scrolledCount + other.scrolledCount,
    likedCount: next.likedCount + other.likedCount,
    skippedCount: next.skippedCount + other.skippedCount,
  };
  await metricsItem.setValue(total);
  return total;
}
