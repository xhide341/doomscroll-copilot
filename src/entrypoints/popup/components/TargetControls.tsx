import React from 'react';
import type { AutoPilotSettings } from '../../../types/settings';

interface TargetControlsProps {
  settings: AutoPilotSettings;
  onChange: (updated: Partial<AutoPilotSettings>) => void;
}

export const TargetControls: React.FC<TargetControlsProps> = ({
  settings,
  onChange,
}) => {
  const togglePlatform = (key: keyof AutoPilotSettings['platforms']) => {
    onChange({
      platforms: {
        ...settings.platforms,
        [key]: !settings.platforms[key],
      },
    });
  };

  return (
    <div className="space-y-4 p-4 text-xs">
      {/* Master Toggle Card */}
      <div
        className={`rounded-lg border p-3 transition-colors ${
          settings.masterEnabled
            ? 'border-indigo-500/50 bg-indigo-950/20'
            : 'border-zinc-800 bg-zinc-900/40'
        }`}
      >
        <div className="flex items-center justify-between">
          <div>
            <div className="font-semibold text-zinc-100">Master Auto-Pilot</div>
            <div className="mt-0.5 text-[11px] text-zinc-400">
              Enable automated feed navigation and evaluation
            </div>
          </div>
          <button
            type="button"
            onClick={() => onChange({ masterEnabled: !settings.masterEnabled })}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              settings.masterEnabled ? 'bg-indigo-600' : 'bg-zinc-700'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                settings.masterEnabled ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Auto-Like Switch */}
      <div className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900/40 p-3">
        <div>
          <div className="font-semibold text-zinc-100">Auto-Like Targets</div>
          <div className="mt-0.5 text-[11px] text-zinc-400">
            Automatically click like when score exceeds threshold
          </div>
        </div>
        <button
          type="button"
          onClick={() =>
            onChange({ autoLikeEnabled: !settings.autoLikeEnabled })
          }
          className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
            settings.autoLikeEnabled ? 'bg-indigo-600' : 'bg-zinc-700'
          }`}
        >
          <span
            className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
              settings.autoLikeEnabled ? 'translate-x-4' : 'translate-x-0'
            }`}
          />
        </button>
      </div>

      {/* Sliders Section */}
      <div className="space-y-3.5 rounded-lg border border-zinc-800 bg-zinc-900/40 p-3">
        {/* Confidence Threshold */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-medium text-zinc-300">
              Confidence Threshold
            </span>
            <span className="font-mono font-semibold text-indigo-400">
              {settings.confidenceThreshold}%
            </span>
          </div>
          <input
            type="range"
            min="10"
            max="95"
            step="5"
            value={settings.confidenceThreshold}
            onChange={(e) =>
              onChange({ confidenceThreshold: Number(e.target.value) })
            }
            className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-zinc-800"
          />
          <div className="flex justify-between text-[10px] text-zinc-500">
            <span>Relaxed (10%)</span>
            <span>Strict (95%)</span>
          </div>
        </div>

        {/* Dwell Cap */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-medium text-zinc-300">
              Dwell Cap (Max Watch Time)
            </span>
            <span className="font-mono font-semibold text-zinc-200">
              {settings.dwellCap}s
            </span>
          </div>
          <input
            type="range"
            min="5"
            max="30"
            step="1"
            value={settings.dwellCap}
            onChange={(e) => onChange({ dwellCap: Number(e.target.value) })}
            className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-zinc-800"
          />
          <div className="flex justify-between text-[10px] text-zinc-500">
            <span>5s</span>
            <span>30s</span>
          </div>
        </div>

        {/* Early Skip Delay */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-medium text-zinc-300">
              Early Skip Delay (Non-Match)
            </span>
            <span className="font-mono font-semibold text-zinc-200">
              {settings.earlySkipDelay.toFixed(1)}s
            </span>
          </div>
          <input
            type="range"
            min="1.0"
            max="5.0"
            step="0.5"
            value={settings.earlySkipDelay}
            onChange={(e) =>
              onChange({ earlySkipDelay: Number(e.target.value) })
            }
            className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-zinc-800"
          />
          <div className="flex justify-between text-[10px] text-zinc-500">
            <span>1.0s</span>
            <span>5.0s</span>
          </div>
        </div>
      </div>

      {/* Target Platforms */}
      <div className="space-y-2 rounded-lg border border-zinc-800 bg-zinc-900/40 p-3">
        <div className="text-[11px] font-semibold tracking-wider text-zinc-400 uppercase">
          Enabled Platforms
        </div>
        <div className="grid grid-cols-3 gap-2">
          {(['tiktok', 'instagram', 'youtube'] as const).map((plat) => {
            const isEnabled = settings.platforms[plat];
            const label = {
              tiktok: 'TikTok',
              instagram: 'Reels',
              youtube: 'Shorts',
            }[plat];

            return (
              <button
                key={plat}
                type="button"
                onClick={() => togglePlatform(plat)}
                className={`cursor-pointer rounded border px-2 py-1.5 text-center text-[11px] font-medium transition-colors ${
                  isEnabled
                    ? 'border-indigo-500/40 bg-indigo-950/40 text-indigo-300'
                    : 'border-zinc-800 bg-zinc-950 text-zinc-500 hover:text-zinc-400'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
