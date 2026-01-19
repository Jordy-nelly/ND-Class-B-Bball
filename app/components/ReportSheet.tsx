'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence, useMotionValue, PanInfo } from 'motion/react';
import { X } from 'lucide-react';
import { getAllUniqueSchools, getSchoolMascot } from '../lib/dataParser';

interface ReportSheetProps {
  isOpen: boolean;
  onClose: () => void;
  district: number | 'all';
}

export function ReportSheet({ isOpen, onClose, district }: ReportSheetProps) {
  const [details, setDetails] = useState('');
  const [selectedSchools, setSelectedSchools] = useState<string[]>([]);
  const [schoolQuery, setSchoolQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const y = useMotionValue(0);

  const allSchools = useMemo(() => getAllUniqueSchools(district), [district]);

  const filteredSchools = useMemo(() => {
    if (!schoolQuery.trim()) return [];
    return allSchools
      .filter(school => 
        !selectedSchools.includes(school) &&
        (school.toLowerCase().includes(schoolQuery.toLowerCase()) ||
         getSchoolMascot(school).toLowerCase().includes(schoolQuery.toLowerCase()))
      )
      .slice(0, 8);
  }, [schoolQuery, allSchools, selectedSchools]);

  useEffect(() => {
    setHighlightedIndex(0);
  }, [filteredSchools]);

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.y > 100 || info.velocity.y > 500) {
      onClose();
    }
  };

  const handleSelectSchool = (school: string) => {
    setSelectedSchools(prev => [...prev, school]);
    setSchoolQuery('');
    setShowDropdown(false);
    inputRef.current?.focus();
  };

  const handleRemoveSchool = (school: string) => {
    setSelectedSchools(prev => prev.filter(s => s !== school));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex(i => Math.min(i + 1, filteredSchools.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && filteredSchools[highlightedIndex]) {
      e.preventDefault();
      handleSelectSchool(filteredSchools[highlightedIndex]);
    } else if (e.key === 'Escape') {
      setShowDropdown(false);
    } else if (e.key === 'Backspace' && !schoolQuery && selectedSchools.length > 0) {
      handleRemoveSchool(selectedSchools[selectedSchools.length - 1]);
    }
  };

  const handleSubmit = () => {
    // For now, just close the sheet
    setDetails('');
    setSelectedSchools([]);
    setSchoolQuery('');
    onClose();
  };

  // Reset form when sheet closes
  useEffect(() => {
    if (!isOpen) {
      setDetails('');
      setSelectedSchools([]);
      setSchoolQuery('');
    }
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/30 z-[60]"
          />

          {/* Sheet */}
          <motion.div
            ref={sheetRef}
            style={{ y }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.5 }}
            onDragEnd={handleDragEnd}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'tween', duration: 0.3, ease: 'easeOut' }}
            className="fixed bottom-0 left-0 right-0 z-[61] bg-gray-100 dark:bg-gray-800 rounded-t-[32px] shadow-2xl"
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 bg-gray-300 dark:bg-gray-600 rounded-full" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-4 pb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Report inaccuracy
              </h2>
              <button
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-300 dark:border-gray-600"
                aria-label="Close"
              >
                <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              </button>
            </div>

            {/* Content */}
            <div className="px-4 pb-6 space-y-4">
              {/* Details textarea */}
              <textarea
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="Details about inaccuracy"
                className="w-full h-24 px-4 py-3 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />

              {/* School multi-select */}
              <div className="relative">
                <div className="flex flex-wrap gap-2 p-3 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl min-h-[44px]">
                  {/* Selected school tags */}
                  {selectedSchools.map(school => (
                    <span
                      key={school}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-md text-sm"
                    >
                      {school}
                      <button
                        onClick={() => handleRemoveSchool(school)}
                        className="hover:text-blue-600 dark:hover:text-blue-300"
                        aria-label={`Remove ${school}`}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                  
                  {/* Input */}
                  <input
                    ref={inputRef}
                    type="text"
                    value={schoolQuery}
                    onChange={(e) => {
                      setSchoolQuery(e.target.value);
                      setShowDropdown(true);
                    }}
                    onFocus={() => setShowDropdown(true)}
                    onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
                    onKeyDown={handleKeyDown}
                    placeholder={selectedSchools.length === 0 ? 'Add schools' : ''}
                    className="flex-1 min-w-[100px] bg-transparent text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none"
                    aria-label="Add schools"
                    aria-expanded={showDropdown}
                    role="combobox"
                  />
                </div>

                {/* Dropdown */}
                <AnimatePresence>
                  {showDropdown && filteredSchools.length > 0 && (
                    <motion.ul
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      className="absolute left-0 right-0 mt-1 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl shadow-lg overflow-hidden z-10 max-h-48 overflow-y-auto"
                      role="listbox"
                    >
                      {filteredSchools.map((school, index) => (
                        <li
                          key={school}
                          onClick={() => handleSelectSchool(school)}
                          className={`px-4 py-2 cursor-pointer ${
                            index === highlightedIndex
                              ? 'bg-blue-100 dark:bg-blue-900'
                              : 'hover:bg-gray-100 dark:hover:bg-gray-600'
                          }`}
                          role="option"
                          aria-selected={index === highlightedIndex}
                        >
                          <span className="text-gray-900 dark:text-white">{school}</span>
                          <span className="text-gray-500 dark:text-gray-400 text-sm ml-2">
                            {getSchoolMascot(school)}
                          </span>
                        </li>
                      ))}
                    </motion.ul>
                  )}
                </AnimatePresence>
              </div>

              {/* Submit button */}
              <button
                onClick={handleSubmit}
                className="w-full py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-semibold rounded-xl hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
              >
                Submit
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
