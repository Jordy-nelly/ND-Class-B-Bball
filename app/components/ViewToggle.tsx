'use client';

import { Map, GitBranch } from 'lucide-react';

interface ViewToggleProps {
  viewMode: 'map' | 'bracket';
  onViewChange: (mode: 'map' | 'bracket') => void;
}

export function ViewToggle({ viewMode, onViewChange }: ViewToggleProps) {
  return (
    <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
      <button
        onClick={() => onViewChange('map')}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all touch-manipulation ${
          viewMode === 'map'
            ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
        }`}
        aria-pressed={viewMode === 'map'}
      >
        <Map className="w-4 h-4" />
        <span className="hidden sm:inline">Map</span>
      </button>
      <button
        onClick={() => onViewChange('bracket')}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all touch-manipulation ${
          viewMode === 'bracket'
            ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
        }`}
        aria-pressed={viewMode === 'bracket'}
      >
        <GitBranch className="w-4 h-4" />
        <span className="hidden sm:inline">Bracket</span>
      </button>
    </div>
  );
}
