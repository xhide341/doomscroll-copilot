import React from 'react';
import type { MetricsData, TelemetryData } from '../../../types/settings';

interface LiveMonitorProps {
  telemetry: TelemetryData;
  metrics: MetricsData;
  threshold: number;
}

export const LiveMonitor: React.FC<LiveMonitorProps> = ({ telemetry, metrics, threshold }) => {
  const isMatch = telemetry.score >= threshold && telemetry.score > 0;
  const likeRate = metrics.scrolledCount > 0
    ? Math.round((metrics.likedCount / metrics.scrolledCount) * 100)
    : 0;

  const getActionBadge = () => {
    switch (telemetry.action) {
      case 'liked':
        return (
          <span className="inline-flex items-center gap-1 rounded bg-rose-950/40 border border-rose-500/30 px-2 py-0.5 text-[10px] font-medium text-rose-300">
            <span>❤️</span> Auto-Liked
          </span>
        );
      case 'skipping':
        return (
          <span className="inline-flex items-center gap-1 rounded bg-amber-950/40 border border-amber-500/30 px-2 py-0.5 text-[10px] font-medium text-amber-300">
            <span>⏩</span> Early Skip
          </span>
        );
      case 'watching':
        return (
          <span className="inline-flex items-center gap-1 rounded bg-indigo-950/40 border border-indigo-500/30 px-2 py-0.5 text-[10px] font-medium text-indigo-300">
            <span>👀</span> Watching
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded bg-zinc-900 border border-zinc-800 px-2 py-0.5 text-[10px] font-medium text-zinc-400">
            Idle
          </span>
        );
    }
  };

  return (
    <div className="space-y-3 p-4">
      {/* Real-Time Telemetry Card */}
      <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-3.5 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-100 truncate">
              <span>{telemetry.creator}</span>
            </div>
            <div className="flex items-center gap-1 text-[11px] text-zinc-400 truncate mt-0.5">
              <svg className="h-3 w-3 shrink-0 text-zinc-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 18V5l12-2v13" />
                <circle cx="6" cy="18" r="3" />
                <circle cx="18" cy="16" r="3" />
              </svg>
              <span className="truncate">{telemetry.sound}</span>
            </div>
          </div>
          <div>{getActionBadge()}</div>
        </div>

        {telemetry.caption && (
          <p className="text-[11px] text-zinc-400 line-clamp-2 bg-zinc-950/40 p-2 rounded border border-zinc-850">
            {telemetry.caption}
          </p>
        )}

        {/* Confidence Meter */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-zinc-400 font-medium">Confidence Score</span>
            <div className="flex items-center gap-1.5">
              <span className={`font-mono text-xs font-semibold ${isMatch ? 'text-indigo-400' : 'text-zinc-300'}`}>
                {telemetry.score}%
              </span>
              <span className="text-[10px] text-zinc-500">
                (req. {threshold}%)
              </span>
            </div>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-800">
            <div
              className={`h-full transition-all duration-300 ${
                isMatch ? 'bg-indigo-500' : 'bg-zinc-600'
              }`}
              style={{ width: `${Math.min(100, Math.max(0, telemetry.score))}%` }}
            />
          </div>
        </div>

        {/* Detected Tags */}
        <div className="space-y-1.5">
          <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">
            Detected Tags
          </span>
          <div className="flex flex-wrap gap-1 max-h-16 overflow-y-auto pr-1">
            {telemetry.tags.length > 0 ? (
              telemetry.tags.map((tag) => {
                const matched = telemetry.matchedTags.includes(tag.toLowerCase());
                return (
                  <span
                    key={tag}
                    className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-mono ${
                      matched
                        ? 'border border-indigo-500/40 bg-indigo-950/50 text-indigo-300'
                        : 'border border-zinc-800 bg-zinc-950 text-zinc-400'
                    }`}
                  >
                    #{tag}
                  </span>
                );
              })
            ) : (
              <span className="text-[11px] text-zinc-500 italic">No hashtags detected in current video</span>
            )}
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div>
        <h2 className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 mb-2">
          Session Metrics
        </h2>
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-2.5 text-center">
            <div className="text-[10px] text-zinc-400">Scrolled</div>
            <div className="text-base font-bold font-mono text-zinc-100 mt-0.5">
              {metrics.scrolledCount}
            </div>
          </div>
          <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-2.5 text-center">
            <div className="text-[10px] text-zinc-400">Auto-Liked</div>
            <div className="text-base font-bold font-mono text-indigo-400 mt-0.5">
              {metrics.likedCount}
            </div>
          </div>
          <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-2.5 text-center">
            <div className="text-[10px] text-zinc-400">Like Rate</div>
            <div className="text-base font-bold font-mono text-zinc-200 mt-0.5">
              {likeRate}%
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
