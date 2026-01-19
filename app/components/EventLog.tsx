'use client';

import { motion, AnimatePresence } from 'motion/react';
import { getCoopEventsForYear, getActiveMergers, getYearRangeForDistrict } from '../lib/dataParser';
import { EVENT_COLORS, EVENT_ICONS } from '../lib/colors';
import { TimelineEvent } from '../types';
import { useMediaQuery } from '../hooks/useMediaQuery';

interface EventLogProps {
  year: number;
  onSchoolClick?: (school: string) => void;
  district?: number | 'all';
  hideHeader?: boolean;
}

export function EventLog({ year, onSchoolClick, district = 'all', hideHeader = false }: EventLogProps) {
  const { isMobile } = useMediaQuery();
  const events = getCoopEventsForYear(year, district);
  const mergers = getActiveMergers(year, district);
  const yearRange = getYearRangeForDistrict(district);

  return (
    <div className="h-full flex flex-col bg-transparent">
      {/* Header - conditionally rendered */}
      {!hideHeader && (
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold">
            <span className="text-blue-600">{year}</span> Co-op Changes
          </h2>
          <p className="text-sm text-gray-500">
            {mergers.length} active co-ops{district !== 'all' ? ` in District ${district}` : ' statewide'}
          </p>
        </div>
      )}

      {/* Events list */}
      <div className="flex-1 overflow-y-auto p-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={year}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {events.length > 0 ? (
              <div className="space-y-3">
                {events.map((event, index) => (
                  <EventCard
                    key={`${event.year}-${event.type}-${event.schools.join('-')}`}
                    event={event}
                    onSchoolClick={onSchoolClick}
                    delay={index * 0.1}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-4xl mb-2">🤝</div>
                <p className="text-gray-500">
                  {year === yearRange.min
                    ? 'Start of available data'
                    : 'No co-op changes this year'}
                </p>
                {year > yearRange.min && (
                  <p className="text-sm text-gray-400 mt-1">
                    Co-op composition unchanged from {year - 1}
                  </p>
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

// Individual event card component
function EventCard({
  event,
  onSchoolClick,
  delay = 0,
}: {
  event: TimelineEvent;
  onSchoolClick?: (school: string) => void;
  delay?: number;
}) {
  const color = EVENT_COLORS[event.type];
  const icon = EVENT_ICONS[event.type];

  // For multi-school events (merges/co-ops), use the joined name to zoom to co-op center
  const handleCardClick = () => {
    if (!onSchoolClick) return;
    if (event.type === 'merge' && event.schools.length > 1) {
      // Use co-op name format (e.g., "Drayton/Edinburg") to zoom to co-op center
      const coopName = event.schools.join('/');
      onSchoolClick(coopName);
    } else if (event.schools.length > 0) {
      onSchoolClick(event.schools[0]);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      onClick={handleCardClick}
      className="flex gap-4 p-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 cursor-pointer hover:border-gray-300 dark:hover:border-gray-600 transition-colors shadow-sm"
    >
      <div
        className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-xl border-2"
        style={{ borderColor: color, backgroundColor: `${color}10` }}
      >
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-base font-medium text-gray-900 dark:text-gray-100">
          {event.type === 'merge' ? 'Co-op Formed' : 
           event.type === 'split' ? 'Co-op Dissolved' : 
           event.type === 'transition' ? 'Co-op Changed' : 'Event'}
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
          {event.description}
        </p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {event.schools.map((school) => (
            <button
              key={school}
              onClick={(e) => {
                e.stopPropagation();
                onSchoolClick?.(school);
              }}
              className="text-xs px-2.5 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              {school}
            </button>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

// Compact version for mobile bottom sheet
export function EventLogCompact({
  year,
  onSchoolClick,
  onExpand,
}: EventLogProps & { onExpand?: () => void }) {
  const events = getCoopEventsForYear(year);
  const mergers = getActiveMergers(year);

  return (
    <button
      onClick={onExpand}
      className="w-full p-4 text-left bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700"
    >
      <div className="flex items-center justify-between">
        <div>
          <span className="font-semibold text-blue-600">{year}</span>
          <span className="text-gray-500 ml-2">
            {events.length > 0
              ? `${events.length} co-op change${events.length > 1 ? 's' : ''}`
              : 'No co-op changes'}
          </span>
        </div>
        <div className="text-sm text-gray-400">
          {mergers.length} co-ops
        </div>
      </div>
      
      {events.length > 0 && (
        <div className="mt-2 flex items-center gap-2 text-sm">
          {events.slice(0, 2).map((event: TimelineEvent, i: number) => (
            <span
              key={i}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs"
              style={{
                backgroundColor: `${EVENT_COLORS[event.type]}20`,
                color: EVENT_COLORS[event.type],
              }}
            >
              {EVENT_ICONS[event.type]} {event.schools[0]}
            </span>
          ))}
          {events.length > 2 && (
            <span className="text-gray-400 text-xs">
              +{events.length - 2} more
            </span>
          )}
        </div>
      )}
    </button>
  );
}
