/**
 * NDHSAA (North Dakota High School Activities Association) Scraper
 * Primary source for official district assignments, school rosters, and co-ops
 */

const BaseScraper = require('./BaseScraper');
const cache = require('./cache');
const path = require('path');

class NDHSAAScraper extends BaseScraper {
  constructor() {
    super({
      name: 'NDHSAA',
      baseUrl: 'https://www.ndhsaa.com',
      rateLimit: 3000, // 3 seconds between requests (be respectful)
      cacheTtl: 7 * 24 * 60 * 60 * 1000, // 7 days cache
    });
  }

  /**
   * Get list of all Class B schools from NDHSAA
   * @returns {Array} - Array of school objects
   */
  async getSchoolList() {
    try {
      // NDHSAA school directory page
      const url = `${this.baseUrl}/schools`;
      const html = await this.fetchPage(url);
      const $ = this.parseHtml(html);
      
      const schools = [];
      
      // Look for school links - adjust selectors based on actual site structure
      $('a[href*="/school/"], .school-item, .school-link, [data-school]').each((i, el) => {
        const $el = $(el);
        const name = $el.text().trim();
        const href = $el.attr('href');
        
        if (name && href) {
          schools.push({
            name,
            url: href.startsWith('http') ? href : `${this.baseUrl}${href}`,
            source: 'ndhsaa'
          });
        }
      });
      
      // Also try table rows
      $('table tr').each((i, el) => {
        const $row = $(el);
        const cells = $row.find('td');
        if (cells.length > 0) {
          const name = cells.first().text().trim();
          const link = cells.find('a').attr('href');
          if (name && name.length > 2) {
            schools.push({
              name,
              url: link ? (link.startsWith('http') ? link : `${this.baseUrl}${link}`) : null,
              source: 'ndhsaa'
            });
          }
        }
      });
      
      console.log(`[NDHSAA] Found ${schools.length} schools`);
      return schools;
    } catch (error) {
      console.error(`[NDHSAA] Error getting school list: ${error.message}`);
      return [];
    }
  }

  /**
   * Get basketball-specific pages for Class B district info
   * @param {number} year - School year (e.g., 2024 for 2024-25 season)
   * @returns {Object} - District data
   */
  async getBasketballDistricts(year) {
    try {
      // Try different URL patterns for basketball pages
      const urls = [
        `${this.baseUrl}/basketball/boys/classb`,
        `${this.baseUrl}/sports/basketball/boys/class-b`,
        `${this.baseUrl}/activities/boys-basketball/class-b`,
        `${this.baseUrl}/boys-basketball/class-b/standings`,
      ];
      
      const districts = {};
      
      for (const url of urls) {
        try {
          const html = await this.fetchPage(url);
          const $ = this.parseHtml(html);
          
          // Look for district information
          $('h2, h3, h4, .district-header').each((i, el) => {
            const text = $(el).text();
            const districtMatch = text.match(/District\s*(\d+)/i);
            
            if (districtMatch) {
              const districtNum = parseInt(districtMatch[1]);
              const $container = $(el).next('ul, ol, table, .school-list');
              const teams = [];
              
              $container.find('li, tr, .team').each((j, teamEl) => {
                const teamName = $(teamEl).text().trim();
                if (teamName) {
                  teams.push(teamName);
                }
              });
              
              if (teams.length > 0) {
                districts[districtNum] = { teams, year, source: url };
              }
            }
          });
          
          // Also look for tables with district data
          $('table').each((i, table) => {
            const $table = $(table);
            const caption = $table.find('caption').text() || $table.prev('h3').text();
            const districtMatch = caption.match(/District\s*(\d+)/i);
            
            if (districtMatch) {
              const districtNum = parseInt(districtMatch[1]);
              const teams = [];
              
              $table.find('tr').each((j, row) => {
                const name = $(row).find('td').first().text().trim();
                if (name && name.length > 2 && !name.toLowerCase().includes('team')) {
                  teams.push(name);
                }
              });
              
              if (teams.length > 0) {
                districts[districtNum] = { teams, year, source: url };
              }
            }
          });
          
          if (Object.keys(districts).length > 0) {
            console.log(`[NDHSAA] Found districts in ${url}`);
            break;
          }
        } catch (e) {
          // URL not found, try next
          continue;
        }
      }
      
      // Store scraped data
      if (Object.keys(districts).length > 0) {
        cache.storeScrapedData('ndhsaa', 'districts', districts, year);
      }
      
      return districts;
    } catch (error) {
      console.error(`[NDHSAA] Error getting basketball districts: ${error.message}`);
      return {};
    }
  }

  /**
   * Scrape school detail page for mascot, logo, and roster info
   * @param {string} schoolUrl - URL of the school page
   * @returns {Object} - School details
   */
  async getSchoolDetails(schoolUrl) {
    try {
      const html = await this.fetchPage(schoolUrl);
      const $ = this.parseHtml(html);
      
      const details = {
        url: schoolUrl,
        source: 'ndhsaa',
        scrapedAt: new Date().toISOString()
      };
      
      // Try to extract school name
      details.name = $('h1, .school-name, .page-title').first().text().trim();
      
      // Try to find mascot
      const mascotPatterns = [
        '.mascot', '.team-name', '.nickname',
        'span:contains("Mascot")', 'p:contains("Nickname")'
      ];
      
      for (const pattern of mascotPatterns) {
        const $el = $(pattern);
        if ($el.length) {
          const text = $el.text().replace(/mascot|nickname/gi, '').trim();
          if (text) {
            details.mascot = text;
            break;
          }
        }
      }
      
      // Try to find logo
      const logoSelectors = [
        '.school-logo img', '.team-logo img', '.logo img',
        'img[alt*="logo"]', 'img[src*="logo"]', 'img[class*="logo"]'
      ];
      
      for (const selector of logoSelectors) {
        const $img = $(selector).first();
        if ($img.length) {
          let src = $img.attr('src');
          if (src) {
            if (!src.startsWith('http')) {
              src = new URL(src, this.baseUrl).href;
            }
            details.logoUrl = src;
            break;
          }
        }
      }
      
      // Try to find city/location
      const cityPatterns = [
        '.city', '.location', '.address',
        'span:contains("City")', 'p:contains("Location")'
      ];
      
      for (const pattern of cityPatterns) {
        const $el = $(pattern);
        if ($el.length) {
          const text = $el.text().replace(/city|location|address/gi, '').trim();
          if (text) {
            details.city = text;
            break;
          }
        }
      }
      
      // Store in cache
      if (details.name) {
        cache.storeScrapedData('ndhsaa', 'school', details, null, details.name);
      }
      
      return details;
    } catch (error) {
      console.error(`[NDHSAA] Error getting school details: ${error.message}`);
      return null;
    }
  }

  /**
   * Search for a specific school by name
   * @param {string} schoolName - Name of the school
   * @returns {Object|null} - School info or null
   */
  async searchSchool(schoolName) {
    try {
      const searchUrl = `${this.baseUrl}/search?q=${encodeURIComponent(schoolName)}`;
      const html = await this.fetchPage(searchUrl);
      const $ = this.parseHtml(html);
      
      const normalizedSearch = this.normalizeSchoolName(schoolName);
      let bestMatch = null;
      
      // Look through search results
      $('a').each((i, el) => {
        const text = $(el).text().trim();
        const href = $(el).attr('href');
        
        if (this.normalizeSchoolName(text).includes(normalizedSearch) ||
            normalizedSearch.includes(this.normalizeSchoolName(text))) {
          bestMatch = {
            name: text,
            url: href?.startsWith('http') ? href : `${this.baseUrl}${href}`,
            source: 'ndhsaa-search'
          };
          return false; // break
        }
      });
      
      return bestMatch;
    } catch (error) {
      console.error(`[NDHSAA] Error searching for school: ${error.message}`);
      return null;
    }
  }

  /**
   * Run full scrape for recent years
   * @param {number} startYear - Start year (e.g., 2014)
   * @param {number} endYear - End year (e.g., 2025)
   * @returns {Object} - All scraped data
   */
  async scrapeAll(startYear = 2014, endYear = new Date().getFullYear()) {
    console.log(`[NDHSAA] Starting full scrape for years ${startYear}-${endYear}`);
    
    const results = {
      schools: [],
      districts: {},
      errors: []
    };
    
    try {
      // Get school list
      results.schools = await this.getSchoolList();
      
      // Get districts for each year
      for (let year = startYear; year <= endYear; year++) {
        console.log(`[NDHSAA] Scraping year ${year}...`);
        const districts = await this.getBasketballDistricts(year);
        if (Object.keys(districts).length > 0) {
          results.districts[year] = districts;
        }
      }
      
      // Get details for first few schools (sample)
      const sampleSize = Math.min(10, results.schools.length);
      for (let i = 0; i < sampleSize; i++) {
        const school = results.schools[i];
        if (school.url) {
          const details = await this.getSchoolDetails(school.url);
          if (details) {
            Object.assign(school, details);
          }
        }
      }
      
    } catch (error) {
      console.error(`[NDHSAA] Scrape error: ${error.message}`);
      results.errors.push(error.message);
    } finally {
      await this.close();
    }
    
    console.log(`[NDHSAA] Scrape complete. Found ${results.schools.length} schools, ${Object.keys(results.districts).length} years of district data`);
    
    return results;
  }
}

module.exports = NDHSAAScraper;
