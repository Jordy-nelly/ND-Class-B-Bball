/**
 * Data Validation Engine
 * Compares scraped data against existing records and flags discrepancies
 */

const path = require('path');
const fs = require('fs');
const CoopParser = require('./coopParser');

class ValidationEngine {
  constructor() {
    // Will load existing data lazily
    this.existingData = null;
    this.coopParser = new CoopParser();
  }

  /**
   * Load existing data from allDistricts.ts
   */
  loadExistingData() {
    if (this.existingData) return this.existingData;

    // Read the generated TypeScript file and extract the data
    const dataPath = path.join(__dirname, '..', '..', 'app', 'data', 'allDistricts.ts');
    const content = fs.readFileSync(dataPath, 'utf-8');

    // Extract districtAssignments
    const districtMatch = content.match(/export const districtAssignments[^=]*=\s*(\{[\s\S]*?\n\});/);
    const schoolInfoMatch = content.match(/export const schoolInfo[^=]*=\s*(\{[\s\S]*?\n\});/);

    this.existingData = {
      districts: districtMatch ? JSON.parse(districtMatch[1]) : {},
      schools: schoolInfoMatch ? JSON.parse(schoolInfoMatch[1]) : {},
    };

    return this.existingData;
  }

  /**
   * Normalize school name for comparison
   * @param {string} name - School name
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
      .replace(/\s*hs\s*/gi, '');
  }

  /**
   * Calculate similarity between two strings (Levenshtein-based)
   * @param {string} a - First string
   * @param {string} b - Second string
   * @returns {number} - Similarity score (0-1)
   */
  similarity(a, b) {
    if (!a || !b) return 0;
    a = this.normalizeSchoolName(a);
    b = this.normalizeSchoolName(b);
    
    if (a === b) return 1;
    if (a.includes(b) || b.includes(a)) return 0.9;
    
    // Simple word overlap
    const wordsA = new Set(a.split(/[\s\/\-]+/));
    const wordsB = new Set(b.split(/[\s\/\-]+/));
    const intersection = [...wordsA].filter(w => wordsB.has(w));
    const union = new Set([...wordsA, ...wordsB]);
    
    return intersection.length / union.size;
  }

  /**
   * Find best matching existing school
   * @param {string} scrapedName - Scraped school name
   * @returns {Object|null} - Best match with similarity score
   */
  findBestMatch(scrapedName) {
    const data = this.loadExistingData();
    const normalized = this.normalizeSchoolName(scrapedName);
    
    let bestMatch = null;
    let bestScore = 0;
    
    for (const [key, school] of Object.entries(data.schools)) {
      const score = this.similarity(scrapedName, key);
      if (score > bestScore) {
        bestScore = score;
        bestMatch = { key, school, score };
      }
    }
    
    return bestScore >= 0.5 ? bestMatch : null;
  }

  /**
   * Validate scraped school against existing data
   * @param {Object} scrapedSchool - Scraped school data
   * @returns {Object} - Validation result
   */
  validateSchool(scrapedSchool) {
    const match = this.findBestMatch(scrapedSchool.name);
    
    const result = {
      scrapedName: scrapedSchool.name,
      status: 'unknown',
      matchConfidence: 0,
      discrepancies: [],
      suggestions: []
    };
    
    if (!match) {
      result.status = 'new';
      result.suggestions.push({
        type: 'add_school',
        message: `New school found: ${scrapedSchool.name}`,
        data: scrapedSchool
      });
      return result;
    }
    
    result.status = 'matched';
    result.matchConfidence = match.score;
    result.existingKey = match.key;
    result.existingData = match.school;
    
    // Compare mascot
    if (scrapedSchool.mascot && match.school.mascot) {
      const mascotSimilarity = this.similarity(scrapedSchool.mascot, match.school.mascot);
      if (mascotSimilarity < 0.8) {
        result.discrepancies.push({
          field: 'mascot',
          existing: match.school.mascot,
          scraped: scrapedSchool.mascot,
          confidence: mascotSimilarity
        });
      }
    } else if (scrapedSchool.mascot && !match.school.mascot) {
      result.suggestions.push({
        type: 'add_mascot',
        message: `Add mascot for ${match.key}: ${scrapedSchool.mascot}`,
        field: 'mascot',
        value: scrapedSchool.mascot
      });
    }
    
    // Compare city
    if (scrapedSchool.city && match.school.city) {
      const citySimilarity = this.similarity(scrapedSchool.city, match.school.city);
      if (citySimilarity < 0.8) {
        result.discrepancies.push({
          field: 'city',
          existing: match.school.city,
          scraped: scrapedSchool.city,
          confidence: citySimilarity
        });
      }
    } else if (scrapedSchool.city && !match.school.city) {
      result.suggestions.push({
        type: 'add_city',
        message: `Add city for ${match.key}: ${scrapedSchool.city}`,
        field: 'city',
        value: scrapedSchool.city
      });
    }
    
    return result;
  }

  /**
   * Validate scraped district data against existing
   * @param {number} year - Year
   * @param {Object} scrapedDistricts - Scraped district data
   * @returns {Object} - Validation results
   */
  validateDistricts(year, scrapedDistricts) {
    const data = this.loadExistingData();
    const results = {
      year,
      status: 'unknown',
      newData: false,
      discrepancies: [],
      suggestions: []
    };
    
    // Check if we have existing data for this year
    let hasExistingData = false;
    for (const [districtNum, districtData] of Object.entries(data.districts)) {
      if (districtData[year]) {
        hasExistingData = true;
        break;
      }
    }
    
    if (!hasExistingData) {
      results.status = 'new_year';
      results.newData = true;
      results.suggestions.push({
        type: 'add_year',
        message: `Add new year ${year} with ${Object.keys(scrapedDistricts).length} districts`,
        data: scrapedDistricts
      });
      return results;
    }
    
    results.status = 'existing_year';
    
    // Compare each district
    for (const [districtNum, scrapedData] of Object.entries(scrapedDistricts)) {
      const existingDistrict = data.districts[districtNum];
      const existingYearData = existingDistrict?.[year];
      
      if (!existingYearData) {
        results.suggestions.push({
          type: 'add_district_year',
          message: `Add District ${districtNum} for year ${year}`,
          district: districtNum,
          data: scrapedData
        });
        continue;
      }
      
      // Compare teams
      const existingTeams = new Set(existingYearData.teams.map(t => this.normalizeSchoolName(t)));
      const scrapedTeams = new Set(scrapedData.teams.map(t => this.normalizeSchoolName(t)));
      
      // Find teams in scraped but not existing
      for (const team of scrapedTeams) {
        let found = false;
        for (const existingTeam of existingTeams) {
          if (this.similarity(team, existingTeam) >= 0.8) {
            found = true;
            break;
          }
        }
        if (!found) {
          results.discrepancies.push({
            type: 'missing_team',
            district: districtNum,
            year,
            team: scrapedData.teams.find(t => this.normalizeSchoolName(t) === team),
            message: `Team found in scraped data but not in existing: ${team}`
          });
        }
      }
      
      // Find teams in existing but not scraped
      for (const team of existingTeams) {
        let found = false;
        for (const scrapedTeam of scrapedTeams) {
          if (this.similarity(team, scrapedTeam) >= 0.8) {
            found = true;
            break;
          }
        }
        if (!found) {
          results.discrepancies.push({
            type: 'extra_team',
            district: districtNum,
            year,
            team: existingYearData.teams.find(t => this.normalizeSchoolName(t) === team),
            message: `Team in existing data but not in scraped: ${team}`
          });
        }
      }
    }
    
    return results;
  }

  /**
   * Validate scraped co-ops against existing CSV data
   * @param {Array} scrapedCoops - Array of scraped co-op objects
   * @returns {Object} - Validation results
   */
  validateCoops(scrapedCoops) {
    console.log('[ValidationEngine] Validating co-ops against CSV data...');

    const results = {
      validatedAt: new Date().toISOString(),
      totalScraped: scrapedCoops.length,
      summary: {
        matched: 0,
        newCoops: 0,
        dissolved: 0,
        membershipChanges: 0,
        nameVariations: 0
      },
      matched: [],
      newCoops: [],
      dissolved: [],
      membershipChanges: [],
      nameVariations: [],
      allFindings: []
    };

    // Load existing co-ops from CSV
    const existingCoops = this.coopParser.loadExistingCoopsFromCSV();
    console.log(`[ValidationEngine] Loaded ${existingCoops.length} co-ops from CSV`);

    // Create normalized lookup map for existing co-ops
    const existingMap = new Map();
    for (const coop of existingCoops) {
      const key = this.normalizeSchoolName(coop.coopName || coop.fullName);
      existingMap.set(key, coop);
      
      // Also add component schools as alternative keys
      if (coop.componentSchools) {
        for (const component of coop.componentSchools) {
          const componentKey = this.normalizeSchoolName(component);
          if (!existingMap.has(componentKey)) {
            existingMap.set(componentKey, { ...coop, matchedVia: component });
          }
        }
      }
    }

    // Validate each scraped co-op
    const matchedExisting = new Set();

    for (const scraped of scrapedCoops) {
      if (!scraped.isCooperative) continue;

      const normalizedName = this.normalizeSchoolName(scraped.coopName || scraped.name);
      const finding = {
        scrapedName: scraped.name,
        coopName: scraped.coopName,
        componentSchools: scraped.componentSchools,
        yearsActive: scraped.yearsActive,
        status: 'unknown',
        matchedTo: null,
        issues: []
      };

      // Try to find a match in existing data
      let match = existingMap.get(normalizedName);

      // Try matching via component schools if direct match failed
      if (!match && scraped.componentSchools) {
        for (const component of scraped.componentSchools) {
          const componentKey = this.normalizeSchoolName(component);
          match = existingMap.get(componentKey);
          if (match) break;
        }
      }

      // Try fuzzy matching
      if (!match) {
        let bestScore = 0;
        for (const [key, existing] of existingMap) {
          const score = this.similarity(normalizedName, key);
          if (score > bestScore && score >= 0.6) {
            bestScore = score;
            match = { ...existing, fuzzyScore: score };
          }
        }
      }

      if (match) {
        finding.status = 'matched';
        finding.matchedTo = match.coopName || match.fullName;
        matchedExisting.add(this.normalizeSchoolName(match.coopName || match.fullName));

        // Check for membership changes
        if (scraped.componentSchools && match.componentSchools) {
          const scrapedComponents = new Set(scraped.componentSchools.map(s => this.normalizeSchoolName(s)));
          const existingComponents = new Set(match.componentSchools.map(s => this.normalizeSchoolName(s)));

          const added = [...scrapedComponents].filter(s => !existingComponents.has(s));
          const removed = [...existingComponents].filter(s => !scrapedComponents.has(s));

          if (added.length > 0 || removed.length > 0) {
            finding.status = 'membership_changed';
            finding.issues.push({
              type: 'membership_change',
              added: added.length > 0 ? scraped.componentSchools.filter(s => added.includes(this.normalizeSchoolName(s))) : [],
              removed: removed.length > 0 ? match.componentSchools.filter(s => removed.includes(this.normalizeSchoolName(s))) : []
            });
            results.summary.membershipChanges++;
            results.membershipChanges.push(finding);
          }
        }

        // Check for name variations
        if (match.fuzzyScore && match.fuzzyScore < 1.0) {
          finding.issues.push({
            type: 'name_variation',
            scraped: scraped.name,
            existing: match.fullName || match.coopName,
            similarity: match.fuzzyScore
          });
          results.summary.nameVariations++;
          results.nameVariations.push(finding);
        }

        if (finding.status === 'matched') {
          results.summary.matched++;
          results.matched.push(finding);
        }
      } else {
        // New co-op not in existing data
        finding.status = 'new';
        results.summary.newCoops++;
        results.newCoops.push(finding);
      }

      results.allFindings.push(finding);
    }

    // Find dissolved co-ops (in CSV but not scraped recently)
    const currentYear = new Date().getFullYear();
    for (const [key, existing] of existingMap) {
      if (!matchedExisting.has(key) && existing.isCooperative !== false) {
        // Only flag as dissolved if it's not matched via alternative key
        if (!existing.matchedVia) {
          results.dissolved.push({
            name: existing.fullName || existing.coopName,
            componentSchools: existing.componentSchools,
            status: 'dissolved',
            note: 'In CSV but not found in recent scrape'
          });
          results.summary.dissolved++;
        }
      }
    }

    console.log(`[ValidationEngine] Validation complete:`);
    console.log(`  - Matched: ${results.summary.matched}`);
    console.log(`  - New co-ops: ${results.summary.newCoops}`);
    console.log(`  - Membership changes: ${results.summary.membershipChanges}`);
    console.log(`  - Dissolved: ${results.summary.dissolved}`);

    return results;
  }

  /**
   * Generate a co-op validation report
   * @param {Object} validation - Validation results from validateCoops
   * @returns {Object} - Formatted report
   */
  generateCoopReport(validation) {
    const report = {
      generatedAt: new Date().toISOString(),
      summary: validation.summary,
      sections: {
        newCoops: validation.newCoops,
        membershipChanges: validation.membershipChanges,
        dissolved: validation.dissolved,
        nameVariations: validation.nameVariations
      }
    };

    return report;
  }

  /**
   * Save co-op validation report
   * @param {Object} report - Report to save
   * @param {string} filename - Output filename
   */
  saveCoopReport(report, filename = 'coop-validation-report.json') {
    const outputDir = path.join(__dirname, '..', '..', 'data');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Save JSON
    const jsonPath = path.join(outputDir, filename);
    fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2));
    console.log(`[ValidationEngine] Co-op report saved: ${jsonPath}`);

    // Save markdown
    const mdPath = path.join(outputDir, filename.replace('.json', '.md'));
    fs.writeFileSync(mdPath, this.formatCoopReportAsMarkdown(report));
    console.log(`[ValidationEngine] Markdown report saved: ${mdPath}`);

    return { json: jsonPath, markdown: mdPath };
  }

  /**
   * Format co-op report as markdown
   * @param {Object} report - Report object
   * @returns {string} - Markdown string
   */
  formatCoopReportAsMarkdown(report) {
    let md = `# Basketball Co-op Validation Report\n\n`;
    md += `Generated: ${report.generatedAt}\n\n`;

    md += `## Summary\n\n`;
    md += `| Metric | Count |\n`;
    md += `|--------|-------|\n`;
    md += `| Matched | ${report.summary.matched} |\n`;
    md += `| New Co-ops | ${report.summary.newCoops} |\n`;
    md += `| Membership Changes | ${report.summary.membershipChanges} |\n`;
    md += `| Dissolved | ${report.summary.dissolved} |\n`;
    md += `| Name Variations | ${report.summary.nameVariations} |\n\n`;

    if (report.sections.newCoops.length > 0) {
      md += `## New Co-ops (Not in CSV)\n\n`;
      md += `These co-ops were found in scraping but not in the existing CSV data.\n\n`;
      for (const coop of report.sections.newCoops) {
        const components = coop.componentSchools?.join(', ') || 'Unknown';
        const years = coop.yearsActive?.join(', ') || 'Unknown';
        md += `- **${coop.scrapedName}**\n`;
        md += `  - Components: ${components}\n`;
        md += `  - Years Active: ${years}\n`;
      }
      md += `\n`;
    }

    if (report.sections.membershipChanges.length > 0) {
      md += `## Membership Changes\n\n`;
      md += `These co-ops have different member schools than recorded in CSV.\n\n`;
      for (const coop of report.sections.membershipChanges) {
        md += `### ${coop.scrapedName}\n\n`;
        for (const issue of coop.issues) {
          if (issue.type === 'membership_change') {
            if (issue.added.length > 0) {
              md += `- **Added**: ${issue.added.join(', ')}\n`;
            }
            if (issue.removed.length > 0) {
              md += `- **Removed**: ${issue.removed.join(', ')}\n`;
            }
          }
        }
        md += `\n`;
      }
    }

    if (report.sections.dissolved.length > 0) {
      md += `## Potentially Dissolved Co-ops\n\n`;
      md += `These co-ops are in the CSV but were not found in recent scraping.\n\n`;
      for (const coop of report.sections.dissolved) {
        const components = coop.componentSchools?.join(', ') || 'Unknown';
        md += `- **${coop.name}** (${components})\n`;
      }
      md += `\n`;
    }

    if (report.sections.nameVariations.length > 0) {
      md += `## Name Variations\n\n`;
      md += `These co-ops matched but with different name formatting.\n\n`;
      for (const coop of report.sections.nameVariations) {
        for (const issue of coop.issues) {
          if (issue.type === 'name_variation') {
            md += `- Scraped: "${issue.scraped}" → CSV: "${issue.existing}" (${Math.round(issue.similarity * 100)}% match)\n`;
          }
        }
      }
      md += `\n`;
    }

    return md;
  }

  /**
   * Generate a validation report
   * @param {Array} schoolResults - School validation results
   * @param {Array} districtResults - District validation results
   * @returns {Object} - Summary report
   */
  generateReport(schoolResults = [], districtResults = []) {
    const report = {
      generatedAt: new Date().toISOString(),
      summary: {
        schoolsValidated: schoolResults.length,
        newSchools: 0,
        schoolsWithDiscrepancies: 0,
        yearsValidated: districtResults.length,
        newYears: 0,
        districtDiscrepancies: 0
      },
      schools: {
        new: [],
        discrepancies: [],
        suggestions: []
      },
      districts: {
        newData: [],
        discrepancies: [],
        suggestions: []
      }
    };
    
    // Process school results
    for (const result of schoolResults) {
      if (result.status === 'new') {
        report.summary.newSchools++;
        report.schools.new.push(result);
      }
      if (result.discrepancies.length > 0) {
        report.summary.schoolsWithDiscrepancies++;
        report.schools.discrepancies.push(result);
      }
      report.schools.suggestions.push(...result.suggestions);
    }
    
    // Process district results
    for (const result of districtResults) {
      if (result.newData) {
        report.summary.newYears++;
        report.districts.newData.push(result);
      }
      report.summary.districtDiscrepancies += result.discrepancies.length;
      report.districts.discrepancies.push(...result.discrepancies);
      report.districts.suggestions.push(...result.suggestions);
    }
    
    return report;
  }

  /**
   * Save report to file
   * @param {Object} report - Report object
   * @param {string} filename - Output filename
   */
  saveReport(report, filename = 'research-report.json') {
    const outputDir = path.join(__dirname, '..', '..', 'data');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    const outputPath = path.join(outputDir, filename);
    fs.writeFileSync(outputPath, JSON.stringify(report, null, 2));
    console.log(`[ValidationEngine] Report saved to: ${outputPath}`);
    
    // Also save a human-readable markdown version
    const mdPath = path.join(outputDir, filename.replace('.json', '.md'));
    fs.writeFileSync(mdPath, this.formatReportAsMarkdown(report));
    console.log(`[ValidationEngine] Markdown report saved to: ${mdPath}`);
    
    return { json: outputPath, markdown: mdPath };
  }

  /**
   * Format report as Markdown
   * @param {Object} report - Report object
   * @returns {string} - Markdown string
   */
  formatReportAsMarkdown(report) {
    let md = `# ND Class B Research Report\n\n`;
    md += `Generated: ${report.generatedAt}\n\n`;
    
    md += `## Summary\n\n`;
    md += `| Metric | Value |\n`;
    md += `|--------|-------|\n`;
    md += `| Schools Validated | ${report.summary.schoolsValidated} |\n`;
    md += `| New Schools Found | ${report.summary.newSchools} |\n`;
    md += `| Schools with Discrepancies | ${report.summary.schoolsWithDiscrepancies} |\n`;
    md += `| Years Validated | ${report.summary.yearsValidated} |\n`;
    md += `| New Years Data | ${report.summary.newYears} |\n`;
    md += `| District Discrepancies | ${report.summary.districtDiscrepancies} |\n`;
    md += `\n`;
    
    if (report.schools.new.length > 0) {
      md += `## New Schools Found\n\n`;
      for (const school of report.schools.new) {
        md += `- **${school.scrapedName}**\n`;
      }
      md += `\n`;
    }
    
    if (report.schools.discrepancies.length > 0) {
      md += `## School Discrepancies\n\n`;
      for (const school of report.schools.discrepancies) {
        md += `### ${school.scrapedName}\n\n`;
        for (const disc of school.discrepancies) {
          md += `- **${disc.field}**: Existing: "${disc.existing}" vs Scraped: "${disc.scraped}"\n`;
        }
        md += `\n`;
      }
    }
    
    if (report.districts.discrepancies.length > 0) {
      md += `## District Discrepancies\n\n`;
      for (const disc of report.districts.discrepancies) {
        md += `- **District ${disc.district} (${disc.year})**: ${disc.message}\n`;
      }
      md += `\n`;
    }
    
    if (report.districts.newData.length > 0) {
      md += `## New Year Data Available\n\n`;
      for (const yearData of report.districts.newData) {
        md += `- **${yearData.year}**: ${yearData.suggestions.length} suggestions\n`;
      }
      md += `\n`;
    }
    
    return md;
  }
}

module.exports = ValidationEngine;
