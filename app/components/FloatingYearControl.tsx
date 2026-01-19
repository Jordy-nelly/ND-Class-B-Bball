'use client';

import { useEffect, useRef, useCallback, useMemo } from 'react';
import * as Select from '@radix-ui/react-select';
import * as Slider from '@radix-ui/react-slider';
import { motion, AnimatePresence, useMotionValue, PanInfo } from 'motion/react';
import { ChevronUp, ChevronDown, Play, Pause, Check } from 'lucide-react';
import { useSwipeGesture } from '../hooks/useSwipeGesture';
import { EventLog } from './EventLog';

interface FloatingYearControlProps {
  year: number;
  onYearChange: (year: number) => void;
  isPlaying: boolean;
  onPlayToggle: () => void;
  minYear: number;
  maxYear: number;
  schoolCount: number;
  coopCount: number;
  district: number | 'all';
  onSchoolSelect: (school: string | null) => void;
  showEventLog: boolean;
  onShowEventLogChange: (show: boolean) => void;
  isPaused?: boolean;
}

export function FloatingYearControl({
  year,
  onYearChange,
  isPlaying,
  onPlayToggle,
  minYear,
  maxYear,
  schoolCount,
  coopCount,
  district,
  onSchoolSelect,
  showEventLog,
  onShowEventLogChange,
  isPaused = false,
}: FloatingYearControlProps) {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const y = useMotionValue(0);

  // Decade milestone years that pause for toast
  const DECADE_YEARS = [1972, 1980, 1990, 2000, 2010, 2012];
  const isDecadeYear = DECADE_YEARS.includes(year);

  // Auto-advance when playing (pause when toast is visible or at decade years waiting for toast)
  useEffect(() => {
    // Don't advance if paused (toast is showing)
    if (!isPlaying || isPaused) {
      if (intervalRef.current) {
        clearTimeout(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // If at a decade year, wait a brief moment for toast to trigger isPaused
    // This prevents race condition where timer fires before toast can pause
    const delay = isDecadeYear ? 100 : 1500;
    
    intervalRef.current = setTimeout(() => {
      // Double-check we're still not paused (toast may have appeared)
      if (!isPaused) {
        onYearChange(year >= maxYear ? minYear : year + 1);
      }
    }, delay);

    return () => {
      if (intervalRef.current) {
        clearTimeout(intervalRef.current);
      }
    };
  }, [isPlaying, isPaused, year, onYearChange, minYear, maxYear, isDecadeYear]);

  const handlePrevYear = useCallback(() => {
    if (year > minYear) {
      onYearChange(year - 1);
    }
  }, [year, onYearChange, minYear]);

  const handleNextYear = useCallback(() => {
    if (year < maxYear) {
      onYearChange(year + 1);
    }
  }, [year, onYearChange, maxYear]);

  // Generate array of years for dropdown
  const years = useMemo(() => {
    const arr = [];
    for (let y = maxYear; y >= minYear; y--) {
      arr.push(y);
    }
    return arr;
  }, [minYear, maxYear]);

  const swipeHandlers = useSwipeGesture({
    onSwipeUp: () => onShowEventLogChange(true),
  });

  const handleSheetDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.y > 100 || info.velocity.y > 500) {
      onShowEventLogChange(false);
    }
  };

  // Generate decade labels for timeline
  const decades = useMemo(() => {
    const decadeList = [];
    const startDecade = Math.floor(minYear / 10) * 10;
    const endDecade = Math.floor(maxYear / 10) * 10;
    for (let d = startDecade; d <= endDecade; d += 10) {
      decadeList.push(d);
    }
    return decadeList;
  }, [minYear, maxYear]);

  // Shared play button + year dropdown component
  const PlayYearControl = ({ size = 'normal' }: { size?: 'normal' | 'small' }) => (
    <div className="flex items-center gap-1">
      {/* Play/Pause button */}
      <button
        onClick={onPlayToggle}
        className={`rounded-full flex items-center justify-center hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors ${
          size === 'small' ? 'w-8 h-8' : 'w-10 h-10 bg-gray-300 dark:bg-gray-600'
        }`}
        aria-label={isPlaying ? 'Pause' : 'Play'}
      >
        {isPlaying ? (
          <Pause className={size === 'small' ? 'w-4 h-4' : 'w-5 h-5'} />
        ) : (
          <Play className={`${size === 'small' ? 'w-4 h-4' : 'w-5 h-5'} ml-0.5`} />
        )}
      </button>

      {/* Year dropdown */}
      <Select.Root
        value={String(year)}
        onValueChange={(value) => onYearChange(Number(value))}
      >
        <Select.Trigger
          className={`inline-flex items-center gap-1 px-2 py-1 text-gray-900 dark:text-white font-medium ${
            size === 'small' ? 'text-base' : 'text-lg'
          }`}
          aria-label="Select year"
        >
          <Select.Value />
          <Select.Icon>
            <ChevronDown className="w-4 h-4 text-gray-500" />
          </Select.Icon>
        </Select.Trigger>

        <Select.Portal>
          <Select.Content
            className="overflow-hidden bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-[60]"
            position="popper"
            sideOffset={5}
          >
            <Select.ScrollUpButton className="flex items-center justify-center h-6 bg-white dark:bg-gray-800 cursor-default">
              <ChevronUp className="w-4 h-4" />
            </Select.ScrollUpButton>
            <Select.Viewport className="p-1 max-h-60">
              {years.map((y) => (
                <Select.Item
                  key={y}
                  value={String(y)}
                  className="relative flex items-center px-8 py-2 text-sm rounded text-gray-900 dark:text-white data-[highlighted]:bg-blue-100 dark:data-[highlighted]:bg-blue-900 data-[highlighted]:outline-none cursor-pointer"
                >
                  <Select.ItemText>{y}</Select.ItemText>
                  <Select.ItemIndicator className="absolute left-2 inline-flex items-center">
                    <Check className="w-4 h-4" />
                  </Select.ItemIndicator>
                </Select.Item>
              ))}
            </Select.Viewport>
            <Select.ScrollDownButton className="flex items-center justify-center h-6 bg-white dark:bg-gray-800 cursor-default">
              <ChevronDown className="w-4 h-4" />
            </Select.ScrollDownButton>
          </Select.Content>
        </Select.Portal>
      </Select.Root>
    </div>
  );

  return (
    <>
      {/* Year picker - animates from bottom to top as sheet opens */}
      <motion.div
        layout
        className={`fixed z-[55] left-4 ${
          showEventLog 
            ? 'top-24' 
            : 'bottom-24 right-4'
        }`}
        transition={{ 
          layout: { type: 'spring', damping: 30, stiffness: 350 }
        }}
      >
        <motion.div 
          layout
          className="shadow-lg shadow-black/5 overflow-hidden bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl border border-white/20"
          style={{
            borderRadius: showEventLog ? 9999 : 32,
          }}
          transition={{ 
            layout: { type: 'spring', damping: 30, stiffness: 350 }
          }}
        >
          <motion.div 
            layout
            className="flex flex-col"
            style={{
              padding: showEventLog ? '6px 10px' : '12px 14px',
            }}
            transition={{ 
              layout: { type: 'spring', damping: 30, stiffness: 350 }
            }}
          >
            {/* Top row: Play button and year dropdown */}
            <PlayYearControl size={showEventLog ? 'small' : 'normal'} />

            {/* Timeline slider with decade labels - collapses when sheet opens */}
            <motion.div 
              className="overflow-hidden"
              initial={false}
              animate={{
                height: showEventLog ? 0 : 38,
                opacity: showEventLog ? 0 : 1,
                marginTop: showEventLog ? 0 : 4,
              }}
              transition={{ 
                type: 'spring', 
                damping: 30, 
                stiffness: 350,
              }}
            >
              {/* Slider container with padding for thumb */}
              <div className="px-2">
                <Slider.Root
                  className="relative flex items-center select-none touch-none w-full h-5"
                  value={[year]}
                  onValueChange={([value]) => onYearChange(value)}
                  min={minYear}
                  max={maxYear}
                  step={1}
                >
                  <Slider.Track className="bg-gray-400/30 dark:bg-gray-500/30 relative grow rounded-full h-1">
                    <Slider.Range className="absolute bg-blue-600 rounded-full h-full" />
                  </Slider.Track>
                  <Slider.Thumb
                    className="block w-4 h-4 bg-white border-2 border-gray-400 rounded-full shadow-md hover:border-gray-500 focus:outline-none cursor-pointer touch-manipulation"
                    aria-label="Year"
                  />
                </Slider.Root>
              </div>
              
              {/* Decade labels - positioned to match slider */}
              <div className="relative mt-0.5 h-4 px-2">
                {decades.map((decade, index) => {
                  // Calculate position as percentage of slider range
                  const clampedDecade = Math.max(minYear, Math.min(maxYear, decade));
                  const percentage = ((clampedDecade - minYear) / (maxYear - minYear)) * 100;
                  // First label aligns left, last aligns right, middle centers
                  const isFirst = index === 0;
                  const isLast = index === decades.length - 1;
                  return (
                    <span
                      key={decade}
                      className={`absolute text-xs text-gray-500 dark:text-gray-400 ${
                        isFirst ? '' : isLast ? '-translate-x-full' : '-translate-x-1/2'
                      }`}
                      style={{ left: `${percentage}%` }}
                    >
                      {decade}
                    </span>
                  );
                })}
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Collapsed summary bar */}
      <AnimatePresence>
        {!showEventLog && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-0 left-0 right-0 z-30 px-4 pb-safe"
            {...swipeHandlers}
          >
            <button
              onClick={() => onShowEventLogChange(true)}
              className="w-full rounded-t-[32px] bg-white dark:bg-gray-900 shadow-lg shadow-black/10 px-4 py-3"
            >
              {/* Drag handle */}
              <div className="flex justify-center mb-2">
                <div className="w-10 h-1 bg-gray-300 dark:bg-gray-600 rounded-full" />
              </div>
              
              {/* Stats summary */}
              <div className="text-left">
                <p className="text-base font-semibold text-gray-900 dark:text-white">
                  {schoolCount} Schools statewide
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {coopCount} Schools Cooped in {year}
                </p>
              </div>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Expanded Event Log Sheet */}
      <AnimatePresence>
        {showEventLog && (
          <>
            {/* Sheet */}
            <motion.div
              ref={sheetRef}
              style={{ y }}
              drag="y"
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={{ top: 0, bottom: 0.5 }}
              onDragEnd={handleSheetDragEnd}
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'tween', duration: 0.3, ease: 'easeOut' }}
              className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 rounded-t-[32px] shadow-2xl max-h-[70vh] flex flex-col"
            >
              {/* Handle */}
              <div className="flex justify-center pt-3 pb-2 flex-shrink-0">
                <div className="w-10 h-1 bg-gray-300 dark:bg-gray-600 rounded-full" />
              </div>

              {/* Stats summary */}
              <div className="px-4 pb-3 flex-shrink-0">
                <p className="text-base font-semibold text-gray-900 dark:text-white">
                  {schoolCount} Schools statewide
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {coopCount} Schools Cooped in {year}
                </p>
              </div>

              {/* Event log content */}
              <div className="flex-1 min-h-0 overflow-y-auto">
                <EventLog
                  year={year}
                  onSchoolClick={(school) => {
                    onSchoolSelect(school);
                    onShowEventLogChange(false);
                  }}
                  district={district}
                  hideHeader
                />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
