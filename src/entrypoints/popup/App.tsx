import React, { useEffect, useState } from 'react';
import {
  DEFAULT_METRICS,
  DEFAULT_SETTINGS,
  DEFAULT_TELEMETRY,
  type AutoPilotSettings,
  type MetricsData,
  type TelemetryData,
} from '../../types/settings';
import { metricsItem, settingsItem, telemetryItem } from '../../utils/storage';
import { Header } from './components/Header';
import { KeywordBank } from './components/KeywordBank';
import { LiveMonitor } from './components/LiveMonitor';
import { Navigation, type TabType } from './components/Navigation';
import { TargetControls } from './components/TargetControls';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('live');
  const [settings, setSettings] = useState<AutoPilotSettings>(DEFAULT_SETTINGS);
  const [metrics, setMetrics] = useState<MetricsData>(DEFAULT_METRICS);
  const [telemetry, setTelemetry] = useState<TelemetryData>(DEFAULT_TELEMETRY);

  useEffect(() => {
    // Initial fetch from WXT storage
    settingsItem.getValue().then(setSettings);
    metricsItem.getValue().then(setMetrics);
    telemetryItem.getValue().then(setTelemetry);

    // Watch for real-time updates across popup, background, and content scripts
    const unwatchSettings = settingsItem.watch((newVal) => {
      setSettings(newVal);
    });
    const unwatchMetrics = metricsItem.watch((newVal) => {
      setMetrics(newVal);
    });
    const unwatchTelemetry = telemetryItem.watch((newVal) => {
      setTelemetry(newVal);
    });

    return () => {
      unwatchSettings();
      unwatchMetrics();
      unwatchTelemetry();
    };
  }, []);

  const updateSettings = (updates: Partial<AutoPilotSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...updates };
      void settingsItem.setValue(next);
      return next;
    });
  };

  return (
    <div className="flex flex-col min-h-[540px] max-h-[600px] w-[380px] bg-zinc-950 text-zinc-100 select-none">
      <Header
        platform={telemetry.platform}
        isActive={settings.masterEnabled && telemetry.platform !== 'idle'}
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
