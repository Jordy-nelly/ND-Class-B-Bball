/**
 * MaxPreps Scraper
 * Backup source for school verification, team records, and logos
 */

const BaseScraper = require('./BaseScraper');
const cache = require('./cache');

class MaxPrepsScraper extends BaseScraper {
  constructor() {
    super({
      name: 'MaxPreps',
      baseUrl: 'https://www.maxpreps.com',
      rateLimit: 4000, // 4 seconds between requests
      cacheTtl: 7 * 24 * 60 * 60 * 1000, // 7 days cache
    });
  }

  /**
   * Search for a school on MaxPreps
   * @param {string} schoolName - Name of the school
   * @param {string} state - State abbreviation (default: ND)
   * @returns {Object|null} - School info or null
   */
  async searchSchool(schoolName, state = 'ND') {
    try {
      const searchQuery = `${schoolName} ${state}`;
      const searchUrl = `${this.baseUrl}/search/default.aspx?type=school&search=${encodeURIComponent(searchQuery)}`;
      
      const html = await this.fetchPage(searchUrl);
      const $ = this.parseHtml(html);
      
      const normalizedSearch = this.normalizeSchoolName(schoolName);
      let bestMatch = null;
      
      // Look for school results
      $('.school-name, .result-item, a[href*="/high-schools/"]').each((i, el) => {
        const $el = $(el);
        const name = $el.text().trim();
        const href = $el.attr('href') || $el.find('a').attr('href');
        
        // Check if it's a ND school
        const locationText = $el.parent().text() || '';
        if (!locationText.toLowerCase().includes('north dakota') && 
            !locationText.includes(', ND') &&
            !href?.includes('/nd/')) {
          return; // Skip non-ND schools
        }
        
        const normalizedName = this.normalizeSchoolName(name);
        
        if (normalizedName.includes(normalizedSearch) || 
            normalizedSearch.includes(normalizedName)) {
          bestMatch = {
            name,
            url: href?.startsWith('http') ? href : `${this.baseUrl}${href}`,
            source: 'maxpreps'
          };
          return false; // break
        }
      });
      
      return bestMatch;
    } catch (error) {
      console.error(`[MaxPreps] Error searching for school: ${error.message}`);
      return null;
    }
  }

  /**
   * Get school details from MaxPreps school page
   * @param {string} schoolUrl - MaxPreps school URL
   * @returns {Object} - School details
   */
  async getSchoolDetails(schoolUrl) {
    try {
      const html = await this.fetchPage(schoolUrl);
      const $ = this.parseHtml(html);
      
      const details = {
        url: schoolUrl,
        source: 'maxpreps',
        scrapedAt: new Date().toISOString()
      };
      
      // School name
      details.name = $('h1, .school-name, [data-school-name]').first().text().trim();
      
      // Mascot/Nickname
      const nicknameSelectors = [
        '.mascot', '.nickname', '.team-name',
        'span[class*="nickname"]', '[data-nickname]'
      ];
      
      for (const selector of nicknameSelectors) {
        const text = $(selector).first().text().trim();
        if (text) {
          details.mascot = text;
          break;
        }
      }
      
      // Also try to extract from school name (e.g., "Minot Magicians")
      if (!details.mascot && details.name) {
        const parts = details.name.split(' ');
        if (parts.length >= 2) {
          // Last word might be mascot
          const potentialMascot = parts[parts.length - 1];
          if (potentialMascot.length > 3) {
            details.mascot = potentialMascot;
          }
        }
      }
      
      // Logo
      const logoSelectors = [
        '.school-logo img', 'img[class*="logo"]', 'img[alt*="logo"]',
        '.team-logo img', 'img[src*="school"]'
      ];
      
      for (const selector of logoSelectors) {
        const $img = $(selector).first();
        if ($img.length) {
          let src = $img.attr('src') || $img.attr('data-src');
          if (src && !src.includes('placeholder') && !src.includes('default')) {
            if (!src.startsWith('http')) {
              src = new URL(src, this.baseUrl).href;
            }
            details.logoUrl = src;
            break;
          }
        }
      }
      
      // City
      const locationText = $('.location, .city, .school-location, [data-location]').text();
      if (locationText) {
        // Extract city from "City, State" format
        const cityMatch = locationText.match(/([A-Za-z\s]+),\s*ND/i);
        if (cityMatch) {
          details.city = cityMatch[1].trim();
        }
      }
      
      // Store in cache
      if (details.name) {
        cache.storeScrapedData('maxpreps', 'school', details, null, details.name);
      }
      
      return details;
    } catch (error) {
      console.error(`[MaxPreps] Error getting school details: ${error.message}`);
      return null;
    }
  }

  /**
   * Get North Dakota Class B schools
   * @returns {Array} - Array of school objects
   */
  async getNDClassBSchools() {
    try {
      // MaxPreps ND high schools page
      const urls = [
        `${this.baseUrl}/high-schools/basketball/nd/state.htm`,
        `${this.baseUrl}/state/north-dakota/basketball/`,
        `${this.baseUrl}/high-schools/nd/`,
      ];
      
      const schools = [];
      
      for (const url of urls) {
        try {
          const html = await this.fetchPage(url);
          const $ = this.parseHtml(html);
          
          $('a[href*="/high-schools/"], a[href*="/school/"]').each((i, el) => {
            const $el = $(el);
            const name = $el.text().trim();
            const href = $el.attr('href');
            
            // Filter for likely Class B schools (smaller schools)
            if (name && name.length > 2 && href) {
              schools.push({
                name,
                url: href.startsWith('http') ? href : `${this.baseUrl}${href}`,
                source: 'maxpreps'
              });
            }
          });
          
          if (schools.length > 0) {
            console.log(`[MaxPreps] Found ${schools.length} schools from ${url}`);
            break;
          }
        } catch (e) {
          continue;
        }
      }
      
      return schools;
    } catch (error) {
      console.error(`[MaxPreps] Error getting ND schools: ${error.message}`);
      return [];
    }
  }

  /**
   * Download logo for a school
   * @param {string} schoolName - Name of the school
   * @param {string} logoUrl - URL of the logo
   * @param {string} savePath - Path to save the logo
   * @returns {boolean} - Success status
   */
  async downloadLogo(schoolName, logoUrl, savePath) {
    if (!logoUrl) {
      console.log(`[MaxPreps] No logo URL for ${schoolName}`);
      return false;
    }
    
    return await this.downloadImage(logoUrl, savePath);
  }

  /**
   * Run scrape for schools and logos
   * @param {Array} schoolNames - List of school names to search
   * @param {string} logosDir - Directory to save logos
   * @returns {Object} - Scrape results
   */
  async scrapeSchools(schoolNames, logosDir) {
    console.log(`[MaxPreps] Scraping ${schoolNames.length} schools...`);
    
    const results = {
      found: [],
      notFound: [],
      logos: [],
      errors: []
    };
    
    try {
      for (const name of schoolNames) {
        try {
          const searchResult = await this.searchSchool(name);
          
          if (searchResult && searchResult.url) {
            const details = await this.getSchoolDetails(searchResult.url);
            
            if (details) {
              results.found.push(details);
              
              // Download logo if available
              if (details.logoUrl && logosDir) {
                const path = require('path');
                const ext = details.logoUrl.split('.').pop()?.split('?')[0] || 'png';
                const filename = `${this.slugify(details.name)}.${ext}`;
                const savePath = path.join(logosDir, filename);
                
                const downloaded = await this.downloadLogo(name, details.logoUrl, savePath);
                if (downloaded) {
                  results.logos.push({ name, path: savePath });
                }
              }
            } else {
              results.notFound.push(name);
            }
          } else {
            results.notFound.push(name);
          }
        } catch (error) {
          console.error(`[MaxPreps] Error processing ${name}: ${error.message}`);
          results.errors.push({ name, error: error.message });
        }
      }
    } finally {
      await this.close();
    }
    
    console.log(`[MaxPreps] Complete. Found: ${results.found.length}, Not found: ${results.notFound.length}, Logos: ${results.logos.length}`);
    
    return results;
  }
}

module.exports = MaxPrepsScraper;
