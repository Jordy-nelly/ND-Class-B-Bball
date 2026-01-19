'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'motion/react';
import { YearSlider } from './components/YearSlider';
import { ViewToggle } from './components/ViewToggle';
import { RelationshipToggle } from './components/RelationshipToggle';
import { EventLog } from './components/EventLog';
import { SchoolDetail } from './components/SchoolDetail';
import { MobileNav } from './components/MobileNav';
import { SearchBar } from './components/SearchBar';
import { DistrictSelector } from './components/DistrictSelector';
import { FloatingHeader } from './components/FloatingHeader';
import { FloatingYearControl } from './components/FloatingYearControl';
import { FloatingActions } from './components/FloatingActions';
import { LayersSheet } from './components/LayersSheet';
import { ReportSheet } from './components/ReportSheet';
import { DecadeToast } from './components/DecadeToast';
import { useMediaQuery } from './hooks/useMediaQuery';
import { VisualizerState } from './types';
import { getYearRangeForDistrict, getSchoolCount, getActiveMergers } from './lib/dataParser';
import { availableDistricts } from './data/allDistricts';

// Dynamic imports for heavy visualization components
const MapView = dynamic(
  () => import('./components/MapView').then((mod) => mod.MapView),
  {
    ssr: false,
    loading: () => <LoadingPlaceholder />,
  }
);

const BracketView = dynamic(
  () => import('./components/BracketView').then((mod) => mod.BracketView),
  {
    ssr: false,
    loading: () => <LoadingPlaceholder />,
  }
);

function LoadingPlaceholder() {
  return (
    <div className="flex items-center justify-center h-full bg-gray-50 dark:bg-gray-900">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
        <p className="text-gray-500">Loading visualization...</p>
      </div>
    </div>
  );
}

export default function Home() {
  const { isMobile, isDesktop, isHydrated } = useMediaQuery();
  
  // App state
  const [state, setState] = useState<VisualizerState>({
    currentYear: 1972,
    selectedSchool: null,
    selectedDistrict: 'all',
    viewMode: 'map',
    showCoopLines: false,
    useRegionColors: false,
    isPlaying: false,
  });

  // Get year range for selected district
  const yearRange = getYearRangeForDistrict(state.selectedDistrict);

  // Compute stats for current year
  const schoolCount = useMemo(
    () => getSchoolCount(state.currentYear, state.selectedDistrict),
    [state.currentYear, state.selectedDistrict]
  );
  const coopCount = useMemo(
    () => getActiveMergers(state.currentYear, state.selectedDistrict).length,
    [state.currentYear, state.selectedDistrict]
  );

  // Helper to get stats for any year (used by decade toast)
  const getStatsForYear = useCallback((year: number) => {
    return {
      schools: getSchoolCount(year, state.selectedDistrict),
      coops: getActiveMergers(year, state.selectedDistrict).length,
    };
  }, [state.selectedDistrict]);

  // Adjust current year when district changes
  useEffect(() => {
    if (state.currentYear < yearRange.min) {
      setState(s => ({ ...s, currentYear: yearRange.min }));
    } else if (state.currentYear > yearRange.max) {
      setState(s => ({ ...s, currentYear: yearRange.max }));
    }
  }, [state.selectedDistrict, yearRange.min, yearRange.max, state.currentYear]);

  // Mobile-specific state
  const [mobileTab, setMobileTab] = useState<'map' | 'bracket' | 'events' | 'settings'>('map');
  const [showLayersSheet, setShowLayersSheet] = useState(false);
  const [showReportSheet, setShowReportSheet] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showDistrictPicker, setShowDistrictPicker] = useState(false);
  const [showEventLog, setShowEventLog] = useState(false);
  const [isSheetMinimized, setIsSheetMinimized] = useState(false);
  const [recenterTrigger, setRecenterTrigger] = useState(0);
  const [isToastVisible, setIsToastVisible] = useState(false);
  
  // Track where user navigated from when opening school detail
  const [navigationSource, setNavigationSource] = useState<'map' | 'events' | 'search' | null>(null);

  // Reset minimized state when a new school is selected
  useEffect(() => {
    if (state.selectedSchool) {
      setIsSheetMinimized(false);
    }
  }, [state.selectedSchool]);
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');

  // State update handlers
  const setYear = useCallback((year: number) => {
    setState((s) => ({ ...s, currentYear: year }));
  }, []);

  const setViewMode = useCallback((mode: 'map' | 'bracket') => {
    setState((s) => ({ ...s, viewMode: mode }));
  }, []);

  const setShowCoopLines = useCallback((show: boolean) => {
    setState((s) => ({ ...s, showCoopLines: show }));
  }, []);

  const setUseRegionColors = useCallback((use: boolean) => {
    setState((s) => ({ ...s, useRegionColors: use }));
  }, []);

  const setSelectedSchool = useCallback((school: string | null) => {
    setState((s) => ({ ...s, selectedSchool: school }));
  }, []);
  
  // Helper to select school with navigation source tracking
  const selectSchoolFrom = useCallback((school: string | null, source: 'map' | 'events' | 'search') => {
    setNavigationSource(school ? source : null);
    setSelectedSchool(school);
  }, [setSelectedSchool]);
  
  // Handle closing school detail - navigate back to source
  const handleCloseSchoolDetail = useCallback(() => {
    const source = navigationSource;
    setSelectedSchool(null);
    setNavigationSource(null);
    
    // Navigate back to source
    if (source === 'events') {
      setShowEventLog(true);
    }
    // 'map' and 'search' just close the sheet (default behavior)
  }, [navigationSource, setSelectedSchool]);

  const setSelectedDistrict = useCallback((district: number | 'all') => {
    setState((s) => ({ ...s, selectedDistrict: district }));
  }, []);

  const togglePlaying = useCallback(() => {
    setState((s) => ({ ...s, isPlaying: !s.isPlaying }));
  }, []);

  const stopPlaying = useCallback(() => {
    setState((s) => ({ ...s, isPlaying: false }));
  }, []);

  // Handle mobile tab changes
  const handleMobileTabChange = (tab: 'map' | 'bracket' | 'events' | 'settings') => {
    setMobileTab(tab);
    if (tab === 'map') setViewMode('map');
    if (tab === 'bracket') setViewMode('bracket');
  };

  // Show loading state until hydrated to prevent blank screen
  if (!isHydrated) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-950">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-500">Loading ND Class B...</p>
        </div>
      </div>
    );
  }

  // Render desktop layout
  if (isDesktop) {
    return (
      <div className="h-screen flex flex-col bg-gray-100 dark:bg-gray-950">
        {/* Header */}
        <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                ND Class B
              </h1>
              <DistrictSelector
                selectedDistrict={state.selectedDistrict}
                onDistrictChange={setSelectedDistrict}
              />
              <span className="text-sm text-gray-500">
                ({yearRange.min}-{yearRange.max})
              </span>
            </div>
            
            <div className="flex items-center gap-6">
              <div className="w-56">
                <SearchBar
                  onSchoolSelect={(school) => selectSchoolFrom(school, 'search')}
                  selectedSchool={state.selectedSchool}
                />
              </div>
              {/* ViewToggle hidden until bracket view is ready */}
              {/* <ViewToggle viewMode={state.viewMode} onViewChange={setViewMode} /> */}
              <RelationshipToggle
                showLines={state.showCoopLines}
                onToggle={setShowCoopLines}
              />
            </div>
          </div>
        </header>

        {/* Year slider */}
        <YearSlider
          year={state.currentYear}
          onYearChange={setYear}
          isPlaying={state.isPlaying}
          onPlayToggle={togglePlaying}
          minYear={yearRange.min}
          maxYear={yearRange.max}
          isPaused={isToastVisible}
        />

        {/* Main content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Visualization area */}
          <main className="flex-1 relative">
            <AnimatePresence mode="wait">
              {state.viewMode === 'map' ? (
                <motion.div
                  key="map"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0"
                >
                  <MapView
                    year={state.currentYear}
                    showCoopLines={state.showCoopLines}
                    useRegionColors={state.useRegionColors}
                    selectedSchool={state.selectedSchool}
                    onSchoolSelect={(school) => selectSchoolFrom(school, 'map')}
                    district={state.selectedDistrict}
                  />
                </motion.div>
              ) : (
                <motion.div
                  key="bracket"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0"
                >
                  <BracketView
                    year={state.currentYear}
                    selectedSchool={state.selectedSchool}
                    onSchoolSelect={setSelectedSchool}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </main>

          {/* Event log sidebar */}
          <aside className="w-80 border-l border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 overflow-hidden">
            <EventLog
              year={state.currentYear}
              onSchoolClick={(school) => selectSchoolFrom(school, 'events')}
              district={state.selectedDistrict}
            />
          </aside>
        </div>

        {/* School detail panel */}
        <SchoolDetail
          school={state.selectedSchool}
          currentYear={state.currentYear}
          onClose={handleCloseSchoolDetail}
        />

        {/* Decade milestone toasts */}
        <DecadeToast
          year={state.currentYear}
          isPlaying={state.isPlaying}
          schoolCount={schoolCount}
          coopCount={coopCount}
          getStatsForYear={getStatsForYear}
          onToastVisibilityChange={setIsToastVisible}
          onPlaybackStop={stopPlaying}
        />
      </div>
    );
  }

  // Render mobile/tablet layout
  return (
    <div className="h-screen flex flex-col bg-gray-100 dark:bg-gray-950">
      {/* Floating header */}
      <FloatingHeader
        selectedDistrict={state.selectedDistrict}
        onSearchClick={() => setShowSearch(true)}
        onInfoClick={() => {/* TODO: Open about modal */}}
        onDistrictClick={() => setShowDistrictPicker(true)}
        yearRange={yearRange}
      />

      {/* Main content - full screen map */}
      <main className="flex-1 relative overflow-hidden">
        <MapView
          year={state.currentYear}
          showCoopLines={state.showCoopLines}
          useRegionColors={state.useRegionColors}
          selectedSchool={state.selectedSchool}
          onSchoolSelect={(school) => selectSchoolFrom(school, 'map')}
          district={state.selectedDistrict}
          onMapInteraction={() => {
            setIsSheetMinimized(true);
            setShowEventLog(false);
          }}
          recenterTrigger={recenterTrigger}
        />
      </main>

      {/* Floating action buttons */}
      <FloatingActions
        onReportClick={() => setShowReportSheet(true)}
        onLayersClick={() => setShowLayersSheet(true)}
        onRecenterClick={() => setRecenterTrigger(t => t + 1)}
        showRecenter={!!state.selectedSchool}
      />

      {/* Floating year control */}
      <FloatingYearControl
        year={state.currentYear}
        onYearChange={setYear}
        isPlaying={state.isPlaying}
        onPlayToggle={togglePlaying}
        minYear={yearRange.min}
        maxYear={yearRange.max}
        schoolCount={schoolCount}
        coopCount={coopCount}
        district={state.selectedDistrict}
        onSchoolSelect={(school) => selectSchoolFrom(school, 'events')}
        showEventLog={showEventLog}
        onShowEventLogChange={setShowEventLog}
        isPaused={isToastVisible}
      />

      {/* Layers sheet */}
      <LayersSheet
        isOpen={showLayersSheet}
        onClose={() => setShowLayersSheet(false)}
        showCoopLines={state.showCoopLines}
        onCoopLinesChange={setShowCoopLines}
        useRegionColors={state.useRegionColors}
        onRegionColorsChange={setUseRegionColors}
      />

      {/* Report sheet */}
      <ReportSheet
        isOpen={showReportSheet}
        onClose={() => setShowReportSheet(false)}
        district={state.selectedDistrict}
      />

      {/* Search modal */}
      <AnimatePresence>
        {showSearch && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSearch(false)}
              className="fixed inset-0 bg-black/30 z-40"
            />
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="fixed top-0 left-0 right-0 z-50 p-4 pt-safe"
            >
              <div className="pt-3">
                <SearchBar
                  onSchoolSelect={(school) => {
                    selectSchoolFrom(school, 'search');
                    setShowSearch(false);
                  }}
                  selectedSchool={state.selectedSchool}
                  autoFocus
                />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* District picker sheet */}
      <AnimatePresence>
        {showDistrictPicker && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDistrictPicker(false)}
              className="fixed inset-0 bg-black/30 z-[60]"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'tween', duration: 0.3, ease: 'easeOut' }}
              className="fixed bottom-0 left-0 right-0 z-[61] bg-white dark:bg-gray-900 rounded-t-3xl shadow-2xl max-h-[60vh] pb-safe"
            >
              {/* Handle */}
              <div className="flex justify-center pt-3 pb-2">
                <div className="w-10 h-1 bg-gray-300 dark:bg-gray-600 rounded-full" />
              </div>
              
              {/* Header */}
              <div className="px-5 pb-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Select District
                </h2>
              </div>
              
              {/* District list */}
              <div className="overflow-y-auto px-4 pb-6 max-h-[calc(60vh-80px)]">
                <div className="space-y-1">
                  <button
                    onClick={() => {
                      setSelectedDistrict('all');
                      setShowDistrictPicker(false);
                    }}
                    className={`w-full px-4 py-3 rounded-xl text-left transition-colors ${
                      state.selectedDistrict === 'all'
                        ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-900 dark:text-white'
                    }`}
                  >
                    <span className="font-medium">All Districts</span>
                    <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">
                      1965-2013
                    </span>
                  </button>
                  
                  {availableDistricts.map((district) => {
                    const districtRange = getYearRangeForDistrict(district);
                    return (
                      <button
                        key={district}
                        onClick={() => {
                          setSelectedDistrict(district);
                          setShowDistrictPicker(false);
                        }}
                        className={`w-full px-4 py-3 rounded-xl text-left transition-colors ${
                          state.selectedDistrict === district
                            ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400'
                            : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-900 dark:text-white'
                        }`}
                      >
                        <span className="font-medium">District {district}</span>
                        <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">
                          {districtRange.min}-{districtRange.max}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* School detail panel */}
      <SchoolDetail
        school={state.selectedSchool}
        currentYear={state.currentYear}
        onClose={handleCloseSchoolDetail}
        isMinimized={isSheetMinimized}
        onRecenter={() => setIsSheetMinimized(false)}
      />

      {/* Decade milestone toasts */}
      <DecadeToast
        year={state.currentYear}
        isPlaying={state.isPlaying}
        schoolCount={schoolCount}
        coopCount={coopCount}
        getStatsForYear={getStatsForYear}
        onToastVisibilityChange={setIsToastVisible}
        onPlaybackStop={stopPlaying}
      />
    </div>
  );
}
