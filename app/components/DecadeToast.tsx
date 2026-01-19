'use client';

import { motion, AnimatePresence } from 'motion/react';
import { useEffect, useState, useCallback, useRef } from 'react';

interface DecadeToastProps {
  year: number;
  isPlaying: boolean;
  schoolCount: number;
  coopCount: number;
  getStatsForYear: (year: number) => { schools: number; coops: number };
  onToastVisibilityChange?: (isVisible: boolean) => void;
  onPlaybackStop?: () => void;
}

// Decade milestone years
const DECADE_YEARS = [1972, 1980, 1990, 2000, 2010, 2012];

export function DecadeToast({ 
  year, 
  isPlaying, 
  schoolCount, 
  coopCount,
  getStatsForYear,
  onToastVisibilityChange,
  onPlaybackStop
}: DecadeToastProps) {
  const [toast, setToast] = useState<{ message: string; subMessage?: string } | null>(null);
  const [lastShownYear, setLastShownYear] = useState<number | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const onVisibilityChangeRef = useRef(onToastVisibilityChange);
  const onPlaybackStopRef = useRef(onPlaybackStop);
  
  // Keep refs updated
  useEffect(() => {
    onVisibilityChangeRef.current = onToastVisibilityChange;
    onPlaybackStopRef.current = onPlaybackStop;
  }, [onToastVisibilityChange, onPlaybackStop]);

  // Notify parent when toast visibility changes
  const showToast = useCallback((toastData: { message: string; subMessage?: string }) => {
    setToast(toastData);
    onVisibilityChangeRef.current?.(true);
  }, []);

  const hideToast = useCallback(() => {
    setToast(null);
    onVisibilityChangeRef.current?.(false);
  }, []);

  // Clear any existing timer
  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => {
    // Only show toasts when playing and hitting a decade year
    if (!isPlaying) {
      setLastShownYear(null);
      return;
    }

    // Check if current year is a decade milestone and we haven't shown it yet
    if (DECADE_YEARS.includes(year) && lastShownYear !== year) {
      setLastShownYear(year);
      
      // Get 1972 stats for comparison
      const stats1972 = getStatsForYear(1972);
      const schoolChangeSince1972 = schoolCount - stats1972.schools;
      const schoolChangePercentSince1972 = stats1972.schools > 0 
        ? Math.round((schoolChangeSince1972 / stats1972.schools) * 100) 
        : 0;
      
      // Get previous decade stats for co-ops formed this decade
      const prevDecadeYear = DECADE_YEARS[DECADE_YEARS.indexOf(year) - 1] || 1972;
      const prevStats = getStatsForYear(prevDecadeYear);
      const coopsFormedThisDecade = coopCount - prevStats.coops;
      
      let message = '';
      let subMessage = '';

      if (year === 1972) {
        message = `1972: ${schoolCount} Class B schools`;
        if (coopCount > 0) {
          subMessage = `${coopCount} co-op${coopCount !== 1 ? 's' : ''} active`;
        } else {
          subMessage = 'No cooperative teams yet';
        }
      } else if (year === 2012) {
        // Final summary
        message = `2012: ${schoolCount} schools`;
        subMessage = `${coopsFormedThisDecade >= 0 ? '+' : ''}${coopsFormedThisDecade} co-ops this decade • ${coopCount} total co-ops • ${schoolChangePercentSince1972}% since '72`;
      } else {
        // Regular decade milestones
        message = `${year}: ${schoolCount} schools`;
        subMessage = `${coopsFormedThisDecade >= 0 ? '+' : ''}${coopsFormedThisDecade} co-ops this decade • ${coopCount} total co-ops • ${schoolChangePercentSince1972}% since '72`;
      }

      showToast({ message, subMessage });

      // Clear any existing timer and set new one
      clearTimer();
      timerRef.current = setTimeout(() => {
        hideToast();
        // Stop playback after 2012 toast is dismissed
        if (year === 2012) {
          onPlaybackStopRef.current?.();
        }
      }, 8000);
    }
  }, [year, isPlaying, schoolCount, coopCount, lastShownYear, getStatsForYear, showToast, hideToast, clearTimer]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => clearTimer();
  }, [clearTimer]);

  // Reset when playback stops
  useEffect(() => {
    if (!isPlaying) {
      clearTimer();
      hideToast();
    }
  }, [isPlaying, hideToast, clearTimer]);

  return (
    <AnimatePresence>
      {toast && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="fixed bottom-4 left-4 right-4 md:left-1/2 md:-translate-x-1/2 md:max-w-md z-[200] pointer-events-none pb-safe"
        >
          <div className="bg-gray-900/95 dark:bg-gray-800/95 backdrop-blur-md text-white rounded-2xl px-5 py-4 shadow-2xl border border-white/10">
            {/* Progress bar */}
            <motion.div
              initial={{ scaleX: 1 }}
              animate={{ scaleX: 0 }}
              transition={{ duration: 8, ease: 'linear' }}
              className="absolute top-0 left-0 right-0 h-1 bg-blue-500 rounded-t-2xl origin-left"
            />
            
            <p className="text-base font-semibold text-center">
              {toast.message}
            </p>
            {toast.subMessage && (
              <p className="text-sm text-gray-300 text-center mt-1">
                {toast.subMessage}
              </p>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
