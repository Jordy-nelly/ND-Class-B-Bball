// School coordinate for map positioning
export interface SchoolCoordinate {
  name: string;
  lat: number;
  lng: number;
  city: string;
}

// School with full details
export interface School {
  name: string;
  mascot: string;
  city: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  // Years this school was active (not merged into another)
  activeYears: number[];
  // Co-op partnerships by year
  coopHistory: CoopRelationship[];
  // District assignments by year
  districtHistory: { year: number; district: number }[];
}

// Co-op relationship between schools
export interface CoopRelationship {
  year: number;
  schools: string[]; // Names of schools in the co-op
  coopName: string; // Combined name like "Bowman/Rhame/Scranton"
  mascot?: string;
}

// Snapshot of a district for a specific year
export interface DistrictSnapshot {
  year: number;
  districtNumber: number;
  schools: string[]; // School names in this district for this year
  coops: CoopRelationship[]; // Active co-ops in this district
}

// Timeline event types
export type TimelineEventType = 
  | 'join'       // School joined the district
  | 'leave'      // School left the district
  | 'merge'      // Schools merged/formed co-op
  | 'split'      // Co-op dissolved
  | 'transition' // School moved from one co-op to another
  | 'rename';    // School renamed

// Event that occurred in a specific year
export interface TimelineEvent {
  year: number;
  type: TimelineEventType;
  schools: string[]; // Schools involved
  description: string;
  districtNumber: number;
}

// Node for bracket/tree visualization
export interface MergerNode {
  name: string;
  attributes?: {
    mascot?: string;
    years?: string; // e.g., "1970-1985"
    city?: string;
  };
  children?: MergerNode[];
}

// App state for the visualizer
export interface VisualizerState {
  currentYear: number;
  selectedSchool: string | null;
  selectedDistrict: number | 'all';
  viewMode: 'map' | 'bracket';
  showCoopLines: boolean;
  useRegionColors: boolean;
  isPlaying: boolean;
}

// Default year range (will be overridden by data)
export const MIN_YEAR = 1972;
export const MAX_YEAR = 2012;
