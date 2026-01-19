/**
 * Co-op Name Parser Utility
 * Centralizes parsing and normalization of cooperative team names
 */

const path = require('path');
const fs = require('fs');

/**
 * Known single-school hyphenated names (not co-ops)
 * These are consolidations or historical combined schools
 */
const KNOWN_SINGLE_SCHOOLS = new Set([
  'hazelton-moffit-braddock',
  'turtle lake-mercer',
  'des lacs-burlington',
  'litchville-marion',
  'elgin-new leipzig',
  'gackle-streeter',
  'bisbee-egeland',
  'finley-sharon',
  'hope-page',
  'new rockford-sheyenne',
  'wimbledon-courtenay',
  'north central',
  'south border',
  'divide county',
  'mckenzie county',
  'kidder county',
  'north star',
  'four winds',
  'sargent central',
  'shiloh christian',
  'kindred-richland',
  'barnes county north',
  'oak grove lutheran',
  'trinity christian',
  'central cass',
  'enderlin-mapleton',
]);

class CoopParser {
  constructor() {
    this.schoolInfoCache = null;
  }

  /**
   * Load existing school info for matching
   * @returns {Object} - School info map
   */
  loadSchoolInfo() {
    if (this.schoolInfoCache) return this.schoolInfoCache;

    const dataPath = path.join(__dirname, '..', '..', 'app', 'data', 'allDistricts.ts');
    
    try {
      const content = fs.readFileSync(dataPath, 'utf-8');
      const schoolInfoMatch = content.match(/export const schoolInfo[^=]*=\s*(\{[\s\S]*?\n\});/);
      this.schoolInfoCache = schoolInfoMatch ? JSON.parse(schoolInfoMatch[1]) : {};
    } catch (error) {
      console.warn('[CoopParser] Could not load schoolInfo:', error.message);
      this.schoolInfoCache = {};
    }

    return this.schoolInfoCache;
  }

  /**
   * Normalize a school/team name for consistent matching
   * @param {string} name - Name to normalize
   * @returns {string} - Normalized name
   */
  normalizeSchoolName(name) {
    if (!name) return '';
    return name
      .toLowerCase()
      .trim()
      .replace(/\s+/g, ' ')
      .replace(/['']/g, "'")
      .replace(/\s*high\s*school\s*/gi, '')
      .replace(/\s*hs\s*/gi, '')
      .replace(/\s*public\s*school\s*/gi, '')
      .replace(/\s*-\s*/g, '-')
      .trim();
  }

  /**
   * Parse component schools from a string like "Turtle Lake-Mercer/Underwood/McClusky"
   * Handles known single-school hyphenated names vs actual co-op components
   * @param {string} content - The bracket or parentheses content
   * @returns {Array<string>} - Array of component school names
   */
  parseComponentSchools(content) {
    if (!content) return [];
    
    // First split by slash or comma (primary delimiters for co-ops)
    const parts = content.split(/[\/,]/).map(s => s.trim()).filter(s => s.length > 0);
    
    const components = [];
    for (const part of parts) {
      // If this part contains a hyphen, check if it's a known single school
      if (part.includes('-')) {
        const normalized = this.normalizeSchoolName(part);
        if (KNOWN_SINGLE_SCHOOLS.has(normalized)) {
          // Keep as single school (e.g., "Turtle Lake-Mercer")
          components.push(part);
        } else {
          // Split by hyphen to get individual schools
          const subParts = part.split('-').map(s => s.trim()).filter(s => s.length > 0);
          components.push(...subParts);
        }
      } else {
        components.push(part);
      }
    }
    
    return components;
  }

  /**
   * Parse a co-op team name into its components
   * Handles formats:
   * - Bracket: "Benson County [Leeds/Maddock]"
   * - Slash: "Bowman/Rhame/Scranton"
   * - Parentheses: "Grant County (Elgin-New Leipzig-Carson)"
   * - "co-op" keyword: "North Star co-op"
   * 
   * @param {string} name - Full team name
   * @returns {Object} - Parsed co-op info
   */
  parseCoopName(name) {
    if (!name) return null;

    const result = {
      originalName: name,
      fullName: name.trim(),
      isCooperative: false,
      coopName: null,
      componentSchools: [],
      hostSchool: null,
      mascot: null,
      confidence: 1.0
    };

    let trimmedName = name.trim();
    
    // First, clean up malformed names with trailing junk after bracket
    // e.g., "Central McLean [Turtle Lake-Mercer/Underwood/McClusky]Turtle Lake"
    // should become "Central McLean [Turtle Lake-Mercer/Underwood/McClusky]"
    const trailingJunkMatch = trimmedName.match(/^(.+\])([A-Za-z].*)$/);
    if (trailingJunkMatch) {
      trimmedName = trailingJunkMatch[1];
    }

    // Format 1: Bracket notation "Benson County [Leeds/Maddock]"
    const bracketMatch = trimmedName.match(/^(.+?)\s*\[(.+)\]$/);
    if (bracketMatch) {
      result.isCooperative = true;
      result.coopName = bracketMatch[1].trim();
      
      // Parse the bracket content, handling both slash and hyphen delimiters
      const bracketContent = bracketMatch[2];
      result.componentSchools = this.parseComponentSchools(bracketContent);
      result.hostSchool = result.componentSchools[0] || result.coopName;
      return result;
    }

    // Format 2: Parentheses notation "Grant County (Elgin-New Leipzig-Carson)"
    const parenMatch = trimmedName.match(/^(.+?)\s*\((.+)\)$/);
    if (parenMatch) {
      const innerContent = parenMatch[2];
      // Check if it looks like component schools vs just a city name
      if (innerContent.includes('/') || innerContent.includes('-') || innerContent.includes(',')) {
        result.isCooperative = true;
        result.coopName = parenMatch[1].trim();
        result.componentSchools = this.parseComponentSchools(innerContent);
        result.hostSchool = result.componentSchools[0] || result.coopName;
        return result;
      }
    }

    // Format 3: "co-op" keyword in name
    if (/co-?op/i.test(trimmedName)) {
      result.isCooperative = true;
      result.coopName = trimmedName.replace(/\s*co-?op\s*/gi, '').trim();
      result.confidence = 0.8; // Lower confidence since we don't know component schools
      return result;
    }

    // Format 4: Slash notation "Bowman/Rhame/Scranton"
    if (trimmedName.includes('/')) {
      const parts = trimmedName.split('/').map(s => s.trim()).filter(s => s.length > 0);
      if (parts.length >= 2) {
        result.isCooperative = true;
        result.coopName = trimmedName;
        result.componentSchools = parts;
        result.hostSchool = parts[0];
        return result;
      }
    }

    // Format 5: Hyphenated name that's NOT a known single school
    if (trimmedName.includes('-')) {
      const normalizedCheck = this.normalizeSchoolName(trimmedName);
      if (!KNOWN_SINGLE_SCHOOLS.has(normalizedCheck)) {
        const parts = trimmedName.split('-').map(s => s.trim()).filter(s => s.length > 0);
        // Only treat as co-op if we have exactly 2 parts that both look like town names
        if (parts.length === 2 && parts.every(p => /^[A-Z]/.test(p))) {
          result.isCooperative = true;
          result.coopName = trimmedName;
          result.componentSchools = parts;
          result.hostSchool = parts[0];
          result.confidence = 0.7; // Lower confidence for hyphenated detection
          return result;
        }
      }
    }

    // Not a co-op
    result.coopName = trimmedName;
    return result;
  }

  /**
   * Match component school names to existing school info entries
   * @param {Array<string>} components - Component school names
   * @returns {Array<Object>} - Matched schools with info
   */
  matchComponentSchools(components) {
    const schoolInfo = this.loadSchoolInfo();
    const matches = [];

    for (const component of components) {
      const normalized = this.normalizeSchoolName(component);
      let bestMatch = null;
      let bestScore = 0;

      for (const [key, info] of Object.entries(schoolInfo)) {
        const keyNormalized = this.normalizeSchoolName(key);
        const score = this.calculateSimilarity(normalized, keyNormalized);

        if (score > bestScore) {
          bestScore = score;
          bestMatch = { key, info, score };
        }
      }

      matches.push({
        searchedName: component,
        normalizedName: normalized,
        match: bestMatch && bestScore >= 0.6 ? bestMatch : null,
        confidence: bestScore
      });
    }

    return matches;
  }

  /**
   * Calculate string similarity (Jaccard-like with word overlap)
   * @param {string} a - First string
   * @param {string} b - Second string
   * @returns {number} - Similarity score 0-1
   */
  calculateSimilarity(a, b) {
    if (!a || !b) return 0;
    if (a === b) return 1;
    if (a.includes(b) || b.includes(a)) return 0.9;

    const wordsA = new Set(a.split(/[\s\/\-]+/).filter(w => w.length > 1));
    const wordsB = new Set(b.split(/[\s\/\-]+/).filter(w => w.length > 1));

    const intersection = [...wordsA].filter(w => wordsB.has(w));
    const union = new Set([...wordsA, ...wordsB]);

    return union.size > 0 ? intersection.length / union.size : 0;
  }

  /**
   * Parse a list of team names and identify all co-ops
   * @param {Array<string>} names - List of team names
   * @returns {Object} - Parsed results with coops and non-coops
   */
  parseTeamList(names) {
    const results = {
      coops: [],
      nonCoops: [],
      parseErrors: []
    };

    for (const name of names) {
      try {
        const parsed = this.parseCoopName(name);
        if (parsed) {
          if (parsed.isCooperative) {
            results.coops.push(parsed);
          } else {
            results.nonCoops.push(parsed);
          }
        }
      } catch (error) {
        results.parseErrors.push({ name, error: error.message });
      }
    }

    return results;
  }

  /**
   * Load co-op data from existing CSV file for validation
   * @returns {Array<Object>} - Parsed CSV co-ops
   */
  loadExistingCoopsFromCSV() {
    const csvPath = path.join(__dirname, '..', '..', 'Coop Mascot List(End).csv');
    const coops = [];

    try {
      const content = fs.readFileSync(csvPath, 'utf-8');
      const lines = content.split('\n').filter(l => l.trim());

      // Skip header if present
      const startIdx = lines[0].toLowerCase().includes('school') ? 1 : 0;

      for (let i = startIdx; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        // CSV format: School,Mascot,City (assumed)
        const parts = line.split(',').map(p => p.trim().replace(/^"|"$/g, ''));
        
        if (parts.length >= 1 && parts[0]) {
          const parsed = this.parseCoopName(parts[0]);
          if (parsed) {
            parsed.mascot = parts[1] || null;
            parsed.city = parts[2] || null;
            parsed.source = 'csv';
            coops.push(parsed);
          }
        }
      }

      console.log(`[CoopParser] Loaded ${coops.length} entries from CSV`);
    } catch (error) {
      console.warn('[CoopParser] Could not load CSV:', error.message);
    }

    return coops;
  }
}

module.exports = CoopParser;
