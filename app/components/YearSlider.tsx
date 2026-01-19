'use client';

import * as Slider from '@radix-ui/react-slider';
import { motion } from 'motion/react';
import { Play, Pause, ChevronLeft, ChevronRight } from 'lucide-react';
import { useSwipeGesture } from '../hooks/useSwipeGesture';
import { useMediaQuery } from '../hooks/useMediaQuery';
import { useEffect, useRef, useCallback } from 'react';

interface YearSliderProps {
  year: number;
  onYearChange: (year: number) => void;
  isPlaying: boolean;
  onPlayToggle: () => void;
  minYear?: number;
  maxYear?: number;
  isPaused?: boolean;
}

export function YearSlider({
  year,
  onYearChange,
  isPlaying,
  onPlayToggle,
  minYear = 1972,
  maxYear = 2012,
  isPaused = false,
}: YearSliderProps) {
  const { isMobile } = useMediaQuery();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

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

  // Swipe gestures for mobile
  const swipeHandlers = useSwipeGesture({
    onSwipeLeft: handleNextYear,
    onSwipeRight: handlePrevYear,
  });

  return (
    <div
      className="w-full px-4 py-3 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700"
      {...swipeHandlers}
    >
      {/* Year display - larger on mobile */}
      <div className="flex items-center justify-center gap-4 mb-3">
        <button
          onClick={handlePrevYear}
          disabled={year <= minYear}
          className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed touch-manipulation"
          aria-label="Previous year"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <motion.span
          key={year}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`font-bold text-blue-600 dark:text-blue-400 ${
            isMobile ? 'text-3xl' : 'text-2xl'
          }`}
        >
          {year}
        </motion.span>

        <button
          onClick={handleNextYear}
          disabled={year >= maxYear}
          className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed touch-manipulation"
          aria-label="Next year"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Slider */}
      <div className="flex items-center gap-3">
        <button
          onClick={onPlayToggle}
          className="p-2 rounded-full bg-blue-600 text-white hover:bg-blue-700 transition-colors touch-manipulation flex-shrink-0"
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? (
            <Pause className="w-4 h-4" />
          ) : (
            <Play className="w-4 h-4 ml-0.5" />
          )}
        </button>

        <div className="flex-1 flex items-center gap-2">
          <span className="text-xs text-gray-500 w-10">{minYear}</span>
          
          <Slider.Root
            className="relative flex items-center select-none touch-none w-full h-5"
            value={[year]}
            onValueChange={([value]) => onYearChange(value)}
            min={minYear}
            max={maxYear}
            step={1}
          >
            <Slider.Track className="bg-gray-200 dark:bg-gray-700 relative grow rounded-full h-2">
              <Slider.Range className="absolute bg-blue-600 rounded-full h-full" />
            </Slider.Track>
            <Slider.Thumb
              className={`block bg-white border-2 border-blue-600 rounded-full shadow-md hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 cursor-pointer touch-manipulation ${
                isMobile ? 'w-7 h-7' : 'w-5 h-5'
              }`}
              aria-label="Year"
            />
          </Slider.Root>
          
          <span className="text-xs text-gray-500 w-10 text-right">{maxYear}</span>
        </div>
      </div>

      {/* Year markers for desktop - dynamically generated */}
      {!isMobile && (
        <div className="flex justify-between px-12 mt-1">
          {generateYearMarkers(minYear, maxYear).map((y) => (
            <button
              key={y}
              onClick={() => onYearChange(y)}
              className={`text-xs transition-colors ${
                y === year
                  ? 'text-blue-600 font-semibold'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              {y}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// Generate evenly spaced year markers for the slider
function generateYearMarkers(minYear: number, maxYear: number): number[] {
  const range = maxYear - minYear;
  const step = Math.ceil(range / 5); // Aim for ~5 markers
  const roundedStep = step >= 10 ? Math.round(step / 5) * 5 : step; // Round to 5 for cleaner numbers
  
  const markers: number[] = [];
  let year = Math.ceil(minYear / roundedStep) * roundedStep;
  
  while (year <= maxYear) {
    if (year >= minYear) {
      markers.push(year);
    }
    year += roundedStep;
  }
  
  // Ensure we have at least start and end
  if (markers.length === 0) {
    return [minYear, maxYear];
  }
  
  return markers;
}