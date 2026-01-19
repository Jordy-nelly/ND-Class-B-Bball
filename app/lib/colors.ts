// District color palette - 32 distinct colors for all districts
// Using colors that work well on both light and dark backgrounds

export const DISTRICT_COLORS: Record<number, string> = {
  1: '#E53935',   // Red
  2: '#D81B60',   // Pink
  3: '#8E24AA',   // Purple
  4: '#5E35B1',   // Deep Purple
  5: '#3949AB',   // Indigo
  6: '#1E88E5',   // Blue
  7: '#039BE5',   // Light Blue
  8: '#00ACC1',   // Cyan
  9: '#00897B',   // Teal
  10: '#43A047',  // Green
  11: '#7CB342',  // Light Green
  12: '#C0CA33',  // Lime
  13: '#FDD835',  // Yellow
  14: '#FFB300',  // Amber
  15: '#FB8C00',  // Orange
  16: '#F4511E',  // Deep Orange
  17: '#6D4C41',  // Brown
  18: '#757575',  // Grey
  19: '#546E7A',  // Blue Grey
  20: '#EC407A',  // Pink 400
  21: '#AB47BC',  // Purple 400
  22: '#7E57C2',  // Deep Purple 400
  23: '#5C6BC0',  // Indigo 400
  24: '#42A5F5',  // Blue 400
  25: '#29B6F6',  // Light Blue 400
  26: '#26C6DA',  // Cyan 400
  27: '#26A69A',  // Teal 400
  28: '#66BB6A',  // Green 400
  29: '#9CCC65',  // Light Green 400
  30: '#FFCA28',  // Amber 400
  31: '#FFA726',  // Orange 400
  32: '#2563EB',  // Blue 600 - District 32 (primary focus)
};

// Get color for a district (legacy - use getRegionColor for stable colors across redistricting)
export function getDistrictColor(district: number): string {
  return DISTRICT_COLORS[district] || '#9CA3AF'; // Gray fallback
}

// ============================================================================
// GEOGRAPHIC REGION COLOR SYSTEM
// ============================================================================
// This system assigns colors based on geographic regions of North Dakota,
// ensuring that colors remain stable even when district numbers change
// during redistricting. Each region maintains its color identity.

export type Region = 
  | 'southeast'    // Wahpeton, Fairmount, Lisbon area
  | 'northeast'    // Devils Lake, Langdon, Rolla area  
  | 'east-central' // Fargo, Valley City, Jamestown area
  | 'central'      // Bismarck, Mandan, Washburn area
  | 'north-central'// Rugby, Minot area
  | 'northwest'    // Williston, Stanley area
  | 'southwest'    // Dickinson, Bowman, Hettinger area
  | 'south-central'; // LaMoure, Ellendale, Linton area

// Stable colors for each geographic region - these never change
// Using maximally distinct colors for easy visual differentiation
export const REGION_COLORS: Record<Region, string> = {
  'southeast':     '#DC2626',  // Red - SE corner (Wahpeton, Fairmount)
  'northeast':     '#2563EB',  // Blue - NE corner (Devils Lake, Langdon)
  'east-central':  '#7C3AED',  // Violet - East central (Fargo, Valley City)
  'central':       '#EA580C',  // Red-Orange - Central (Bismarck, Mandan)
  'north-central': '#0891B2',  // Cyan - North central (Rugby, Minot)
  'northwest':     '#16A34A',  // Green - NW corner (Williston, Stanley)
  'southwest':     '#CA8A04',  // Yellow/Gold - SW corner (Bowman, Hettinger)
  'south-central': '#84CC16',  // Lime Green - South central (LaMoure, Ellendale)
};

// Map district numbers to geographic regions by era
// Key insight: District NUMBERS got repurposed in major redistricting events (1976, 1993, 1999)
// but the geographic REGIONS remained constant. This mapping tracks which region each
// district number represented in each era.

type Era = '1970-1975' | '1976-1990' | '1991-1992' | '1993-1998' | '1999-present';

const DISTRICT_REGION_MAP: Record<Era, Record<number, Region>> = {
  // Pre-1976: Original 32-district system
  '1970-1975': {
    1: 'southeast',      // Fairmount, Hankinson, Milnor area
    2: 'southeast',      // Wahpeton area
    3: 'east-central',   // Fargo area
    4: 'east-central',   // Casselton, Kindred area
    5: 'east-central',   // Buffalo, Page area
    6: 'east-central',   // Hillsboro, Mayville area
    7: 'northeast',      // Grafton area
    8: 'northeast',      // Park River, Edinburg area
    9: 'northeast',      // Cavalier, Pembina area
    10: 'northeast',     // Walhalla, Drayton area
    11: 'northeast',     // Devils Lake area
    12: 'north-central', // Cando, Bisbee area
    13: 'north-central', // Rugby area
    14: 'north-central', // Bottineau area
    15: 'central',       // Harvey, Fessenden area
    16: 'central',       // Carrington area
    17: 'east-central',  // Valley City, LaMoure area
    18: 'south-central', // Ellendale, Oakes area
    19: 'central',       // Jamestown area
    20: 'central',       // Napoleon, Linton area
    21: 'central',       // Bismarck area
    22: 'central',       // Mandan area
    23: 'central',       // Washburn, Garrison area
    24: 'north-central', // Minot area
    25: 'northwest',     // Stanley, Tioga area
    26: 'northwest',     // Kenmare, Mohall area
    27: 'northwest',     // Williston area
    28: 'northwest',     // Watford City area
    29: 'southwest',     // Dickinson area
    30: 'southwest',     // Richardton, Belfield area
    31: 'southwest',     // Mott, New England area
    32: 'southwest',     // Bowman, Hettinger area
  },
  
  // 1976-1990: After first major redistricting
  '1976-1990': {
    1: 'southeast',      // Fairmount, Sargent Central, Hankinson
    2: 'southeast',      // Wahpeton, Breckenridge area
    3: 'east-central',   // Fargo area schools
    4: 'east-central',   // West Fargo, Casselton
    5: 'east-central',   // Hillsboro, Cooperstown area
    6: 'east-central',   // Mayville-Portland area
    7: 'northeast',      // Grafton area
    8: 'northeast',      // Park River, Edinburg
    9: 'northeast',      // Cavalier, Langdon area
    10: 'northeast',     // Pembina, Walhalla, Drayton
    11: 'northeast',     // Devils Lake, Lakota area
    12: 'north-central', // Cando, Rolla area
    13: 'north-central', // Rugby, Dunseith area
    14: 'north-central', // Bottineau area
    15: 'central',       // Fessenden, Harvey area
    16: 'central',       // Carrington area
    17: 'east-central',  // Valley City, Enderlin area
    18: 'south-central', // Oakes, Ellendale area
    19: 'central',       // Jamestown area
    20: 'south-central', // Linton, Napoleon, Wishek
    21: 'central',       // Bismarck area
    22: 'central',       // Mandan, Glen Ullin area
    23: 'central',       // Washburn, Garrison, Underwood
    24: 'north-central', // Minot area
    25: 'northwest',     // Stanley, Tioga area
    26: 'northwest',     // Kenmare, Mohall, Sherwood
    27: 'northwest',     // Williston, Ray area
    28: 'northwest',     // Watford City, New Town area
    29: 'southwest',     // Dickinson area
    30: 'southwest',     // Belfield, South Heart area
    31: 'southwest',     // Mott, New England, Regent
    32: 'southwest',     // Bowman, Hettinger, Scranton
  },
  
  // 1991-1992: Transition years
  '1991-1992': {
    1: 'southeast',
    2: 'southeast',
    3: 'east-central',
    4: 'east-central',
    5: 'east-central',
    6: 'east-central',
    7: 'northeast',
    8: 'northeast',
    9: 'northeast',
    10: 'central',       // Changed - now Fessenden, Maddock
    11: 'northeast',
    12: 'north-central',
    13: 'north-central',
    14: 'north-central',
    15: 'south-central', // Changed - now Linton, Napoleon
    16: 'central',
    17: 'east-central',
    18: 'south-central',
    19: 'central',
    20: 'south-central',
    21: 'central',
    22: 'central',
    23: 'central',
    24: 'north-central',
    25: 'northwest',
    26: 'northwest',
    27: 'northwest',
    28: 'northwest',
    29: 'southwest',
    30: 'southwest',
    31: 'southwest',
    32: 'southwest',
  },
  
  // 1993-1998: Major consolidation to 16 districts
  '1993-1998': {
    1: 'southeast',      // SE corner - Wahpeton, Fairmount area
    2: 'east-central',   // Fargo metro area
    3: 'east-central',   // Valley City, Hillsboro area
    4: 'northeast',      // Grafton, Park River area
    5: 'northeast',      // Langdon, Rolla, Cando area
    6: 'northeast',      // Devils Lake, Lakota area
    7: 'north-central',  // Rugby, Dunseith area
    8: 'north-central',  // Bottineau, Mohall area
    9: 'central',        // Jamestown, Carrington area
    10: 'south-central', // Ashley, Linton, Napoleon area
    11: 'central',       // Bismarck metro area
    12: 'central',       // Mandan, Washburn, Garrison area
    13: 'north-central', // Minot area
    14: 'northwest',     // Williston, Stanley area
    15: 'northwest',     // Kenmare, Sherwood area
    16: 'southwest',     // Dickinson, Bowman, Hettinger area
  },
  
  // 1999-present: Current 16-district alignment
  '1999-present': {
    1: 'southeast',      // Wahpeton, Fairmount, Lisbon, Milnor
    2: 'east-central',   // Fargo, West Fargo metro
    3: 'east-central',   // Hillsboro, Mayville, Valley City
    4: 'northeast',      // Grafton, Park River area
    5: 'south-central',  // Edgeley, Ellendale, LaMoure area
    6: 'northeast',      // Devils Lake, Lakota area
    7: 'north-central',  // Rugby, Dunseith, Rolette area
    8: 'northeast',      // Langdon, Rolla, Cando area
    9: 'central',        // Jamestown, Carrington, Harvey area
    10: 'central',       // Garrison, Washburn, Wilton area
    11: 'central',       // Bismarck metro area
    12: 'central',       // Mandan, Beulah, Hazen area
    13: 'north-central', // Minot area
    14: 'northwest',     // Williston, Tioga area
    15: 'northwest',     // Stanley, Watford City, New Town area
    16: 'southwest',     // Dickinson, Bowman, Hettinger, Mott area
  },
};

// Determine which era a year belongs to
function getEra(year: number): Era {
  if (year <= 1975) return '1970-1975';
  if (year <= 1990) return '1976-1990';
  if (year <= 1992) return '1991-1992';
  if (year <= 1998) return '1993-1998';
  return '1999-present';
}

// Get the geographic region for a district in a given year
export function getDistrictRegion(district: number, year: number): Region {
  const era = getEra(year);
  const regionMap = DISTRICT_REGION_MAP[era];
  return regionMap[district] || 'central'; // Default to central if not found
}

// Get color for a district based on its geographic region (stable across redistricting)
export function getRegionColor(district: number, year: number): string {
  const region = getDistrictRegion(district, year);
  return REGION_COLORS[region];
}

// School colors - derived from mascot/identity when available
export const SCHOOL_COLORS: Record<string, string> = {
  'Bowman': '#1E40AF',       // Blue - Bulldogs
  'Hettinger': '#DC2626',    // Red - Red Raiders
  'Mott': '#7C3AED',         // Purple - Raiders
  'Reeder': '#059669',       // Green - Rams
  'Regent': '#EA580C',       // Orange - Rockets
  'Rhame': '#CA8A04',        // Gold - Mustangs
  'Scranton': '#0891B2',     // Cyan - Rockets
  'Beach': '#BE123C',        // Rose - Buccaneers
  'Belfield': '#4338CA',     // Indigo - Bronchos
  'Golva': '#15803D',        // Green - Cowboys
  'New England': '#B91C1C',  // Red - Tigers
  "New England St. Mary's": '#1D4ED8', // Blue - Cardinals
};

// Get color for a school
export function getSchoolColor(schoolName: string): string {
  return SCHOOL_COLORS[schoolName] || '#6B7280'; // Gray fallback
}

// Event type colors
export const EVENT_COLORS = {
  join: '#22C55E',    // Green
  leave: '#EF4444',   // Red
  merge: '#8B5CF6',   // Purple
  split: '#F59E0B',   // Amber
  transition: '#06B6D4', // Cyan - for school moving between co-ops
  rename: '#3B82F6',  // Blue
};

// Event type icons (emoji)
export const EVENT_ICONS = {
  join: '➕',
  leave: '➖',
  merge: '🔗',
  split: '✂️',
  transition: '🔄',   // Circular arrows for transition
  rename: '📝',
};
