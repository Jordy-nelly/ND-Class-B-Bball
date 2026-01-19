import { SchoolCoordinate } from '../types';

// District 32 schools with approximate coordinates
// Located in southwestern North Dakota (Adams, Bowman, Hettinger, Slope counties)
export const schoolCoordinates: SchoolCoordinate[] = [
  // Bowman County
  { name: 'Bowman', lat: 46.1833, lng: -103.3947, city: 'Bowman' },
  { name: 'Rhame', lat: 46.2436, lng: -103.6519, city: 'Rhame' },
  { name: 'Scranton', lat: 46.1425, lng: -103.1461, city: 'Scranton' },
  
  // Hettinger County
  { name: 'Mott', lat: 46.3722, lng: -102.3269, city: 'Mott' },
  { name: 'Regent', lat: 46.4261, lng: -102.5547, city: 'Regent' },
  
  // Adams County  
  { name: 'Hettinger', lat: 46.0014, lng: -102.6369, city: 'Hettinger' },
  { name: 'Reeder', lat: 46.1086, lng: -102.9436, city: 'Reeder' },
  
  // Golden Valley County
  { name: 'Beach', lat: 46.9181, lng: -104.0061, city: 'Beach' },
  { name: 'Golva', lat: 46.7275, lng: -103.9806, city: 'Golva' },
  
  // Stark County
  { name: 'Belfield', lat: 46.8853, lng: -103.1997, city: 'Belfield' },
  
  // Hettinger area - private school
  { name: 'New England', lat: 46.5450, lng: -102.8644, city: 'New England' },
  { name: "New England St. Mary's", lat: 46.5470, lng: -102.8620, city: 'New England' },
];

// Helper to get coordinates by school name
export function getSchoolCoordinates(name: string): SchoolCoordinate | undefined {
  return schoolCoordinates.find(
    s => s.name.toLowerCase() === name.toLowerCase()
  );
}

// Get all school names
export function getAllSchoolNames(): string[] {
  return schoolCoordinates.map(s => s.name);
}

// North Dakota bounding box for map
export const ND_BOUNDS = {
  north: 49.0,
  south: 45.9,
  east: -96.5,
  west: -104.1,
};

// Center of North Dakota
export const ND_CENTER = {
  lat: 47.5,
  lng: -100.5,
};

// District 32 region (southwest ND) - tighter bounds
export const DISTRICT_32_BOUNDS = {
  north: 47.2,
  south: 45.8,
  east: -101.5,
  west: -104.2,
};

export const DISTRICT_32_CENTER = {
  lat: 46.4,
  lng: -103.0,
};
