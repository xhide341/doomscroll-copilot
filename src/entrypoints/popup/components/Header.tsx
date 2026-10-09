import React from 'react';
import type { PlatformType } from '../../../types/settings';

interface HeaderProps {
  platform: PlatformType;
  isActive: boolean;
}

export const Header: React.FC<HeaderProps> = ({ platform, isActive }) => {
  const platformLabel = {
    tiktok: 'TikTok',
    instagram: 'Instagram Reels',
    youtube: 'YouTube Shorts',
    idle: 'No Video Feed',
  }[platform];

  return (
    <header className="flex items-center justify-between border-b border-zinc-800/80 bg-zinc-950/80 px-4 py-3 backdrop-blur-sm">
      <div className="flex items-center space-x-2">
        <div className="flex h-6 w-6 items-center justify-center rounded-md bg-indigo-950/60 text-indigo-400 border border-indigo-500/30">
          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
          </svg>
        </div>
        <div>
          <h1 className="text-xs font-semibold tracking-wider uppercase text-zinc-100">
            Doomscroll <span className="text-indigo-400">Co-Pilot</span>
          </h1>
          <div className="flex items-center space-x-1.5 text-[10px] text-zinc-400">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-zinc-500" />
            <span>{platformLabel}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center">
        {isActive ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-950/40 border border-emerald-500/30 px-2.5 py-0.5 text-[10px] font-medium text-emerald-400">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
            </span>
            ACTIVE
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-zinc-900 border border-zinc-800 px-2.5 py-0.5 text-[10px] font-medium text-zinc-400">
            <span className="h-1.5 w-1.5 rounded-full bg-zinc-600" />
            STANDBY
          </span>
        )}
      </div>
    </header>
  );
};
