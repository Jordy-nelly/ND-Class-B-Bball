'use client';

import { motion } from 'motion/react';
import { Search, Info, ChevronDown } from 'lucide-react';

interface FloatingHeaderProps {
  selectedDistrict: number | 'all';
  onSearchClick: () => void;
  onInfoClick: () => void;
  onDistrictClick: () => void;
  yearRange: { min: number; max: number };
}

export function FloatingHeader({
  selectedDistrict,
  onSearchClick,
  onInfoClick,
  onDistrictClick,
  yearRange,
}: FloatingHeaderProps) {
  const districtLabel = selectedDistrict === 'all' 
    ? 'All Districts' 
    : `District ${selectedDistrict}`;

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed top-0 left-0 right-0 z-30 px-4 pt-safe"
    >
      <div className="flex items-center justify-between gap-3 pt-3">
        {/* Search button */}
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={onSearchClick}
          className="w-11 h-11 flex items-center justify-center rounded-full bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl shadow-lg shadow-black/5 border border-white/20"
          aria-label="Search schools"
        >
          <Search className="w-5 h-5 text-gray-700 dark:text-gray-300" />
        </motion.button>

        {/* District pill - clickable picker */}
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={onDistrictClick}
          className="h-11 flex items-center justify-center gap-1.5 rounded-full bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl shadow-lg shadow-black/5 border border-white/20 px-4"
        >
          <span className="text-sm font-semibold text-gray-900 dark:text-white truncate">
            {districtLabel}
          </span>
          <ChevronDown className="w-4 h-4 text-gray-500 dark:text-gray-400 flex-shrink-0" />
        </motion.button>

        {/* Info button */}
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={onInfoClick}
          className="w-11 h-11 flex items-center justify-center rounded-full bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl shadow-lg shadow-black/5 border border-white/20"
          aria-label="About"
        >
          <Info className="w-5 h-5 text-gray-700 dark:text-gray-300" />
        </motion.button>
      </div>
    </motion.header>
  );
}
