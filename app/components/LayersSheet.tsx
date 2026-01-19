'use client';

import { motion, AnimatePresence } from 'motion/react';
import * as Switch from '@radix-ui/react-switch';
import { X, Route, MapPin, Palette } from 'lucide-react';

interface LayersSheetProps {
  isOpen: boolean;
  onClose: () => void;
  showCoopLines: boolean;
  onCoopLinesChange: (show: boolean) => void;
  useRegionColors: boolean;
  onRegionColorsChange: (use: boolean) => void;
  showDistrictBoundaries?: boolean;
  onDistrictBoundariesChange?: (show: boolean) => void;
}

export function LayersSheet({
  isOpen,
  onClose,
  showCoopLines,
  onCoopLinesChange,
  useRegionColors,
  onRegionColorsChange,
  showDistrictBoundaries = false,
  onDistrictBoundariesChange,
}: LayersSheetProps) {
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
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'tween', duration: 0.3, ease: 'easeOut' }}
            className="fixed bottom-0 left-0 right-0 z-[61] bg-white dark:bg-gray-900 rounded-t-3xl shadow-2xl pb-safe"
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 bg-gray-300 dark:bg-gray-600 rounded-full" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 pb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Map Layers
              </h2>
              <button
                onClick={onClose}
                className="p-2 -mr-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
                aria-label="Close"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Layer toggles */}
            <div className="px-5 pb-6 space-y-1">
              {/* Co-op Relationships */}
              <div className="flex items-center justify-between py-3 px-4 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 flex items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/50">
                    <Route className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">Co-op Relationships</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Show co-op lines and member schools</p>
                  </div>
                </div>
                <Switch.Root
                  checked={showCoopLines}
                  onCheckedChange={onCoopLinesChange}
                  className="w-12 h-7 bg-gray-200 dark:bg-gray-700 rounded-full relative data-[state=checked]:bg-blue-600 transition-colors"
                >
                  <Switch.Thumb className="block w-6 h-6 bg-white rounded-full shadow-md transition-transform translate-x-0.5 data-[state=checked]:translate-x-[22px]" />
                </Switch.Root>
              </div>

              {/* Region Colors */}
              <div className="flex items-center justify-between py-3 px-4 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 flex items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/50">
                    <Palette className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">Region Colors</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Color schools by geographic region</p>
                  </div>
                </div>
                <Switch.Root
                  checked={useRegionColors}
                  onCheckedChange={onRegionColorsChange}
                  className="w-12 h-7 bg-gray-200 dark:bg-gray-700 rounded-full relative data-[state=checked]:bg-purple-600 transition-colors"
                >
                  <Switch.Thumb className="block w-6 h-6 bg-white rounded-full shadow-md transition-transform translate-x-0.5 data-[state=checked]:translate-x-[22px]" />
                </Switch.Root>
              </div>

              {/* District Boundaries */}
              {onDistrictBoundariesChange && (
                <div className="flex items-center justify-between py-3 px-4 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 flex items-center justify-center rounded-full bg-green-100 dark:bg-green-900/50">
                      <MapPin className="w-5 h-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">District Boundaries</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Show district regions on map</p>
                    </div>
                  </div>
                  <Switch.Root
                    checked={showDistrictBoundaries}
                    onCheckedChange={onDistrictBoundariesChange}
                    className="w-12 h-7 bg-gray-200 dark:bg-gray-700 rounded-full relative data-[state=checked]:bg-green-600 transition-colors"
                  >
                    <Switch.Thumb className="block w-6 h-6 bg-white rounded-full shadow-md transition-transform translate-x-0.5 data-[state=checked]:translate-x-[22px]" />
                  </Switch.Root>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
