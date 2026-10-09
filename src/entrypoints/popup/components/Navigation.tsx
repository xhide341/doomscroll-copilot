import React from 'react';

export type TabType = 'live' | 'controls' | 'keywords';

interface NavigationProps {
  currentTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export const Navigation: React.FC<NavigationProps> = ({ currentTab, onTabChange }) => {
  const tabs: { id: TabType; label: string }[] = [
    { id: 'live', label: 'Live Monitor' },
    { id: 'controls', label: 'Target Controls' },
    { id: 'keywords', label: 'Keyword Bank' },
  ];

  return (
    <nav className="flex border-b border-zinc-800/80 bg-zinc-950/40 px-2 pt-1">
      {tabs.map((tab) => {
        const isActive = currentTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex-1 py-2 text-center text-xs font-medium transition-colors border-b-2 -mb-px cursor-pointer ${
              isActive
                ? 'border-indigo-500 text-zinc-100 font-semibold'
                : 'border-transparent text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </nav>
  );
};
