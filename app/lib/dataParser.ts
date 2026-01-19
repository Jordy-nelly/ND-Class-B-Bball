import {
  DistrictSnapshot,
  TimelineEvent,
  CoopRelationship,
  MergerNode,
} from '../types';
import {
  districtAssignments,
  schoolInfo,
  availableDistricts,
  yearRange,
  getSchoolsForDistrictYear,
} from '../data/allDistricts';

// Re-export for convenience
export { availableDistricts, yearRange, schoolInfo };

// Normalize co-op name display to use consistent separators (slashes)
export function normalizeCoopName(name: string): string {
  // Replace hyphens between school names with slashes for consistent display
  // But preserve hyphens within school names like "Campbell-Tintah" or "Des Lacs-Burlington"
  // Strategy: Only replace standalone hyphens (with spaces) that separate schools
  return name
    .replace(/\s*-\s*/g, '/') // Replace " - " with "/"
    .replace(/([a-z])\/([A-Z])/g, '$1/$2'); // Ensure proper spacing around slashes
}

// Types for merger/co-op relationships
export interface MergerInfo {
  fullName: string;       // The full co-op name like "Fairmount/Campbell-Tintah"
  primarySchool: string;  // First school (host) - "Fairmount"
  memberSchools: string[]; // Other schools in the co-op - ["Campbell-Tintah"]
  allSchools: string[];   // All schools including primary
  memberCount: number;    // Total number of schools in merger
}

// Parse a school name to extract merger/co-op info
export function parseMergerInfo(schoolName: string): MergerInfo | null {
  // Check for parentheses notation like "Grant County (Elgin/New Leipzig/Carson)"
  // Only treat as merger if parentheses contain multiple schools (slashes, hyphens with multiple parts, or commas)
  const parenMatch = schoolName.match(/^(.+?)\s*\((.+)\)$/);
  if (parenMatch) {
    const primaryName = parenMatch[1].trim();
    const membersStr = parenMatch[2];
    
    // Only treat as merger if the parentheses contain slashes (multiple schools)
    // Single words in parentheses like "Sargent Central (Forman)" are just city indicators
    if (membersStr.includes('/')) {
      const members = membersStr.split(/[\/]/).map(s => s.trim()).filter(Boolean);
      return {
        fullName: schoolName,
        primarySchool: primaryName,
        memberSchools: members,
        allSchools: [primaryName, ...members],
        memberCount: 1 + members.length,
      };
    }
    // If no slashes in parentheses, this is a school with city indicator, not a merger
  }
  
  // Check for slash notation like "Fairmount/Campbell-Tintah"
  if (schoolName.includes('/')) {
    const parts = schoolName.split('/').map(s => s.trim());
    return {
      fullName: schoolName,
      primarySchool: parts[0],
      memberSchools: parts.slice(1),
      allSchools: parts,
      memberCount: parts.length,
    };
  }
  
  // Not a merger
  return null;
}

// Get all active mergers for a year and district
export function getActiveMergers(year: number, district: number | 'all' = 'all'): MergerInfo[] {
  const schools = getSchoolsForYear(year, district);
  return schools.map(parseMergerInfo).filter((m): m is MergerInfo => m !== null);
}

// Check if a school name matches another (handles partial matches)
function schoolNameMatches(name1: string, name2: string): boolean {
  const n1 = name1.toLowerCase().trim();
  const n2 = name2.toLowerCase().trim();
  return n1 === n2 || n1.includes(n2) || n2.includes(n1);
}

// Get the merger role for a specific school
export function getSchoolMergerRole(schoolName: string, year: number, district: number | 'all' = 'all'): {
  role: 'primary' | 'member' | 'independent';
  mergerInfo: MergerInfo | null;
  mergerSize: number; // How many schools are in the merger (for sizing)
} {
  const mergers = getActiveMergers(year, district);
  
  for (const merger of mergers) {
    // Check if this is the primary school
    if (schoolNameMatches(schoolName, merger.primarySchool)) {
      return { role: 'primary', mergerInfo: merger, mergerSize: merger.memberCount };
    }
    
    // Check if this school is a member
    for (const member of merger.memberSchools) {
      if (schoolNameMatches(schoolName, member)) {
        return { role: 'member', mergerInfo: merger, mergerSize: merger.memberCount };
      }
    }
  }
  
  return { role: 'independent', mergerInfo: null, mergerSize: 1 };
}

// Extended merger info with coordinates for map display
export interface MergerWithCoords extends MergerInfo {
  centerLat: number;
  centerLng: number;
  memberCoords: Array<{ name: string; lat: number; lng: number }>;
}

// Try to find coordinates for a school name, with fuzzy matching
export function findSchoolCoordinates(schoolName: string): { name: string; lat: number; lng: number } | null {
  // First try exact match
  const exactMatch = schoolInfo[schoolName];
  if (exactMatch && exactMatch.lat && exactMatch.lng) {
    return { name: schoolName, lat: exactMatch.lat, lng: exactMatch.lng };
  }
  
  // For slash-separated co-op names like "Drayton/Edinburg", try each school
  if (schoolName.includes('/')) {
    const parts = schoolName.split('/');
    for (const part of parts) {
      const trimmed = part.trim();
      if (trimmed.length > 1) {
        const partMatch = schoolInfo[trimmed];
        if (partMatch && partMatch.lat && partMatch.lng) {
          return { name: trimmed, lat: partMatch.lat, lng: partMatch.lng };
        }
        // Try case-insensitive match
        for (const [name, info] of Object.entries(schoolInfo)) {
          if (name.includes('/')) continue;
          if (info.lat && info.lng && name.toLowerCase() === trimmed.toLowerCase()) {
            return { name, lat: info.lat, lng: info.lng };
          }
        }
      }
    }
  }
  
  // Skip fuzzy matching for slash-combined names - they should use exact match only
  // to avoid "Glen Ullin" matching "Glen Ullin/Hebron"
  const lowerName = schoolName.toLowerCase();
  
  // Only do partial matching if not finding a simple school name
  // Avoid matching combined school entries (containing /)
  for (const [name, info] of Object.entries(schoolInfo)) {
    // Skip combined school entries when looking for individual schools
    if (name.includes('/')) continue;
    
    if (info.lat && info.lng) {
      const lowerKey = name.toLowerCase();
      if (lowerKey === lowerName) {
        return { name, lat: info.lat, lng: info.lng };
      }
    }
  }
  
  // For hyphenated names like "Campbell-Tintah", try each part
  if (schoolName.includes('-')) {
    const parts = schoolName.split('-');
    for (const part of parts) {
      const trimmed = part.trim();
      if (trimmed.length > 2) {
        const partMatch = schoolInfo[trimmed];
        if (partMatch && partMatch.lat && partMatch.lng) {
          return { name: trimmed, lat: partMatch.lat, lng: partMatch.lng };
        }
        // Try partial match but avoid combined entries
        for (const [name, info] of Object.entries(schoolInfo)) {
          if (name.includes('/')) continue;
          if (info.lat && info.lng && name.toLowerCase() === trimmed.toLowerCase()) {
            return { name, lat: info.lat, lng: info.lng };
          }
        }
      }
    }
  }
  
  // Last resort: try partial matching but still avoid combined entries
  for (const [name, info] of Object.entries(schoolInfo)) {
    if (name.includes('/')) continue;
    if (info.lat && info.lng) {
      const lowerKey = name.toLowerCase();
      if ((lowerName.length > 3 && lowerKey.includes(lowerName)) ||
          (lowerKey.length > 3 && lowerName.includes(lowerKey))) {
        return { name, lat: info.lat, lng: info.lng };
      }
    }
  }
  
  return null;
}

// Get mergers with calculated center points for displaying co-op dots and lines
export function getMergersWithCoords(year: number, district: number | 'all' = 'all'): MergerWithCoords[] {
  const mergers = getActiveMergers(year, district);
  const result: MergerWithCoords[] = [];
  
  for (const merger of mergers) {
    const memberCoords: Array<{ name: string; lat: number; lng: number }> = [];
    const usedCoords = new Set<string>();
    
    for (const schoolName of merger.allSchools) {
      const coords = findSchoolCoordinates(schoolName);
      if (coords) {
        const coordKey = `${coords.lat},${coords.lng}`;
        if (!usedCoords.has(coordKey)) {
          usedCoords.add(coordKey);
          memberCoords.push({ name: schoolName, lat: coords.lat, lng: coords.lng });
        }
      }
    }
    
    if (memberCoords.length >= 2) {
      const centerLat = memberCoords.reduce((sum, c) => sum + c.lat, 0) / memberCoords.length;
      const centerLng = memberCoords.reduce((sum, c) => sum + c.lng, 0) / memberCoords.length;
      
      result.push({
        ...merger,
        centerLat,
        centerLng,
        memberCoords,
      });
    }
  }
  
  return result;
}

// Dynamic year range based on selected district
export function getYearRangeForDistrict(district: number | 'all'): { min: number; max: number } {
  if (district === 'all') {
    return yearRange;
  }
  
  const districtData = districtAssignments[district];
  if (!districtData) {
    return yearRange;
  }
  
  const years = Object.keys(districtData).map(Number).filter(y => districtData[y]?.teams?.length > 0);
  if (years.length === 0) {
    return yearRange;
  }
  
  return {
    min: Math.min(...years),
    max: Math.max(...years),
  };
}

// Get schools for a specific year and district
export function getSchoolsForYear(year: number, district: number | 'all' = 'all'): string[] {
  if (district === 'all') {
    // Get all schools across all districts for this year
    const allSchools: string[] = [];
    for (const d of availableDistricts) {
      const schools = getSchoolsForDistrictYear(d, year);
      allSchools.push(...schools);
    }
    // Remove duplicates and filter out placeholder "?" entries
    return [...new Set(allSchools)].filter(s => s !== '?');
  }
  
  // Filter out placeholder "?" entries
  return getSchoolsForDistrictYear(district, year).filter(s => s !== '?');
}

// Get mascot for a school
export function getSchoolMascot(schoolName: string): string {
  return schoolInfo[schoolName]?.mascot || 'Unknown';
}

// Get school coordinates
export function getSchoolCoordinates(schoolName: string): { lat: number; lng: number } | null {
  const info = schoolInfo[schoolName];
  if (info) {
    return { lat: info.lat, lng: info.lng };
  }
  return null;
}

// Get district for a school in a given year
export function getDistrictForSchool(schoolName: string, year: number): number | null {
  for (const district of availableDistricts) {
    const schools = getSchoolsForDistrictYear(district, year);
    if (schools.some(s => s.toLowerCase().includes(schoolName.toLowerCase()) || 
                          schoolName.toLowerCase().includes(s.toLowerCase()))) {
      return district;
    }
  }
  return null;
}

// Known co-op relationships
// Based on Coop Mascot List data
export const coopRelationships: CoopRelationship[] = [
  {
    year: 1985,
    schools: ['Bowman', 'Rhame', 'Scranton'],
    coopName: 'Bowman County co-op',
    mascot: 'Bulldogs',
  },
  {
    year: 1988,
    schools: ['Bowman', 'Rhame'],
    coopName: 'Bowman County co-op',
    mascot: 'Bulldogs',
  },
];

// Get active co-ops for a year
export function getCoopsForYear(year: number): CoopRelationship[] {
  return coopRelationships.filter(coop => year >= coop.year);
}

// Get co-op partnerships for a specific school
export function getSchoolCoops(schoolName: string): CoopRelationship[] {
  return coopRelationships.filter(coop => 
    coop.schools.some(s => s.toLowerCase() === schoolName.toLowerCase())
  );
}

// Get snapshot for a specific year and district
export function getDistrictSnapshot(year: number, district: number | 'all' = 'all'): DistrictSnapshot {
  const schools = getSchoolsForYear(year, district);
  return {
    year,
    districtNumber: typeof district === 'number' ? district : 0,
    schools,
    coops: [],
  };
}

// Detect events by comparing consecutive years for a district
export function detectEvents(year: number, district: number | 'all' = 'all'): TimelineEvent[] {
  const events: TimelineEvent[] = [];
  
  const currentSchools = new Set(getSchoolsForYear(year, district));
  const previousSchools = new Set(getSchoolsForYear(year - 1, district));
  
  // Find schools that joined
  currentSchools.forEach(school => {
    if (!previousSchools.has(school)) {
      const districtNum = typeof district === 'number' ? district : getDistrictForSchool(school, year);
      events.push({
        year,
        type: 'join',
        schools: [school],
        description: `${school} joined${districtNum ? ` District ${districtNum}` : ''}`,
        districtNumber: districtNum || 0,
      });
    }
  });
  
  // Find schools that left
  previousSchools.forEach(school => {
    if (!currentSchools.has(school)) {
      const districtNum = typeof district === 'number' ? district : getDistrictForSchool(school, year - 1);
      events.push({
        year,
        type: 'leave',
        schools: [school],
        description: `${school} left${districtNum ? ` District ${districtNum}` : ''}`,
        districtNumber: districtNum || 0,
      });
    }
  });
  
  return events;
}

// Detect co-op events (schools joining/leaving co-ops) for a specific year
export function getCoopEventsForYear(year: number, district: number | 'all' = 'all'): TimelineEvent[] {
  const events: TimelineEvent[] = [];
  
  const currentMergers = getActiveMergers(year, district);
  const previousMergers = getActiveMergers(year - 1, district);
  
  // Create maps for easier comparison
  const currentCoopMap = new Map<string, MergerInfo>();
  const previousCoopMap = new Map<string, MergerInfo>();
  
  currentMergers.forEach(m => currentCoopMap.set(m.fullName, m));
  previousMergers.forEach(m => previousCoopMap.set(m.fullName, m));
  
  // Track schools that transitioned (to avoid duplicate events)
  const transitionedSchools = new Set<string>();
  
  // Build a map of which school was in which co-op last year
  const previousSchoolToCoopMap = new Map<string, MergerInfo>();
  previousMergers.forEach(merger => {
    merger.allSchools.forEach(school => {
      previousSchoolToCoopMap.set(school.toLowerCase(), merger);
    });
  });
  
  // Build a map of which school is in which co-op this year
  const currentSchoolToCoopMap = new Map<string, MergerInfo>();
  currentMergers.forEach(merger => {
    merger.allSchools.forEach(school => {
      currentSchoolToCoopMap.set(school.toLowerCase(), merger);
    });
  });
  
  // Find transitions: schools that were in one co-op last year and a different co-op this year
  currentMergers.forEach(newMerger => {
    if (!previousCoopMap.has(newMerger.fullName)) {
      // This is a new co-op - check if any schools came from other co-ops
      const schoolsFromOtherCoops: Array<{school: string, fromCoop: MergerInfo}> = [];
      const newSchools: string[] = [];
      
      newMerger.allSchools.forEach(school => {
        const previousCoop = previousSchoolToCoopMap.get(school.toLowerCase());
        if (previousCoop && previousCoop.fullName !== newMerger.fullName) {
          schoolsFromOtherCoops.push({ school, fromCoop: previousCoop });
          transitionedSchools.add(school.toLowerCase());
        } else {
          newSchools.push(school);
        }
      });
      
      // Create transition events for schools that moved from other co-ops
      schoolsFromOtherCoops.forEach(({ school, fromCoop }) => {
        const districtNum = typeof district === 'number' ? district : getDistrictForSchool(school, year);
        const otherNewPartners = newMerger.allSchools.filter(s => s !== school);
        events.push({
          year,
          type: 'transition',
          schools: [school, ...otherNewPartners],
          description: `${school} left ${normalizeCoopName(fromCoop.fullName)} to join ${otherNewPartners.join(' & ')}`,
          districtNumber: districtNum || 0,
        });
      });
      
      // If there are schools that weren't in any co-op before, show them forming a new co-op
      if (schoolsFromOtherCoops.length === 0) {
        const districtNum = typeof district === 'number' ? district : getDistrictForSchool(newMerger.primarySchool, year);
        events.push({
          year,
          type: 'merge',
          schools: newMerger.allSchools,
          description: `${newMerger.allSchools.join(' & ')} formed co-op`,
          districtNumber: districtNum || 0,
        });
      }
    }
  });
  
  // Find co-ops that dissolved - but only show if the schools didn't transition elsewhere
  previousMergers.forEach(oldMerger => {
    if (!currentCoopMap.has(oldMerger.fullName)) {
      // Check if all schools transitioned to new co-ops
      const schoolsNotTransitioned = oldMerger.allSchools.filter(
        school => !transitionedSchools.has(school.toLowerCase())
      );
      
      // Check if any schools joined different new co-ops (not together)
      const schoolsInNewCoops = oldMerger.allSchools.filter(
        school => currentSchoolToCoopMap.has(school.toLowerCase())
      );
      
      if (schoolsNotTransitioned.length > 0 && schoolsInNewCoops.length < oldMerger.allSchools.length) {
        // Some schools left and didn't join new co-ops - co-op ended
        const districtNum = typeof district === 'number' ? district : getDistrictForSchool(oldMerger.primarySchool, year - 1);
        events.push({
          year,
          type: 'split',
          schools: oldMerger.allSchools,
          description: `${normalizeCoopName(oldMerger.fullName)} co-op ended`,
          districtNumber: districtNum || 0,
        });
      }
    }
  });
  
  return events;
}

// Get all events across all years for a district
export function getAllEvents(district: number | 'all' = 'all'): TimelineEvent[] {
  const allEvents: TimelineEvent[] = [];
  const range = getYearRangeForDistrict(district);
  for (let year = range.min; year <= range.max; year++) {
    const yearEvents = detectEvents(year, district);
    allEvents.push(...yearEvents);
  }
  return allEvents;
}

// Get events for a specific year
export function getEventsForYear(year: number, district: number | 'all' = 'all'): TimelineEvent[] {
  return detectEvents(year, district);
}

// Check if a school is active in a given year
export function isSchoolActive(schoolName: string, year: number, district: number | 'all' = 'all'): boolean {
  const schools = getSchoolsForYear(year, district);
  return schools.some(s => s.toLowerCase() === schoolName.toLowerCase());
}

// Get all unique schools across all years for a district
export function getAllUniqueSchools(district: number | 'all' = 'all'): string[] {
  const allSchools = new Set<string>();
  const range = getYearRangeForDistrict(district);
  
  for (let year = range.min; year <= range.max; year++) {
    const schools = getSchoolsForYear(year, district);
    schools.forEach(school => allSchools.add(school));
  }
  return Array.from(allSchools).sort();
}

// Get school's active years
export function getSchoolActiveYears(schoolName: string, district: number | 'all' = 'all'): number[] {
  const years: number[] = [];
  const range = getYearRangeForDistrict(district);
  for (let year = range.min; year <= range.max; year++) {
    if (isSchoolActive(schoolName, year, district)) {
      years.push(year);
    }
  }
  return years;
}

// Build merger tree for bracket view
export function buildMergerTree(district: number | 'all' = 'all'): MergerNode {
  const allSchools = getAllUniqueSchools(district);
  const range = getYearRangeForDistrict(district);
  
  return {
    name: district === 'all' ? 'All Districts' : `District ${district}`,
    attributes: {
      years: `${range.min}-${range.max}`,
    },
    children: allSchools.slice(0, 50).map(school => ({ // Limit for performance
      name: school,
      attributes: {
        mascot: getSchoolMascot(school),
        years: getSchoolActiveYears(school, district).length > 0 
          ? `${getSchoolActiveYears(school, district).length} years` 
          : 'N/A',
      },
    })),
  };
}

// Parse co-op notation from school names (e.g., "Bowman/Rhame/Scranton" or "[Bowman/Rhame]")
export function parseCoopName(name: string): CoopRelationship | null {
  // Check for bracket notation: [School1/School2]
  const bracketMatch = name.match(/\[([^\]]+)\]/);
  if (bracketMatch) {
    const schools = bracketMatch[1].split('/').map(s => s.trim());
    return {
      year: 0, // Will be set by caller
      schools,
      coopName: name,
    };
  }
  
  // Check for slash notation: School1/School2
  if (name.includes('/')) {
    const schools = name.split('/').map(s => s.trim());
    return {
      year: 0,
      schools,
      coopName: name,
    };
  }
  
  return null;
}

// Get count of schools for a year
export function getSchoolCount(year: number, district: number | 'all' = 'all'): number {
  return getSchoolsForYear(year, district).length;
}

// Get years with data for a district
export function getYearsWithData(district: number | 'all' = 'all'): number[] {
  const range = getYearRangeForDistrict(district);
  const years: number[] = [];
  
  for (let year = range.min; year <= range.max; year++) {
    if (getSchoolsForYear(year, district).length > 0) {
      years.push(year);
    }
  }
  
  return years;
}
