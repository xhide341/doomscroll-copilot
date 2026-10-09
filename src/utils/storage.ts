import { storage } from '#imports';
import {
  DEFAULT_METRICS,
  DEFAULT_SETTINGS,
  DEFAULT_TELEMETRY,
  type AutoPilotSettings,
  type MetricsData,
  type TelemetryData,
} from '../types/settings';

export const settingsItem = storage.defineItem<AutoPilotSettings>('local:settings', {
  fallback: DEFAULT_SETTINGS,
});

export const metricsItem = storage.defineItem<MetricsData>('local:metrics', {
  fallback: DEFAULT_METRICS,
});

export const telemetryItem = storage.defineItem<TelemetryData>('local:telemetry', {
  fallback: DEFAULT_TELEMETRY,
});
