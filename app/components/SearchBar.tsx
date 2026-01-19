'use client';

import { useState, useRef, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getAllUniqueSchools, getSchoolMascot } from '../lib/dataParser';
import { getSchoolColor } from '../lib/colors';

interface SearchBarProps {
  onSchoolSelect: (school: string) => void;
  selectedSchool: string | null;
  autoFocus?: boolean;
}

export function SearchBar({ onSchoolSelect, selectedSchool, autoFocus }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  // Auto-focus on mount if requested
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
      setIsOpen(true);
    }
  }, [autoFocus]);

  const allSchools = getAllUniqueSchools();
  
  // Filter schools based on query
  const filteredSchools = query.trim()
    ? allSchools.filter(school =>
        school.toLowerCase().includes(query.toLowerCase()) ||
        getSchoolMascot(school).toLowerCase().includes(query.toLowerCase())
      )
    : allSchools;

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev =>
          prev < filteredSchools.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => (prev > 0 ? prev - 1 : 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (filteredSchools[highlightedIndex]) {
          handleSelect(filteredSchools[highlightedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        inputRef.current?.blur();
        break;
    }
  };

  const handleSelect = (school: string) => {
    onSchoolSelect(school);
    setQuery('');
    setIsOpen(false);
    inputRef.current?.blur();
  };

  const handleClear = () => {
    setQuery('');
    onSchoolSelect(null as unknown as string);
    inputRef.current?.focus();
  };

  // Reset highlighted index when filtered results change
  useEffect(() => {
    setHighlightedIndex(0);
  }, [query]);

  // Scroll highlighted item into view
  useEffect(() => {
    if (listRef.current && isOpen) {
      const highlightedEl = listRef.current.children[highlightedIndex] as HTMLElement;
      highlightedEl?.scrollIntoView({ block: 'nearest' });
    }
  }, [highlightedIndex, isOpen]);

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onBlur={() => {
            // Delay to allow click on list item
            setTimeout(() => setIsOpen(false), 150);
          }}
          onKeyDown={handleKeyDown}
          placeholder="Search schools..."
          className="w-full pl-9 pr-8 py-2 text-sm bg-gray-100 dark:bg-gray-800 border border-transparent focus:border-blue-500 focus:bg-white dark:focus:bg-gray-900 rounded-lg outline-none transition-colors"
          aria-label="Search schools"
          aria-expanded={isOpen}
          aria-controls="school-search-results"
          role="combobox"
        />
        {(query || selectedSchool) && (
          <button
            onClick={handleClear}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full"
            aria-label="Clear search"
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>
        )}
      </div>

      {/* Selected school indicator */}
      {selectedSchool && !isOpen && (
        <div className="absolute left-0 right-0 -bottom-6 text-xs text-center">
          <span
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full"
            style={{
              backgroundColor: `${getSchoolColor(selectedSchool)}20`,
              color: getSchoolColor(selectedSchool),
            }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: getSchoolColor(selectedSchool) }}
            />
            {selectedSchool}
          </span>
        </div>
      )}

      {/* Dropdown results */}
      <AnimatePresence>
        {isOpen && filteredSchools.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute z-[60] left-0 right-0 mt-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 max-h-64 overflow-hidden"
          >
            <ul
              ref={listRef}
              id="school-search-results"
              role="listbox"
              className="overflow-y-auto max-h-64"
            >
              {filteredSchools.map((school, index) => {
                const mascot = getSchoolMascot(school);
                const color = getSchoolColor(school);
                const isHighlighted = index === highlightedIndex;
                const isSelected = school === selectedSchool;

                return (
                  <li
                    key={school}
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => handleSelect(school)}
                    className={`flex items-center gap-3 px-3 py-2 cursor-pointer transition-colors ${
                      isHighlighted
                        ? 'bg-blue-50 dark:bg-blue-900/30'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                    } ${isSelected ? 'bg-blue-100 dark:bg-blue-900/50' : ''}`}
                  >
                    <span
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: color }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">{school}</div>
                      {/* Mascot hidden until historical data is available
                      <div className="text-xs text-gray-500 truncate">{mascot}</div>
                      */}
                    </div>
                    {isSelected && (
                      <span className="text-xs text-blue-600 font-medium">Selected</span>
                    )}
                  </li>
                );
              })}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>

      {/* No results */}
      <AnimatePresence>
        {isOpen && query && filteredSchools.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute z-50 left-0 right-0 mt-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4 text-center"
          >
            <p className="text-sm text-gray-500">No schools found for "{query}"</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
