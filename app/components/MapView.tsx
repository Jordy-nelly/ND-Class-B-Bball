'use client';

import { useRef, useState, useMemo, useEffect, useCallback } from 'react';
import { Map, Source, Layer, Marker, MapRef } from 'react-map-gl/maplibre';
import { motion, AnimatePresence } from 'motion/react';
import { Crosshair } from 'lucide-react';
import 'maplibre-gl/dist/maplibre-gl.css';

import { ND_CENTER } from '../data/schoolCoordinates';
import ndBoundary from '../data/ndBoundary.json';
import { getSchoolsForYear, getSchoolMascot, getSchoolCoordinates, getDistrictForSchool, getMergersWithCoords, findSchoolCoordinates, normalizeCoopName } from '../lib/dataParser';
import { getRegionColor, getSchoolColor } from '../lib/colors';
import { useMediaQuery, useReducedMotion, useDarkMode } from '../hooks/useMediaQuery';

interface MapViewProps {
  year: number;
  showCoopLines: boolean;
  useRegionColors: boolean;
  selectedSchool: string | null;
  onSchoolSelect: (school: string | null) => void;
  district?: number | 'all';
  onMapInteraction?: () => void;
  recenterTrigger?: number;
}

export function MapView({
  year,
  showCoopLines,
  useRegionColors,
  selectedSchool,
  onSchoolSelect,
  district = 'all',
  onMapInteraction,
  recenterTrigger = 0,
}: MapViewProps) {
  const mapRef = useRef<MapRef>(null);
  const { isMobile } = useMediaQuery();
  const reducedMotion = useReducedMotion();
  const isDarkMode = useDarkMode();
  const [mapLoaded, setMapLoaded] = useState(false);

  const activeSchools = getSchoolsForYear(year, district);
  
  // Get all mergers with their center coordinates
  const mergersWithCoords = useMemo(() => {
    return getMergersWithCoords(year, district);
  }, [year, district]);
  
  // Set of co-op full names (like "Glen Ullin/Hebron") to exclude from regular school display
  const coopFullNames = useMemo(() => {
    const names = new Set<string>();
    for (const merger of mergersWithCoords) {
      names.add(merger.fullName);
    }
    return names;
  }, [mergersWithCoords]);

  // Build school data with coordinates (excluding co-op combined entries - those are shown separately)
  const schoolsWithCoords = useMemo(() => {
    return activeSchools
      .filter(name => !coopFullNames.has(name)) // Exclude co-op entries like "Glen Ullin/Hebron"
      .map(name => {
        const coords = findSchoolCoordinates(name);
        if (!coords) return null;
        const schoolDistrict = getDistrictForSchool(name, year);
        return {
          name,
          lat: coords.lat,
          lng: coords.lng,
          district: schoolDistrict,
        };
      })
      .filter((s): s is NonNullable<typeof s> => s !== null);
  }, [activeSchools, year, district, coopFullNames]);

  // Track previous district to only recenter when district actually changes
  const prevDistrictRef = useRef(district);

  // Zoom to fit all schools when district changes (not when year changes)
  useEffect(() => {
    // Only recenter if district actually changed, not just year
    if (district === prevDistrictRef.current) return;
    prevDistrictRef.current = district;
    
    if (!mapLoaded || !mapRef.current) return;
    
    // Collect all coordinates (regular schools + co-op centers + member cities)
    const allCoords: { lat: number; lng: number }[] = [
      ...schoolsWithCoords.map(s => ({ lat: s.lat, lng: s.lng })),
      ...mergersWithCoords.map(m => ({ lat: m.centerLat, lng: m.centerLng })),
      ...mergersWithCoords.flatMap(m => m.memberCoords.map(c => ({ lat: c.lat, lng: c.lng }))),
    ];
    
    if (allCoords.length === 0) return;
    
    // If viewing all districts, reset to default view
    if (district === 'all') {
      mapRef.current.flyTo({
        center: [ND_CENTER.lng, ND_CENTER.lat],
        zoom: isMobile ? 5.5 : 6,
        duration: 1000,
      });
      return;
    }
    
    // Calculate bounding box
    const lats = allCoords.map(c => c.lat);
    const lngs = allCoords.map(c => c.lng);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);
    
    // Add padding to bounds
    const latPadding = (maxLat - minLat) * 0.2 || 0.1;
    const lngPadding = (maxLng - minLng) * 0.2 || 0.1;
    
    mapRef.current.fitBounds(
      [
        [minLng - lngPadding, minLat - latPadding],
        [maxLng + lngPadding, maxLat + latPadding],
      ],
      {
        padding: { top: 50, bottom: 50, left: 50, right: 50 },
        duration: 1000,
        maxZoom: 10,
      }
    );
  }, [district, mapLoaded, schoolsWithCoords, mergersWithCoords, isMobile]);

  // Helper function to fly to a school
  const flyToSchool = useCallback((targetSchool: string) => {
    if (!mapRef.current) return;
    
    // Calculate padding for bottom sheet on mobile (50vh + buffer for year control)
    const bottomPadding = isMobile ? (window.innerHeight * 0.5) + 40 : 0;
    const topPadding = isMobile ? 80 : 0;
    
    // First check if it's a co-op/merger
    const merger = mergersWithCoords.find(m => m.fullName === targetSchool);
    if (merger) {
      mapRef.current.flyTo({
        center: [merger.centerLng, merger.centerLat],
        zoom: isMobile ? 9 : 10,
        duration: reducedMotion ? 0 : 800,
        padding: { bottom: bottomPadding, top: topPadding, left: 0, right: 0 },
      });
      return;
    }

    // Check regular schools in current view
    const school = schoolsWithCoords.find(s => s.name === targetSchool);
    if (school) {
      mapRef.current.flyTo({
        center: [school.lng, school.lat],
        zoom: isMobile ? 9 : 10,
        duration: reducedMotion ? 0 : 800,
        padding: { bottom: bottomPadding, top: topPadding, left: 0, right: 0 },
      });
      return;
    }

    // Check if it's a member school within a co-op
    for (const m of mergersWithCoords) {
      const member = m.memberCoords.find(mc => mc.name === targetSchool);
      if (member) {
        mapRef.current.flyTo({
          center: [member.lng, member.lat],
          zoom: isMobile ? 9 : 10,
          duration: reducedMotion ? 0 : 800,
          padding: { bottom: bottomPadding, top: topPadding, left: 0, right: 0 },
        });
        return;
      }
    }

    // Fallback: try to get coordinates directly using fuzzy matching
    const directCoords = findSchoolCoordinates(targetSchool);
    if (directCoords) {
      mapRef.current.flyTo({
        center: [directCoords.lng, directCoords.lat],
        zoom: isMobile ? 9 : 10,
        duration: reducedMotion ? 0 : 800,
        padding: { bottom: bottomPadding, top: topPadding, left: 0, right: 0 },
      });
    }
  }, [schoolsWithCoords, mergersWithCoords, isMobile, reducedMotion]);

  // Track previous selected school to only fly when selection actually changes
  const prevSelectedSchoolRef = useRef<string | null>(null);

  // Fly to selected school when it changes
  useEffect(() => {
    // Skip if no school selected or same school
    if (!selectedSchool || selectedSchool === prevSelectedSchoolRef.current) {
      prevSelectedSchoolRef.current = selectedSchool;
      return;
    }
    
    // Update ref
    prevSelectedSchoolRef.current = selectedSchool;
    
    // If map not loaded yet, skip - user can use recenter button
    if (!mapLoaded || !mapRef.current) return;
    
    // Fly to the selected school
    flyToSchool(selectedSchool);
  }, [selectedSchool, mapLoaded, flyToSchool]);

  // Recenter on selected school (called by recenter button)
  const recenterOnSelected = useCallback(() => {
    if (!selectedSchool) return;
    flyToSchool(selectedSchool);
  }, [selectedSchool, flyToSchool]);

  // Watch for recenter trigger from parent
  const prevRecenterTriggerRef = useRef(recenterTrigger);
  useEffect(() => {
    if (recenterTrigger !== prevRecenterTriggerRef.current) {
      prevRecenterTriggerRef.current = recenterTrigger;
      recenterOnSelected();
    }
  }, [recenterTrigger, recenterOnSelected]);

  // Build GeoJSON for co-op lines connecting member schools to center
  const coopLinesGeoJSON = useMemo(() => {
    const features: GeoJSON.Feature[] = [];
    
    for (const merger of mergersWithCoords) {
      // Get color for this merger - use region color or default blue
      const mergerDistrict = getDistrictForSchool(merger.fullName, year);
      const lineColor = useRegionColors
        ? (mergerDistrict ? getRegionColor(mergerDistrict, year) : getSchoolColor(merger.primarySchool))
        : '#2563EB'; // Blue when region colors disabled
      
      for (const member of merger.memberCoords) {
        features.push({
          type: 'Feature',
          properties: { mergerName: merger.fullName, color: lineColor },
          geometry: {
            type: 'LineString',
            coordinates: [
              [member.lng, member.lat],
              [merger.centerLng, merger.centerLat],
            ],
          },
        });
      }
    }
    
    return { type: 'FeatureCollection' as const, features };
  }, [mergersWithCoords, year, useRegionColors]);

  // Get school bubble size
  const getBubbleSize = (isSelected: boolean, isSmall: boolean = false): number => {
    const baseSize = isMobile ? 24 : 18;
    
    if (isSmall) {
      const smallSize = baseSize * 0.5;
      return isSelected ? smallSize * 1.3 : smallSize;
    }
    
    return isSelected ? baseSize * 1.5 : baseSize;
  };

  return (
    <div className="relative w-full h-full min-h-[400px]">
      <Map
        ref={mapRef}
        initialViewState={{
          longitude: ND_CENTER.lng,
          latitude: isMobile ? ND_CENTER.lat + 0.5 : ND_CENTER.lat,
          zoom: isMobile ? 5.0 : 6,
        }}
        minZoom={5}
        style={{ width: '100%', height: '100%' }}
        mapStyle={isDarkMode 
          ? "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json"
          : "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json"
        }
        onLoad={() => setMapLoaded(true)}
        onDragStart={() => onMapInteraction?.()}
        onZoomStart={() => onMapInteraction?.()}
        attributionControl={false}
        touchZoomRotate
        touchPitch={false}
      >
        {/* ND State and County Boundaries */}
        {mapLoaded && (
          <Source id="boundaries" type="geojson" data={ndBoundary as GeoJSON.FeatureCollection}>
            <Layer
              id="state-outline"
              type="line"
              filter={['==', ['get', 'type'], 'state']}
              paint={{ 'line-color': isDarkMode ? '#475569' : '#94a3b8', 'line-width': 2 }}
            />
            <Layer
              id="county-outline"
              type="line"
              filter={['==', ['get', 'type'], 'county']}
              paint={{ 'line-color': isDarkMode ? '#334155' : '#cbd5e1', 'line-width': 1, 'line-dasharray': [2, 2] }}
            />
          </Source>
        )}

        {/* Co-op lines connecting city dots to co-op center */}
        {mapLoaded && showCoopLines && coopLinesGeoJSON.features.length > 0 && (
          <Source id="coop-lines" type="geojson" data={coopLinesGeoJSON}>
            <Layer
              id="coop-lines-layer"
              type="line"
              paint={{
                'line-color': ['get', 'color'],
                'line-width': 2,
                'line-opacity': 0.7,
              }}
            />
          </Source>
        )}

        {/* School markers - regular schools */}
        <AnimatePresence>
          {schoolsWithCoords.map((school) => {
            const isSelected = school.name === selectedSchool;
            const size = getBubbleSize(isSelected, false);
            const schoolColor = useRegionColors
              ? (school.district ? getRegionColor(school.district, year) : getSchoolColor(school.name))
              : '#2563EB'; // Blue when region colors disabled

            return (
              <Marker
                key={school.name}
                longitude={school.lng}
                latitude={school.lat}
                anchor="center"
              >
                <motion.button
                  initial={reducedMotion ? false : { scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  transition={{ duration: reducedMotion ? 0 : 0.2 }}
                  onClick={() => {
                    onMapInteraction?.();
                    onSchoolSelect(isSelected ? null : school.name);
                  }}
                  className="relative cursor-pointer touch-manipulation focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-full"
                  style={{ width: size, height: size }}
                  aria-label={`${school.name} - ${getSchoolMascot(school.name)}`}
                >
                  <motion.div
                    className="absolute inset-0 rounded-full"
                    style={{
                      backgroundColor: schoolColor,
                      border: isSelected ? '3px solid white' : '2px solid rgba(255,255,255,0.6)',
                      boxShadow: isSelected
                        ? `0 0 0 2px ${schoolColor}, 0 4px 12px rgba(0,0,0,0.3)`
                        : '0 2px 6px rgba(0,0,0,0.2)',
                    }}
                    whileHover={{ scale: 1.15 }}
                    whileTap={{ scale: 0.95 }}
                  />
                  
                  {isSelected && (
                    <motion.div
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="absolute left-1/2 -translate-x-1/2 top-full mt-1 whitespace-nowrap bg-white dark:bg-gray-800 px-2 py-1 rounded shadow-lg text-xs font-medium z-10"
                    >
                      <span>{school.name}</span>
                    </motion.div>
                  )}
                </motion.button>
              </Marker>
            );
          })}
        </AnimatePresence>

        {/* Co-op center markers (same size as normal schools) */}
        <AnimatePresence>
          {mergersWithCoords.map((merger) => {
            const isSelected = selectedSchool === merger.fullName;
            const baseSize = isMobile ? 24 : 18;
            const size = isSelected ? baseSize * 1.5 : baseSize;
            // Get color - use region color or default blue
            const mergerDistrict = getDistrictForSchool(merger.fullName, year);
            const mergerColor = useRegionColors
              ? (mergerDistrict ? getRegionColor(mergerDistrict, year) : getSchoolColor(merger.primarySchool))
              : '#2563EB'; // Blue when region colors disabled

            return (
              <Marker
                key={`merger-${merger.fullName}`}
                longitude={merger.centerLng}
                latitude={merger.centerLat}
                anchor="center"
              >
                <motion.button
                  initial={reducedMotion ? false : { scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  transition={{ duration: reducedMotion ? 0 : 0.2 }}
                  onClick={() => {
                    onMapInteraction?.();
                    onSchoolSelect(isSelected ? null : merger.fullName);
                  }}
                  className="relative cursor-pointer touch-manipulation focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 rounded-full"
                  style={{ width: size, height: size }}
                  aria-label={`${merger.fullName} - co-op`}
                >
                  <motion.div
                    className="absolute inset-0 rounded-full"
                    style={{
                      backgroundColor: mergerColor,
                      border: isSelected ? '3px solid white' : '2px solid rgba(255,255,255,0.6)',
                      boxShadow: isSelected
                        ? `0 0 0 2px ${mergerColor}, 0 4px 12px rgba(0,0,0,0.3)`
                        : '0 2px 6px rgba(0,0,0,0.2)',
                    }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                  />
                  
                  {isSelected && (
                    <motion.div
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="absolute left-1/2 -translate-x-1/2 top-full mt-1 whitespace-nowrap bg-white dark:bg-gray-800 px-2 py-1 rounded shadow-lg text-xs font-medium z-10"
                    >
                      <span className="font-semibold">{normalizeCoopName(merger.fullName)}</span>
                      <span className="block text-[10px] text-gray-500">
                        {merger.memberCount} schools co-op
                      </span>
                    </motion.div>
                  )}
                </motion.button>
              </Marker>
            );
          })}
        </AnimatePresence>

        {/* Co-op member city dots (smaller dots at original city locations) - visible when co-op lines shown */}
        {showCoopLines && (
          <AnimatePresence>
            {mergersWithCoords.flatMap((merger) => 
              merger.memberCoords.map((member) => {
              const isSelected = selectedSchool === member.name;
              const size = getBubbleSize(isSelected, true);
              // Get color - use region color or default blue
              const mergerDistrict = getDistrictForSchool(merger.fullName, year);
              const memberColor = useRegionColors
                ? (mergerDistrict ? getRegionColor(mergerDistrict, year) : getSchoolColor(merger.primarySchool))
                : '#2563EB'; // Blue when region colors disabled

              return (
                <Marker
                  key={`member-${merger.fullName}-${member.name}`}
                  longitude={member.lng}
                  latitude={member.lat}
                  anchor="center"
                >
                  <motion.button
                    initial={reducedMotion ? false : { scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    transition={{ duration: reducedMotion ? 0 : 0.2 }}
                    onClick={() => {
                      onMapInteraction?.();
                      onSchoolSelect(isSelected ? null : member.name);
                    }}
                    className="relative cursor-pointer touch-manipulation focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-full"
                    style={{ width: size, height: size }}
                    aria-label={`${member.name} - part of ${merger.fullName}`}
                  >
                    <motion.div
                      className="absolute inset-0 rounded-full"
                      style={{
                        backgroundColor: memberColor,
                        border: isSelected ? '3px solid white' : '2px solid rgba(255,255,255,0.6)',
                        boxShadow: isSelected
                          ? `0 0 0 2px ${memberColor}, 0 4px 12px rgba(0,0,0,0.3)`
                          : '0 2px 6px rgba(0,0,0,0.2)',
                      }}
                      whileHover={{ scale: 1.15 }}
                      whileTap={{ scale: 0.95 }}
                    />
                    
                    {isSelected && (
                      <motion.div
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="absolute left-1/2 -translate-x-1/2 top-full mt-1 whitespace-nowrap bg-white dark:bg-gray-800 px-2 py-1 rounded shadow-lg text-xs font-medium z-10"
                      >
                        <span>{member.name}</span>
                        <span className="block text-[10px] text-gray-500">
                          Part of {normalizeCoopName(merger.fullName)}
                        </span>
                      </motion.div>
                    )}
                  </motion.button>
                </Marker>
              );
            })
          )}
          </AnimatePresence>
        )}
      </Map>

      {/* Recenter button - shows when a school is selected */}
      <AnimatePresence>
        {selectedSchool && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={recenterOnSelected}
            className="absolute top-4 right-4 p-3 bg-white dark:bg-gray-800 rounded-full shadow-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors z-10"
            title={`Recenter on ${selectedSchool}`}
          >
            <Crosshair className="w-5 h-5 text-gray-700 dark:text-gray-300" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
