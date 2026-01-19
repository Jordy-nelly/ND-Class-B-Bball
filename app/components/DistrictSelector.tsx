'use client';

import { ChevronDown } from 'lucide-react';
import { availableDistricts } from '../data/allDistricts';

interface DistrictSelectorProps {
  selectedDistrict: number | 'all';
  onDistrictChange: (district: number | 'all') => void;
}

export function DistrictSelector({ selectedDistrict, onDistrictChange }: DistrictSelectorProps) {
  return (
    <div className="relative">
      <select
        value={selectedDistrict}
        onChange={(e) => {
          const value = e.target.value;
          onDistrictChange(value === 'all' ? 'all' : parseInt(value));
        }}
        className="appearance-none bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 pr-8 text-sm font-medium text-gray-700 dark:text-gray-200 cursor-pointer hover:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
      >
        <option value="all">All Districts</option>
        {availableDistricts.map((district) => (
          <option key={district} value={district}>
            District {district}
          </option>
        ))}
      </select>
      <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
    </div>
  );
}
