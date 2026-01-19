/**
 * Basketball Co-op Scraper
 * Scrapes boys basketball co-op data from 2013 onwards
 * Primary source: MaxPreps (structured HTML)
 */

const BaseScraper = require('./BaseScraper');
const CoopParser = require('./coopParser');
const path = require('path');
const fs = require('fs');

class CoopScraper extends BaseScraper {
  constructor() {
    super({
      name: 'CoopScraper',
      baseUrl: 'https://www.maxpreps.com',
      rateLimit: 4000, // 4 seconds between requests
      cacheTtl: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    this.parser = new CoopParser();
    this.outputDir = path.join(__dirname, '..', '..', 'data');
    
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  /**
   * Clean up team name by removing city/state suffix and formatting
   * Uses a list of known ND cities for precise cleaning
   * @param {string} name - Raw team name
   * @returns {string} - Cleaned name
   */
  cleanTeamName(name) {
    if (!name) return '';
    
    let cleaned = name.trim();
    
    // Skip abbreviations like "CML (CO-OP)" or "NS (CO-OP)" - these aren't useful
    if (/^[A-Z]{2,4}\s*\(CO-?OP\)/i.test(cleaned)) {
      return ''; // Will be filtered out
    }
    
    // Remove "(CO-OP)" suffix but keep the name
    cleaned = cleaned.replace(/\s*\(CO-?OP\)\s*/gi, '').trim();
    
    // Fix leading doubled letters like "BBenson" -> "Benson", "NNorth" -> "North"
    cleaned = cleaned.replace(/^([A-Z])\1([a-z])/, '$1$2');
    
    // Common ND cities that MaxPreps concatenates to team names
    // Multi-word cities listed first (sorted by length descending) for proper matching
    const ndCities = [
      // Multi-word cities (must be checked first)
      'Churchs Ferry', 'Devils Lake', 'Fort Totten', 'Fort Yates', 'Glen Ullin',
      'Golden Valley', 'Grace City', 'Grand Forks', 'New England', 'New Hradec',
      'New Leipzig', 'New Rockford', 'New Salem', 'New Town', 'Park River',
      'Powers Lake', 'Rock Lake', 'South Heart', 'Spring Brook', 'St. John',
      'Tower City', 'Turtle Lake', 'Valley City', 'Watford City', 'West Fargo',
      // Single-word cities
      'Minot', 'Bismarck', 'Fargo', 'Jamestown', 'Dickinson', 'Williston',
      'Mandan', 'Rugby', 'Grafton', 'Bottineau', 'Bowman', 'Belfield',
      'Beulah', 'Carrington', 'Cavalier', 'Center', 'Cooperstown', 'Crosby',
      'Drake', 'Elgin', 'Ellendale', 'Enderlin', 'Fessenden', 'Finley',
      'Forman', 'Gwinner', 'Harvey', 'Hatton', 'Hazelton', 'Hebron',
      'Hettinger', 'Hillsboro', 'Kenmare', 'Kensal', 'Killdeer', 'Kulm',
      'Lakota', 'LaMoure', 'Langdon', 'Larimore', 'Leeds', 'Lidgerwood',
      'Lignite', 'Linton', 'Lisbon', 'Maddock', 'Makoti', 'McClusky',
      'Medina', 'Milnor', 'Minnewaukan', 'Minto', 'Mohall', 'Mott',
      'Munich', 'Napoleon', 'Northwood', 'Oakes', 'Parshall', 'Pembina',
      'Ray', 'Renville', 'Richardton', 'Rolla', 'Rolette', 'Scranton',
      'Sharon', 'Sheyenne', 'Stanley', 'Stanton', 'Steele', 'Strasburg',
      'Tappen', 'Tioga', 'Underwood', 'Velva', 'Walhalla', 'Washburn',
      'Wilton', 'Wishek', 'Wing', 'Wolford', 'Anamoose', 'Ashley',
      'Berthold', 'Braddock', 'Buxton', 'Cando', 'Carson', 'Casselton',
      'Edgeley', 'Egeland', 'Fairmont', 'Fairmount', 'Fordville', 'Gackle',
      'Glenfield', 'Hope', 'Inkster', 'Lankin', 'Marion', 'Montpelier',
      'Page', 'Pingree', 'Rogers', 'Starkweather', 'Streeter', 'Upham'
    ];
    
    // First remove ", ND" or ", North Dakota" at end
    cleaned = cleaned.replace(/,\s*(?:ND|North Dakota)\s*$/i, '');
    
    // Now check for concatenated city names at end of each segment
    for (const city of ndCities) {
      // Pattern: lowercase/punctuation followed by city name at end
      // e.g., "AnamooseDrake" -> city "Drake" concatenated
      const concatPattern = new RegExp(`([a-z\\]\\)\\-])${city}$`, 'i');
      if (concatPattern.test(cleaned)) {
        cleaned = cleaned.replace(concatPattern, '$1');
        break;
      }
    }
    
    // Clean up trailing punctuation
    cleaned = cleaned.replace(/[\-\/]+$/, '').trim();
    cleaned = cleaned.replace(/^[\-\/]+/, '').trim();
    cleaned = cleaned.replace(/\[\s*\]/, '').trim();
    
    return cleaned;
  }

  /**
   * Scrape current basketball teams from MaxPreps ND page
   * @returns {Array} - List of teams with co-op info
   */
  async scrapeMaxPrepsTeams() {
    console.log('[CoopScraper] Scraping MaxPreps ND basketball teams...');

    const teams = [];
    const seenNames = new Set();

    try {
      // Updated URL patterns based on current MaxPreps structure
      const urls = [
        `${this.baseUrl}/nd/basketball/schools/`,
        `${this.baseUrl}/state/north-dakota/basketball/teams/`,
        `${this.baseUrl}/nd/basketball/rankings/1/`,
        `${this.baseUrl}/nd/basketball/25-26/class/class-b/rankings/1/`,
      ];

      for (const url of urls) {
        try {
          const html = await this.fetchPage(url);
          const $ = this.parseHtml(html);

          // Primary selector: links containing basketball school URLs
          $('a[href*="/nd/"][href*="/basketball/"]').each((i, el) => {
            const $el = $(el);
            let name = $el.text().trim();
            const href = $el.attr('href');

            // Clean up name - remove city/state suffix if present
            name = this.cleanTeamName(name);
            
            // Navigation items and false positives to filter out
            const NAV_ITEMS = [
              'nd boys basketball home', 'nd girls basketball home', 'teams', 'nd players',
              'stat leaders', 'ndhsaa playoffs', 'rankings', 'nd basketball teams',
              'north dakota high school basketball', 'north dakota basketball playoffs',
              'north dakota basketball stat leaders', 'nd basketball player directory',
              'north dakota basketball rankings', 'north dakota high school activities association',
              'player directory', 'team directory', 'home', 'schedule', 'scores',
              'stats', 'standings', 'playoffs', 'bracket', 'more teams'
            ];
            
            // Skip navigation links, empty, or too short names
            if (!name || 
                name.length < 3 || 
                name.length > 80 ||
                NAV_ITEMS.includes(name.toLowerCase()) ||
                name.toLowerCase().includes('more') ||
                name.toLowerCase().includes('view all') ||
                name.toLowerCase().includes('sign') ||
                name.toLowerCase().includes('scores') ||
                name.toLowerCase().includes('schedule') ||
                name.toLowerCase().includes('stats') ||
                name.toLowerCase().includes('rankings') ||
                name.toLowerCase().includes('directory') ||
                name.toLowerCase().includes('playoffs') ||
                seenNames.has(name.toLowerCase())) {
              return;
            }
            
            seenNames.add(name.toLowerCase());
            
            const parsed = this.parser.parseCoopName(name);
            
            teams.push({
              name,
              url: href ? (href.startsWith('http') ? href : `${this.baseUrl}${href}`) : null,
              ...parsed,
              source: 'maxpreps-teams',
              sport: 'basketball',
              gender: 'boys',
              scrapedAt: new Date().toISOString()
            });
          });

          // Secondary: look for team names in tables (rankings pages)
          $('table td').each((i, el) => {
            const $el = $(el);
            let text = $el.text().trim();
            
            // Skip if it's just a number (rank) or empty
            if (!text || /^\d+$/.test(text)) return;
            
            // Extract team name, handling "(CO-OP)" suffix
            const coopMatch = text.match(/^([A-Za-z\s\-\/\[\]]+)\s*\(CO-?OP\)/i);
            if (coopMatch) {
              text = coopMatch[1].trim();
            }
            
            // Clean and validate
            text = this.cleanTeamName(text);
            if (text.length < 3 || text.length > 80 || seenNames.has(text.toLowerCase())) return;
            
            // Only process if it looks like a school name
            if (/^[A-Z][a-zA-Z\s\-\/\[\]]+$/.test(text)) {
              seenNames.add(text.toLowerCase());
              
              const parsed = this.parser.parseCoopName(text);
              
              teams.push({
                name: text,
                url: null,
                ...parsed,
                source: 'maxpreps-rankings',
                sport: 'basketball',
                gender: 'boys',
                scrapedAt: new Date().toISOString()
              });
            }
          });

          if (teams.length > 0) {
            console.log(`[CoopScraper] Found ${teams.length} teams from ${url}`);
          }
        } catch (error) {
          console.log(`[CoopScraper] URL ${url} failed: ${error.message}`);
          continue;
        }
      }

      const coopCount = teams.filter(t => t.isCooperative).length;
      console.log(`[CoopScraper] Total: ${teams.length} teams, ${coopCount} co-ops`);

    } catch (error) {
      console.error(`[CoopScraper] Error scraping MaxPreps teams: ${error.message}`);
    }

    return teams;
  }

  /**
   * Scrape playoff bracket for a specific year
   * @param {number} year - Year (e.g., 2024)
   * @returns {Object} - Bracket data with teams
   */
  async scrapePlayoffBracket(year) {
    console.log(`[CoopScraper] Scraping ${year} boys Class B bracket...`);

    const bracket = {
      year,
      gender: 'boys',
      classification: 'Class B',
      teams: [],
      source: 'maxpreps-bracket'
    };

    const seenNames = new Set();
    
    // Calculate season string (e.g., 2024 -> "23-24")
    const seasonStart = (year - 1).toString().slice(-2);
    const seasonEnd = year.toString().slice(-2);
    const seasonStr = `${seasonStart}-${seasonEnd}`;

    try {
      // Updated URL patterns for MaxPreps brackets
      const urlPatterns = [
        `${this.baseUrl}/nd/basketball/${seasonStr}/class/class-b/rankings/1/`,
        `${this.baseUrl}/nd/basketball/playoffs/`,
        `${this.baseUrl}/nd/basketball/${seasonStr}/playoffs/`,
        `${this.baseUrl}/tournament/basketball/${year}/nd/class-b/`,
        `${this.baseUrl}/nd/basketball/scores/`,
      ];

      for (const url of urlPatterns) {
        try {
          const html = await this.fetchPage(url);
          const $ = this.parseHtml(html);

          // Look for team names in links to basketball pages
          $('a[href*="/nd/"][href*="/basketball/"]').each((i, el) => {
            let name = $(el).text().trim();
            
            // Clean up the name
            name = this.cleanTeamName(name);
            
            // Skip navigation and invalid entries
            if (!name || 
                name.length < 3 || 
                name.length > 80 ||
                /^\d+$/.test(name) ||
                name.toLowerCase().includes('round') ||
                name.toLowerCase().includes('quarter') ||
                name.toLowerCase().includes('semi') ||
                name.toLowerCase().includes('final') ||
                name.toLowerCase().includes('bracket') ||
                name.toLowerCase().includes('scores') ||
                name.toLowerCase().includes('schedule') ||
                seenNames.has(name.toLowerCase())) {
              return;
            }
            
            seenNames.add(name.toLowerCase());
            
            const parsed = this.parser.parseCoopName(name);

            bracket.teams.push({
              name,
              ...parsed,
              year
            });
          });

          // Also look in table cells for rankings/standings
          $('table td, table th').each((i, el) => {
            let text = $(el).text().trim();
            
            // Handle "(CO-OP)" suffix
            const coopMatch = text.match(/^([A-Za-z\s\-\/\[\]]+)\s*\(CO-?OP\)/i);
            if (coopMatch) {
              text = coopMatch[1].trim();
            }
            
            text = this.cleanTeamName(text);
            
            if (!text || 
                text.length < 3 || 
                text.length > 80 ||
                /^\d+$/.test(text) ||
                seenNames.has(text.toLowerCase())) {
              return;
            }
            
            // Only process if it looks like a school/team name
            if (/^[A-Z][a-zA-Z\s\-\/\[\]\.]+$/.test(text)) {
              seenNames.add(text.toLowerCase());
              
              const parsed = this.parser.parseCoopName(text);

              bracket.teams.push({
                name: text,
                ...parsed,
                year
              });
            }
          });

          if (bracket.teams.length > 0) {
            console.log(`[CoopScraper] Found ${bracket.teams.length} teams in ${year} bracket from ${url}`);
            break;
          }
        } catch (e) {
          continue;
        }
      }

      if (bracket.teams.length === 0) {
        console.log(`[CoopScraper] No teams found for ${year} bracket`);
      }

    } catch (error) {
      console.error(`[CoopScraper] Error scraping ${year} bracket: ${error.message}`);
    }

    return bracket;
  }

  /**
   * Scrape NDHSAA basketball page for current season teams
   * @returns {Array} - Teams found
   */
  async scrapeNDHSAABasketball() {
    console.log('[CoopScraper] Scraping NDHSAA basketball page...');

    const teams = [];
    const seenNames = new Set();

    try {
      const urls = [
        'https://www.ndhsaa.com/sports/basketball/boys',
        'https://www.ndhsaa.com/sports/basketball/boys/class-b',
        'https://www.ndhsaa.com/sports/basketball',
      ];

      for (const url of urls) {
        try {
          const html = await this.fetchPage(url);
          const $ = this.parseHtml(html);

          // Look for team/school links and text containing school names
          $('a, td, li, span, div').each((i, el) => {
            const $el = $(el);
            let text = $el.text().trim();
            const href = $el.attr('href') || '';
            
            // Skip if it's a container with too much text
            if (text.length > 150) return;
            
            // Clean up text - get first meaningful segment
            text = text.split(/\s{3,}|\n|\t/)[0].trim();
            
            // Skip common navigation/header text
            if (!text ||
                text.length < 3 ||
                text.length > 100 ||
                seenNames.has(text.toLowerCase()) ||
                text.toLowerCase().includes('member school') ||
                text.toLowerCase().includes('click here') ||
                text.toLowerCase().includes('view') ||
                text.toLowerCase().includes('schedule') ||
                text.toLowerCase().includes('score') ||
                text.toLowerCase().includes('district') ||
                text.toLowerCase().includes('region') ||
                text.toLowerCase().includes('class b') ||
                text.toLowerCase().includes('basketball') ||
                /^\d+$/.test(text)) {
              return;
            }
            
            // Check if it looks like a school/team name
            // Should start with capital letter and contain school-like patterns
            const looksLikeSchool = /^[A-Z][a-zA-Z\s\-\/\[\]\(\)]+$/.test(text) &&
              (href.includes('school') || 
               href.includes('team') || 
               text.includes('/') || 
               text.includes('[') ||
               text.match(/^[A-Z][a-z]+(\s[A-Z][a-z]+)*$/));
            
            if (looksLikeSchool) {
              seenNames.add(text.toLowerCase());
              
              const parsed = this.parser.parseCoopName(text);
              
              teams.push({
                name: text,
                ...parsed,
                source: 'ndhsaa',
                sport: 'basketball',
                gender: 'boys',
                scrapedAt: new Date().toISOString()
              });
            }
          });

          if (teams.length > 0) {
            console.log(`[CoopScraper] Found ${teams.length} teams from NDHSAA`);
            break;
          }
        } catch (error) {
          console.log(`[CoopScraper] URL ${url} failed: ${error.message}`);
          continue;
        }
      }

    } catch (error) {
      console.error(`[CoopScraper] Error scraping NDHSAA: ${error.message}`);
    }

    return teams;
  }

  /**
   * Run full co-op scrape for all years from 2013+
   * @param {Object} options - Scrape options
   * @returns {Object} - All scraped co-op data
   */
  async scrapeAllCoops(options = {}) {
    const {
      startYear = 2013,
      endYear = new Date().getFullYear(),
    } = options;

    console.log(`\n${'='.repeat(60)}`);
    console.log('Basketball Co-op Scraper (Boys)');
    console.log('='.repeat(60));
    console.log(`Years: ${startYear}-${endYear}`);
    console.log('='.repeat(60) + '\n');

    const results = {
      startedAt: new Date().toISOString(),
      options: { startYear, endYear, gender: 'boys' },
      currentTeams: [],
      ndhsaaTeams: [],
      bracketsByYear: {},
      allCoops: [],
      summary: {
        totalTeamsScraped: 0,
        totalCoopsFound: 0,
        coopsByYear: {},
        uniqueCoops: 0
      }
    };

    try {
      // 1. Scrape current teams from MaxPreps
      console.log('\n📋 Phase 1: Scraping current MaxPreps teams...');
      results.currentTeams = await this.scrapeMaxPrepsTeams();
      results.summary.totalTeamsScraped += results.currentTeams.length;

      // 2. Scrape NDHSAA for additional teams
      console.log('\n📋 Phase 2: Scraping NDHSAA basketball page...');
      results.ndhsaaTeams = await this.scrapeNDHSAABasketball();
      results.summary.totalTeamsScraped += results.ndhsaaTeams.length;

      // 3. Scrape historical brackets year by year
      console.log('\n📋 Phase 3: Scraping historical brackets...');
      for (let year = endYear; year >= startYear; year--) {
        const bracket = await this.scrapePlayoffBracket(year);
        results.bracketsByYear[year] = bracket;
        
        // Track co-ops by year
        const yearCoops = bracket.teams.filter(t => t.isCooperative);
        results.summary.coopsByYear[year] = yearCoops.map(c => ({
          name: c.name,
          coopName: c.coopName,
          componentSchools: c.componentSchools
        }));
      }

      // 4. Compile all unique co-ops
      console.log('\n📋 Phase 4: Compiling unique co-ops...');
      const coopMap = new Map();

      // From current teams
      for (const team of results.currentTeams) {
        if (team.isCooperative) {
          const key = this.normalizeSchoolName(team.name);
          if (!coopMap.has(key)) {
            coopMap.set(key, {
              ...team,
              yearsActive: [endYear],
              sources: ['maxpreps-teams']
            });
          }
        }
      }

      // From NDHSAA
      for (const team of results.ndhsaaTeams) {
        if (team.isCooperative) {
          const key = this.normalizeSchoolName(team.name);
          if (coopMap.has(key)) {
            const existing = coopMap.get(key);
            if (!existing.sources.includes('ndhsaa')) {
              existing.sources.push('ndhsaa');
            }
          } else {
            coopMap.set(key, {
              ...team,
              yearsActive: [endYear],
              sources: ['ndhsaa']
            });
          }
        }
      }

      // From brackets
      for (const [year, bracket] of Object.entries(results.bracketsByYear)) {
        for (const team of bracket.teams || []) {
          if (team.isCooperative) {
            const key = this.normalizeSchoolName(team.name);
            if (coopMap.has(key)) {
              const existing = coopMap.get(key);
              const yearNum = parseInt(year);
              if (!existing.yearsActive.includes(yearNum)) {
                existing.yearsActive.push(yearNum);
              }
              if (!existing.sources.includes('bracket')) {
                existing.sources.push('bracket');
              }
            } else {
              coopMap.set(key, {
                ...team,
                yearsActive: [parseInt(year)],
                sources: ['bracket']
              });
            }
          }
        }
      }

      // Sort and finalize
      results.allCoops = Array.from(coopMap.values())
        .map(coop => ({
          ...coop,
          yearsActive: coop.yearsActive.sort((a, b) => a - b)
        }))
        .sort((a, b) => a.name.localeCompare(b.name));

      results.summary.totalCoopsFound = results.allCoops.length;
      results.summary.uniqueCoops = coopMap.size;

    } finally {
      await this.close();
    }

    results.completedAt = new Date().toISOString();

    // Save results
    this.saveResults(results);

    return results;
  }

  /**
   * Save scrape results to files
   * @param {Object} results - Scrape results
   */
  saveResults(results) {
    // Save full JSON
    const jsonPath = path.join(this.outputDir, 'basketball-coops.json');
    fs.writeFileSync(jsonPath, JSON.stringify(results, null, 2));
    console.log(`\n[CoopScraper] Saved: ${jsonPath}`);

    // Save co-ops CSV for easy viewing
    const csvPath = path.join(this.outputDir, 'basketball-coops.csv');
    const csvLines = ['Name,Coop Name,Component Schools,Years Active,Sources,Is Cooperative'];

    for (const coop of results.allCoops) {
      const components = coop.componentSchools?.join('; ') || '';
      const years = coop.yearsActive?.join('; ') || '';
      const sources = coop.sources?.join('; ') || '';
      csvLines.push(`"${coop.name}","${coop.coopName || ''}","${components}","${years}","${sources}",${coop.isCooperative}`);
    }

    fs.writeFileSync(csvPath, csvLines.join('\n'));
    console.log(`[CoopScraper] Saved: ${csvPath}`);

    // Save summary markdown
    const mdPath = path.join(this.outputDir, 'basketball-coops.md');
    let md = `# Boys Basketball Co-ops (2013-${new Date().getFullYear()})\n\n`;
    md += `Generated: ${results.completedAt}\n\n`;
    md += `## Summary\n\n`;
    md += `- Total teams scraped: ${results.summary.totalTeamsScraped}\n`;
    md += `- Unique co-ops found: ${results.summary.uniqueCoops}\n\n`;

    md += `## Co-ops by Year\n\n`;
    const sortedYears = Object.keys(results.summary.coopsByYear).sort((a, b) => b - a);
    
    for (const year of sortedYears) {
      const coops = results.summary.coopsByYear[year];
      if (coops && coops.length > 0) {
        md += `### ${year}\n\n`;
        for (const coop of coops) {
          const components = coop.componentSchools?.length > 0
            ? ` (${coop.componentSchools.join(', ')})`
            : '';
          md += `- ${coop.name}${components}\n`;
        }
        md += `\n`;
      }
    }

    md += `## All Co-ops (Alphabetical)\n\n`;
    md += `| Co-op Name | Component Schools | Years Active | Sources |\n`;
    md += `|------------|-------------------|--------------|----------|\n`;

    for (const coop of results.allCoops) {
      const components = coop.componentSchools?.join(', ') || '-';
      const years = coop.yearsActive?.join(', ') || '-';
      const sources = coop.sources?.join(', ') || '-';
      md += `| ${coop.name} | ${components} | ${years} | ${sources} |\n`;
    }

    fs.writeFileSync(mdPath, md);
    console.log(`[CoopScraper] Saved: ${mdPath}`);
  }
}

module.exports = CoopScraper;
