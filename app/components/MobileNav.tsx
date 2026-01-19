'use client';

import { Map, GitBranch, List, Settings } from 'lucide-react';

interface MobileNavProps {
  activeTab: 'map' | 'bracket' | 'events' | 'settings';
  onTabChange: (tab: 'map' | 'bracket' | 'events' | 'settings') => void;
}

export function MobileNav({ activeTab, onTabChange }: MobileNavProps) {
  const tabs = [
    { id: 'map' as const, label: 'Map', icon: Map },
    // Bracket tab hidden until bracket view is ready
    // { id: 'bracket' as const, label: 'Bracket', icon: GitBranch },
    { id: 'events' as const, label: 'Events', icon: List },
    { id: 'settings' as const, label: 'Settings', icon: Settings },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 px-2 pb-safe z-30">
      <div className="flex justify-around">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex flex-col items-center py-2 px-4 min-w-[64px] transition-colors ${
                isActive
                  ? 'text-blue-600 dark:text-blue-400'
                  : 'text-gray-500 dark:text-gray-400'
              }`}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon
                className={`w-6 h-6 ${isActive ? 'scale-110' : ''} transition-transform`}
              />
              <span className="text-xs mt-1 font-medium">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
