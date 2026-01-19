'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import * as Dialog from '@radix-ui/react-dialog';
import { X, MapPin, Users, Calendar, Award, ChevronDown, Crosshair } from 'lucide-react';
import {
  getSchoolMascot,
  getSchoolActiveYears,
  isSchoolActive,
  normalizeCoopName,
} from '../lib/dataParser';
import { getDistrictForSchool } from '../data/allDistricts';
import { getSchoolColor, getRegionColor } from '../lib/colors';
import { schoolCoordinates } from '../data/schoolCoordinates';
import { schoolInfo, CoopInfo } from '../data/allDistricts';
import { MIN_YEAR, MAX_YEAR } from '../types';
import { useMediaQuery } from '../hooks/useMediaQuery';

interface SchoolDetailProps {
  school: string | null;
  currentYear: number;
  onClose: () => void;
  isMinimized?: boolean;
  onRecenter?: () => void;
}

export function SchoolDetail({ school, currentYear, onClose, isMinimized, onRecenter }: SchoolDetailProps) {
  const { isMobile } = useMediaQuery();
  
  // Accordion state for co-op history - must be before any conditional returns
  const [expandedCoops, setExpandedCoops] = useState<Set<string>>(new Set());
  
  const toggleCoop = (coopName: string) => {
    setExpandedCoops(prev => {
      const next = new Set(prev);
      if (next.has(coopName)) {
        next.delete(coopName);
      } else {
        next.add(coopName);
      }
      return next;
    });
  };
  
  if (!school) return null;

  const mascot = getSchoolMascot(school);
  const activeYears = getSchoolActiveYears(school);
  const isCurrentlyActive = isSchoolActive(school, currentYear);
  const schoolColor = getSchoolColor(school);
  const coordinates = schoolCoordinates.find(s => s.name === school);
  
  // Get the district for this school in the current year
  const schoolDistrict = getDistrictForSchool(school, currentYear);
  
  // Get co-op history for this school (boys basketball only)
  const coopHistory: CoopInfo[] = schoolInfo[school]?.coopHistory?.filter(
    (c) => c.gender === 'boys' && c.sport === 'basketball'
  ) || [];

  const yearRange = activeYears.length > 0
    ? `${Math.min(...activeYears)} - ${Math.max(...activeYears)}`
    : 'N/A';

  return (
    <Dialog.Root 
      open={!!school} 
      onOpenChange={(open) => !open && onClose()}
      modal={!isMobile} // Non-modal on mobile to allow map interaction
    >
      <Dialog.Portal>
        {/* Only show overlay on desktop - mobile shows sheet over visible map */}
        {!isMobile && (
          <Dialog.Overlay asChild>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-[56]"
            />
          </Dialog.Overlay>
        )}
        
        <Dialog.Content asChild>
          <motion.div
            initial={isMobile ? { y: '100%' } : { x: '100%' }}
            animate={isMobile ? { y: 0, height: isMinimized ? 'auto' : '50vh' } : { x: 0 }}
            exit={isMobile ? { y: '100%' } : { x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className={`fixed bg-white dark:bg-gray-900 shadow-2xl z-[57] overflow-hidden ${
              isMobile
                ? 'inset-x-0 bottom-0 rounded-t-2xl'
                : 'top-0 right-0 bottom-0 w-96'
            }`}
            style={isMobile && !isMinimized ? { maxHeight: '50vh' } : undefined}
          >
            {/* Header */}
                <div
                  className="relative p-6 text-white"
                  style={{ backgroundColor: schoolColor }}
                >
                  {/* Drag handle for mobile */}
                  {isMobile && (
                    <div className="absolute top-2 left-1/2 -translate-x-1/2 w-12 h-1 bg-white/30 rounded-full" />
                  )}
              
              <Dialog.Close asChild>
                <button
                  className="absolute top-4 right-4 p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </Dialog.Close>
              
              <Dialog.Title className="text-2xl font-bold mt-2">
                {school}
              </Dialog.Title>
              
              {/* Mascot hidden until historical data is available
              <div className="flex items-center gap-2 mt-2 text-white/90">
                <Award className="w-4 h-4" />
                <span className="text-lg">{mascot}</span>
              </div>
              */}
              
              <div
                className={`inline-flex items-center gap-1 mt-3 px-3 py-1 rounded-full text-sm font-medium ${
                  isCurrentlyActive
                    ? 'bg-green-500/20 text-green-100'
                    : 'bg-red-500/20 text-red-100'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    isCurrentlyActive ? 'bg-green-400' : 'bg-red-400'
                  }`}
                />
                {isCurrentlyActive
                  ? `Active in ${currentYear}`
                  : `Not active (${currentYear})`}
              </div>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(85vh-200px)] md:max-h-[calc(100vh-200px)]">
              {/* Location */}
              {coordinates && (
                <div className="flex items-start gap-3 mb-6">
                  <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800">
                    <MapPin className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Location</div>
                    <div className="font-medium">{coordinates.city}, ND</div>
                  </div>
                </div>
              )}

              {/* Years in District */}
              <div className="flex items-start gap-3 mb-6">
                <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800">
                  <Calendar className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </div>
                <div>
                  <div className="text-sm text-gray-500">Years Active</div>
                  <div className="font-medium">{yearRange}</div>
                  <div className="text-sm text-gray-400">
                    {activeYears.length} year{activeYears.length !== 1 ? 's' : ''} total
                  </div>
                </div>
              </div>

              {/* District badge */}
              <div className="flex items-start gap-3 mb-6">
                <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800">
                  <Users className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </div>
                <div>
                  <div className="text-sm text-gray-500">District</div>
                  {schoolDistrict ? (
                    <div
                      className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium"
                      style={{
                        backgroundColor: `${getRegionColor(schoolDistrict, currentYear)}20`,
                        color: getRegionColor(schoolDistrict, currentYear),
                      }}
                    >
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: getRegionColor(schoolDistrict, currentYear) }}
                      />
                      District {schoolDistrict}
                    </div>
                  ) : (
                    <div className="text-sm text-gray-400">Not assigned</div>
                  )}
                </div>
              </div>

              {/* Co-op History (Boys Basketball) */}
              {coopHistory.length > 0 && (
                <div className="flex items-start gap-3 mb-6">
                  <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800">
                    <Users className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm text-gray-500 mb-2">Boys Basketball Co-ops</div>
                    <div className="space-y-2">
                      {coopHistory.map((coop) => (
                        <div
                          key={coop.coopName}
                          className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
                        >
                          <button
                            onClick={() => toggleCoop(coop.coopName)}
                            className="w-full flex items-center justify-between px-3 py-2 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                          >
                            <span className="font-medium text-sm text-gray-800 dark:text-gray-200">
                              {normalizeCoopName(coop.coopName)}
                            </span>
                            <ChevronDown
                              className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${
                                expandedCoops.has(coop.coopName) ? 'rotate-180' : ''
                              }`}
                            />
                          </button>
                          <AnimatePresence>
                            {expandedCoops.has(coop.coopName) && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="overflow-hidden"
                              >
                                <div className="px-3 py-2 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
                                  <div className="text-xs text-gray-500 mb-1">Partner Schools</div>
                                  <div className="flex flex-wrap gap-1 mb-2">
                                    {coop.schools.map((s) => (
                                      <span
                                        key={s}
                                        className={`px-2 py-0.5 rounded text-xs font-medium ${
                                          s === school
                                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                                            : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                                        }`}
                                      >
                                        {s}
                                      </span>
                                    ))}
                                  </div>
                                  <div className="text-xs text-gray-500">Years Active</div>
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {coop.yearsActive.sort((a, b) => a - b).map((year) => (
                                      <span
                                        key={year}
                                        className="px-2 py-0.5 rounded text-xs bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                                      >
                                        {year}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Timeline visualization */}
              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
                  Activity Timeline
                </h3>
                
                <div className="relative">
                  {/* Timeline track */}
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    {/* Active years segments */}
                    {getYearSegments(activeYears).map((segment, i) => (
                      <div
                        key={i}
                        className="absolute h-3 rounded-full"
                        style={{
                          backgroundColor: schoolColor,
                          left: `${((segment.start - MIN_YEAR) / (MAX_YEAR - MIN_YEAR)) * 100}%`,
                          width: `${((segment.end - segment.start + 1) / (MAX_YEAR - MIN_YEAR + 1)) * 100}%`,
                        }}
                      />
                    ))}
                    
                    {/* Current year marker */}
                    <div
                      className="absolute top-1/2 -translate-y-1/2 w-1 h-5 bg-gray-800 dark:bg-white rounded-full"
                      style={{
                        left: `${((currentYear - MIN_YEAR) / (MAX_YEAR - MIN_YEAR)) * 100}%`,
                      }}
                    />
                  </div>
                  
                  {/* Year labels */}
                  <div className="flex justify-between mt-2 text-xs text-gray-400">
                    <span>{MIN_YEAR}</span>
                    <span>{MAX_YEAR}</span>
                  </div>
                </div>

                {/* Year list */}
                <div className="mt-4 flex flex-wrap gap-1">
                  {activeYears.map((y) => (
                    <span
                      key={y}
                      className={`px-2 py-0.5 rounded text-xs font-medium ${
                        y === currentYear
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                      }`}
                    >
                      {y}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

// Helper to get continuous year segments
function getYearSegments(years: number[]): { start: number; end: number }[] {
  if (years.length === 0) return [];
  
  const sorted = [...years].sort((a, b) => a - b);
  const segments: { start: number; end: number }[] = [];
  
  let start = sorted[0];
  let end = sorted[0];
  
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] === end + 1) {
      end = sorted[i];
    } else {
      segments.push({ start, end });
      start = sorted[i];
      end = sorted[i];
    }
  }
  
  segments.push({ start, end });
  return segments;
}
