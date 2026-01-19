'use client';

import { motion, AnimatePresence } from 'motion/react';
import { Flag, Layers, Crosshair } from 'lucide-react';

interface FloatingActionsProps {
  onReportClick: () => void;
  onLayersClick: () => void;
  onRecenterClick?: () => void;
  showRecenter?: boolean;
}

export function FloatingActions({
  onReportClick,
  onLayersClick,
  onRecenterClick,
  showRecenter = false,
}: FloatingActionsProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="fixed right-4 bottom-[218px] z-30 flex flex-col gap-3"
    >
      {/* Report FAB */}
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={onReportClick}
        className="w-12 h-12 flex items-center justify-center rounded-full bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl shadow-lg shadow-black/5 border border-white/20"
        aria-label="Report inaccuracy"
      >
        <Flag className="w-5 h-5 text-gray-700 dark:text-gray-300" />
      </motion.button>

      {/* Recenter FAB - only visible when school is selected */}
      <AnimatePresence>
        {showRecenter && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            whileTap={{ scale: 0.9 }}
            onClick={onRecenterClick}
            className="w-12 h-12 flex items-center justify-center rounded-full bg-blue-500 shadow-lg shadow-blue-500/25 border border-blue-400/20"
            aria-label="Recenter on selected school"
          >
            <Crosshair className="w-5 h-5 text-white" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Layers FAB */}
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={onLayersClick}
        className="w-12 h-12 flex items-center justify-center rounded-full bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl shadow-lg shadow-black/5 border border-white/20"
        aria-label="Map layers"
      >
        <Layers className="w-5 h-5 text-gray-700 dark:text-gray-300" />
      </motion.button>
    </motion.div>
  );
}
