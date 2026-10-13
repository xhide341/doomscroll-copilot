import React, { useEffect, useState } from 'react';
import {
  DEFAULT_METRICS,
  DEFAULT_SETTINGS,
  DEFAULT_TELEMETRY,
  type AutoPilotSettings,
  type MetricsData,
  type PlatformType,
  type TelemetryData,
} from '../../types/settings';
import {
  metricsItem,
  settingsItem,
  tiktokTelemetryItem,
  youtubeTelemetryItem,
} from '../../utils/storage';
import { Header } from './components/Header';
import { KeywordBank } from './components/KeywordBank';
import { LiveMonitor } from './components/LiveMonitor';
import { Navigation, type TabType } from './components/Navigation';
import { TargetControls } from './components/TargetControls';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('live');
  const [settings, setSettings] = useState<AutoPilotSettings>(DEFAULT_SETTINGS);
  const [metrics, setMetrics] = useState<MetricsData>(DEFAULT_METRICS);
  const [selectedPlatform, setSelectedPlatform] =
    useState<PlatformType>('idle');
  const [tiktokTelemetry, setTiktokTelemetry] = useState<TelemetryData>({
    ...DEFAULT_TELEMETRY,
    platform: 'tiktok',
  });
  const [youtubeTelemetry, setYoutubeTelemetry] = useState<TelemetryData>({
    ...DEFAULT_TELEMETRY,
    platform: 'youtube',
  });

  useEffect(() => {
    // 1. Initial fetch from storage
    settingsItem.getValue().then(setSettings);
    metricsItem.getValue().then(setMetrics);
    tiktokTelemetryItem.getValue().then(setTiktokTelemetry);
    youtubeTelemetryItem.getValue().then(setYoutubeTelemetry);

    // 2. Query active browser tab to automatically lock onto the current platform
    if (typeof chrome !== 'undefined' && chrome.tabs?.query) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const url = tabs[0]?.url || '';
        if (url.includes('tiktok.com')) {
          setSelectedPlatform('tiktok');
        } else if (url.includes('youtube.com')) {
          setSelectedPlatform('youtube');
        }
      });
    }

    // 3. Watch for real-time updates across popup and isolated platform content scripts
    const unwatchSettings = settingsItem.watch(setSettings);
    const unwatchMetrics = metricsItem.watch(setMetrics);
    const unwatchTiktok = tiktokTelemetryItem.watch(setTiktokTelemetry);
    const unwatchYoutube = youtubeTelemetryItem.watch(setYoutubeTelemetry);

    return () => {
      unwatchSettings();
      unwatchMetrics();
      unwatchTiktok();
      unwatchYoutube();
    };
  }, []);

  const updateSettings = (updates: Partial<AutoPilotSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...updates };
      void settingsItem.setValue(next);
      return next;
    });
  };

  const hasTiktok = tiktokTelemetry.action !== 'idle';
  const hasYoutube = youtubeTelemetry.action !== 'idle';

  // Determine active display platform based on current browser tab or active feeds
  const activeDisplayPlatform: PlatformType =
    selectedPlatform !== 'idle'
      ? selectedPlatform
      : hasTiktok && !hasYoutube
        ? 'tiktok'
        : hasYoutube && !hasTiktok
          ? 'youtube'
          : hasTiktok
            ? 'tiktok'
            : hasYoutube
              ? 'youtube'
              : 'idle';

  const telemetry: TelemetryData =
    activeDisplayPlatform === 'tiktok'
      ? tiktokTelemetry
      : activeDisplayPlatform === 'youtube'
        ? youtubeTelemetry
        : DEFAULT_TELEMETRY;

  return (
    <div className="flex max-h-[600px] min-h-[540px] w-[380px] flex-col bg-zinc-950 text-zinc-100 select-none">
      <Header
        platform={activeDisplayPlatform}
        isActive={settings.masterEnabled && telemetry.platform !== 'idle'}
        selectedPlatform={activeDisplayPlatform}
        onSelectPlatform={setSelectedPlatform}
        hasTiktok={hasTiktok}
        hasYoutube={hasYoutube}
      />
      <Navigation currentTab={activeTab} onTabChange={setActiveTab} />

      <main className="flex-1 overflow-y-auto">
        {activeTab === 'live' && (
          <LiveMonitor
            telemetry={telemetry}
            metrics={metrics}
            threshold={settings.confidenceThreshold}
          />
        )}
        {activeTab === 'controls' && (
          <TargetControls settings={settings} onChange={updateSettings} />
        )}
        {activeTab === 'keywords' && (
          <KeywordBank
            targetKeywords={settings.targetKeywords}
            blacklistKeywords={settings.blacklistKeywords}
            onChange={updateSettings}
          />
        )}
      </main>
    </div>
  );
};

export default App;
