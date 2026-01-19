'use client';

import { useRef, useEffect, ReactNode } from 'react';
import { motion, useMotionValue, useTransform, PanInfo } from 'motion/react';

interface BottomSheetProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
  snapPoints?: number[]; // Heights as percentages [0.25, 0.5, 0.9]
}

export function BottomSheet({
  isOpen,
  onOpenChange,
  children,
  snapPoints = [0.15, 0.5, 0.9],
}: BottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const y = useMotionValue(0);
  
  // Get window height for calculations
  const windowHeight = typeof window !== 'undefined' ? window.innerHeight : 800;
  
  // Convert snap points to pixel values (from top)
  const snapPixels = snapPoints.map((p) => windowHeight * (1 - p));
  
  // Calculate opacity based on position
  const overlayOpacity = useTransform(
    y,
    [snapPixels[snapPixels.length - 1], snapPixels[0]],
    [0.5, 0]
  );

  const handleDragEnd = (_: any, info: PanInfo) => {
    const currentY = y.get();
    const velocity = info.velocity.y;
    
    // Find closest snap point
    let closestSnap = snapPixels[0];
    let minDistance = Math.abs(currentY - snapPixels[0]);
    
    for (const snap of snapPixels) {
      const distance = Math.abs(currentY - snap);
      if (distance < minDistance) {
        minDistance = distance;
        closestSnap = snap;
      }
    }
    
    // If swiping down fast and at lowest point, close
    if (velocity > 500 && currentY > snapPixels[0]) {
      onOpenChange(false);
      return;
    }
    
    // If swiping up fast, go to highest snap
    if (velocity < -500) {
      closestSnap = snapPixels[snapPixels.length - 1];
    }
    
    // Snap to closest point
    y.set(closestSnap);
  };

  // Set initial position when opening
  useEffect(() => {
    if (isOpen) {
      y.set(snapPixels[0]);
    }
  }, [isOpen, y, snapPixels]);

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <motion.div
        style={{ opacity: overlayOpacity }}
        className="fixed inset-0 bg-black z-[56] pointer-events-none"
      />
      
      {/* Sheet */}
      <motion.div
        ref={sheetRef}
        style={{ y }}
        drag="y"
        dragConstraints={{
          top: snapPixels[snapPixels.length - 1],
          bottom: windowHeight,
        }}
        dragElastic={0.1}
        onDragEnd={handleDragEnd}
        className="fixed inset-x-0 bottom-0 z-[57] bg-white dark:bg-gray-900 rounded-t-2xl shadow-2xl touch-pan-y"
        initial={{ y: windowHeight }}
        animate={{ y: snapPixels[0] }}
        exit={{ y: windowHeight }}
      >
        {/* Drag handle */}
        <div className="flex justify-center py-3">
          <div className="w-12 h-1.5 bg-gray-300 dark:bg-gray-600 rounded-full" />
        </div>
        
        {/* Content */}
        <div
          className="overflow-y-auto"
          style={{ maxHeight: `${snapPoints[snapPoints.length - 1] * 100}vh` }}
        >
          {children}
        </div>
      </motion.div>
    </>
  );
}
