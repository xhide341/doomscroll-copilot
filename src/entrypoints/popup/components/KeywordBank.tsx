import React, { useState } from 'react';
import {
  DEFAULT_BLACKLIST_KEYWORDS,
  DEFAULT_TARGET_KEYWORDS,
} from '../../../types/settings';

interface KeywordBankProps {
  targetKeywords: string[];
  blacklistKeywords: string[];
  onChange: (updates: {
    targetKeywords?: string[];
    blacklistKeywords?: string[];
  }) => void;
}

export const KeywordBank: React.FC<KeywordBankProps> = ({
  targetKeywords,
  blacklistKeywords,
  onChange,
}) => {
  const [newTarget, setNewTarget] = useState('');
  const [newBlacklist, setNewBlacklist] = useState('');

  const addTargetTag = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = newTarget.trim().toLowerCase().replace(/^#/, '');
    if (clean && !targetKeywords.includes(clean)) {
      onChange({ targetKeywords: [...targetKeywords, clean] });
      setNewTarget('');
    }
  };

  const removeTargetTag = (tagToRemove: string) => {
    onChange({
      targetKeywords: targetKeywords.filter((t) => t !== tagToRemove),
    });
  };

  const addBlacklistTag = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = newBlacklist.trim().toLowerCase().replace(/^#/, '');
    if (clean && !blacklistKeywords.includes(clean)) {
      onChange({ blacklistKeywords: [...blacklistKeywords, clean] });
      setNewBlacklist('');
    }
  };

  const removeBlacklistTag = (tagToRemove: string) => {
    onChange({
      blacklistKeywords: blacklistKeywords.filter((t) => t !== tagToRemove),
    });
  };

  const resetToDefaults = () => {
    onChange({
      targetKeywords: [...DEFAULT_TARGET_KEYWORDS],
      blacklistKeywords: [...DEFAULT_BLACKLIST_KEYWORDS],
    });
  };

  return (
    <div className="space-y-4 p-4 text-xs">
      {/* Target Tags (Positive) */}
      <div className="space-y-2 rounded-lg border border-zinc-800 bg-zinc-900/40 p-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-semibold text-zinc-100">Target Tags</div>
            <div className="text-[10px] text-zinc-400">
              Keywords and hashtags that score content positively
            </div>
          </div>
          <span className="rounded border border-indigo-500/30 bg-indigo-950/60 px-1.5 py-0.5 font-mono text-[10px] text-indigo-300">
            {targetKeywords.length}
          </span>
        </div>

        <form onSubmit={addTargetTag} className="flex gap-1.5">
          <input
            type="text"
            placeholder="Add tag (e.g. baddie, fitcheck)"
            value={newTarget}
            onChange={(e) => setNewTarget(e.target.value)}
            className="flex-1 rounded border border-zinc-800 bg-zinc-950 px-2.5 py-1 text-xs text-zinc-200 placeholder-zinc-500 focus:border-indigo-500 focus:outline-none"
          />
          <button
            type="submit"
            className="cursor-pointer rounded bg-indigo-600 px-3 py-1 text-xs font-medium text-white transition-colors hover:bg-indigo-500"
          >
            Add
          </button>
        </form>

        <div className="flex max-h-24 flex-wrap gap-1 overflow-y-auto pt-1 pr-1">
          {targetKeywords.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 rounded border border-indigo-500/30 bg-indigo-950/40 px-2 py-0.5 font-mono text-[11px] text-indigo-300"
            >
              #{tag}
              <button
                type="button"
                onClick={() => removeTargetTag(tag)}
                className="ml-0.5 cursor-pointer leading-none text-zinc-400 hover:text-zinc-100"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      </div>

      {/* Blacklist Tags (Negative / Disqualifiers) */}
      <div className="space-y-2 rounded-lg border border-zinc-800 bg-zinc-900/40 p-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-semibold text-zinc-100">Blacklist Tags</div>
            <div className="text-[10px] text-zinc-400">
              Negative keywords that immediately disqualify content
            </div>
          </div>
          <span className="rounded border border-rose-500/30 bg-rose-950/60 px-1.5 py-0.5 font-mono text-[10px] text-rose-300">
            {blacklistKeywords.length}
          </span>
        </div>

        <form onSubmit={addBlacklistTag} className="flex gap-1.5">
          <input
            type="text"
            placeholder="Add tag to block (e.g. gaming, podcast)"
            value={newBlacklist}
            onChange={(e) => setNewBlacklist(e.target.value)}
            className="flex-1 rounded border border-zinc-800 bg-zinc-950 px-2.5 py-1 text-xs text-zinc-200 placeholder-zinc-500 focus:border-rose-500 focus:outline-none"
          />
          <button
            type="submit"
            className="cursor-pointer rounded border border-zinc-700 bg-zinc-800 px-3 py-1 text-xs font-medium text-zinc-200 transition-colors hover:bg-zinc-700"
          >
            Add
          </button>
        </form>

        <div className="flex max-h-24 flex-wrap gap-1 overflow-y-auto pt-1 pr-1">
          {blacklistKeywords.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 rounded border border-rose-500/30 bg-rose-950/30 px-2 py-0.5 font-mono text-[11px] text-rose-300"
            >
              #{tag}
              <button
                type="button"
                onClick={() => removeBlacklistTag(tag)}
                className="ml-0.5 cursor-pointer leading-none text-zinc-400 hover:text-zinc-100"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      </div>

      {/* Reset button */}
      <div className="pt-1">
        <button
          type="button"
          onClick={resetToDefaults}
          className="w-full cursor-pointer rounded border border-zinc-800 bg-zinc-900/60 py-1.5 text-center text-[11px] font-medium text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-200"
        >
          Reset Keyword Banks to Default
        </button>
      </div>
    </div>
  );
};
