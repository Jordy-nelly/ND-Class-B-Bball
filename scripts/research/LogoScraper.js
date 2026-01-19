/**
 * Logo Scraper
 * Searches multiple sources for school mascot logos and downloads them
 */

const BaseScraper = require('./BaseScraper');
const cache = require('./cache');
const path = require('path');
const fs = require('fs');

class LogoScraper extends BaseScraper {
  constructor() {
    super({
      name: 'LogoScraper',
      rateLimit: 2000,
      cacheTtl: 30 * 24 * 60 * 60 * 1000, // 30 days cache for images
    });
    
    this.logosDir = path.join(__dirname, '..', '..', 'public', 'logos');
    
    // Ensure logos directory exists
    if (!fs.existsSync(this.logosDir)) {
      fs.mkdirSync(this.logosDir, { recursive: true });
    }
  }

  /**
   * Search Google Images for school logo (using search page scraping)
   * @param {string} schoolName - School name
   * @param {string} mascot - Mascot name
   * @returns {string|null} - Logo URL or null
   */
  async searchGoogleImages(schoolName, mascot) {
    try {
      const searchQuery = `${schoolName} ${mascot} high school logo north dakota`;
      const url = `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}&tbm=isch`;
      
      const html = await this.fetchPage(url);
      const $ = this.parseHtml(html);
      
      // Look for image URLs in the page
      const imageUrls = [];
      
      // Try different patterns for Google Images
      $('img').each((i, el) => {
        const src = $(el).attr('src') || $(el).attr('data-src');
        if (src && !src.includes('google') && !src.startsWith('data:')) {
          imageUrls.push(src);
        }
      });
      
      // Return first non-Google image
      return imageUrls[0] || null;
    } catch (error) {
      console.log(`[LogoScraper] Google search failed: ${error.message}`);
      return null;
    }
  }

  /**
   * Search SportsLogos.net for team logo
   * @param {string} schoolName - School name
   * @returns {string|null} - Logo URL or null
   */
  async searchSportsLogos(schoolName) {
    try {
      const searchUrl = `https://www.sportslogos.net/search/high+school/${encodeURIComponent(schoolName)}`;
      const html = await this.fetchPage(searchUrl);
      const $ = this.parseHtml(html);
      
      // Look for logo images
      const $logoImg = $('img[src*="logo"], .logo img, .team-logo img').first();
      if ($logoImg.length) {
        let src = $logoImg.attr('src');
        if (src && !src.startsWith('http')) {
          src = new URL(src, 'https://www.sportslogos.net').href;
        }
        return src;
      }
      
      return null;
    } catch (error) {
      console.log(`[LogoScraper] SportsLogos search failed: ${error.message}`);
      return null;
    }
  }

  /**
   * Search DuckDuckGo for school logo
   * @param {string} schoolName - School name
   * @param {string} mascot - Mascot name  
   * @returns {string|null} - Logo URL or null
   */
  async searchDuckDuckGo(schoolName, mascot) {
    try {
      const searchQuery = `${schoolName} ${mascot} logo north dakota`;
      const url = `https://duckduckgo.com/?q=${encodeURIComponent(searchQuery)}&iax=images&ia=images`;
      
      const html = await this.fetchPage(url);
      const $ = this.parseHtml(html);
      
      // Look for image results
      const $img = $('img.tile--img__img, img[class*="result"], .tile--img img').first();
      if ($img.length) {
        const src = $img.attr('src') || $img.attr('data-src');
        return src || null;
      }
      
      return null;
    } catch (error) {
      console.log(`[LogoScraper] DuckDuckGo search failed: ${error.message}`);
      return null;
    }
  }

  /**
   * Try to find logo from school's website directly
   * @param {string} schoolName - School name
   * @param {string} city - City name
   * @returns {string|null} - Logo URL or null
   */
  async searchSchoolWebsite(schoolName, city) {
    try {
      // Common school website patterns
      const normalizedName = schoolName.toLowerCase().replace(/[^a-z0-9]/g, '');
      const normalizedCity = city?.toLowerCase().replace(/[^a-z0-9]/g, '') || normalizedName;
      
      const potentialDomains = [
        `https://www.${normalizedCity}.k12.nd.us`,
        `https://${normalizedCity}.k12.nd.us`,
        `https://www.${normalizedName}.k12.nd.us`,
      ];
      
      for (const domain of potentialDomains) {
        try {
          const html = await this.fetchPage(domain);
          const $ = this.parseHtml(html);
          
          // Look for logo in common locations
          const logoSelectors = [
            '.logo img', '#logo img', 'header img', '.school-logo img',
            'img[alt*="logo"]', 'img[class*="logo"]'
          ];
          
          for (const selector of logoSelectors) {
            const $img = $(selector).first();
            if ($img.length) {
              let src = $img.attr('src');
              if (src) {
                if (!src.startsWith('http')) {
                  src = new URL(src, domain).href;
                }
                return src;
              }
            }
          }
        } catch (e) {
          continue;
        }
      }
      
      return null;
    } catch (error) {
      console.log(`[LogoScraper] School website search failed: ${error.message}`);
      return null;
    }
  }

  /**
   * Find and download logo for a school
   * @param {Object} school - School object with name, mascot, city
   * @returns {Object} - Result with success status and path
   */
  async findAndDownloadLogo(school) {
    const { name, mascot, city } = school;
    const slug = this.slugify(name);
    
    // Check if logo already exists
    const existingFormats = ['png', 'jpg', 'jpeg', 'svg', 'webp'];
    for (const ext of existingFormats) {
      const existingPath = path.join(this.logosDir, `${slug}.${ext}`);
      if (fs.existsSync(existingPath)) {
        console.log(`[LogoScraper] Logo already exists: ${existingPath}`);
        return { success: true, path: existingPath, source: 'existing' };
      }
    }
    
    console.log(`[LogoScraper] Searching for logo: ${name} (${mascot})`);
    
    // Try different sources
    let logoUrl = null;
    let source = null;
    
    // 1. Try school website first (most authoritative)
    logoUrl = await this.searchSchoolWebsite(name, city);
    if (logoUrl) {
      source = 'school-website';
    }
    
    // 2. Try MaxPreps (already handled in MaxPrepsScraper, skip here)
    
    // 3. Try image search as fallback
    if (!logoUrl) {
      logoUrl = await this.searchDuckDuckGo(name, mascot);
      if (logoUrl) {
        source = 'duckduckgo';
      }
    }
    
    // Download if found
    if (logoUrl) {
      try {
        const ext = this.getExtensionFromUrl(logoUrl);
        const savePath = path.join(this.logosDir, `${slug}.${ext}`);
        
        const success = await this.downloadImage(logoUrl, savePath);
        
        if (success) {
          return { success: true, path: savePath, source, url: logoUrl };
        }
      } catch (error) {
        console.error(`[LogoScraper] Download failed for ${name}: ${error.message}`);
      }
    }
    
    return { success: false, name, reason: 'Logo not found' };
  }

  /**
   * Get file extension from URL
   * @param {string} url - Image URL
   * @returns {string} - File extension
   */
  getExtensionFromUrl(url) {
    try {
      const pathname = new URL(url).pathname;
      const ext = path.extname(pathname).slice(1).toLowerCase();
      if (['png', 'jpg', 'jpeg', 'svg', 'webp', 'gif'].includes(ext)) {
        return ext;
      }
    } catch (e) {}
    return 'png'; // default
  }

  /**
   * Batch download logos for multiple schools
   * @param {Array} schools - Array of school objects
   * @returns {Object} - Results summary
   */
  async batchDownloadLogos(schools) {
    console.log(`[LogoScraper] Starting batch download for ${schools.length} schools`);
    
    const results = {
      downloaded: [],
      existing: [],
      failed: [],
      total: schools.length
    };
    
    try {
      for (const school of schools) {
        const result = await this.findAndDownloadLogo(school);
        
        if (result.success) {
          if (result.source === 'existing') {
            results.existing.push({ name: school.name, path: result.path });
          } else {
            results.downloaded.push({ 
              name: school.name, 
              path: result.path, 
              source: result.source 
            });
          }
        } else {
          results.failed.push({ name: school.name, reason: result.reason });
        }
      }
    } finally {
      await this.close();
    }
    
    console.log(`[LogoScraper] Batch complete:`);
    console.log(`  - Downloaded: ${results.downloaded.length}`);
    console.log(`  - Existing: ${results.existing.length}`);
    console.log(`  - Failed: ${results.failed.length}`);
    
    return results;
  }

  /**
   * Get list of schools without logos
   * @param {Array} schools - All schools
   * @returns {Array} - Schools missing logos
   */
  getSchoolsWithoutLogos(schools) {
    return schools.filter(school => {
      const slug = this.slugify(school.name);
      const formats = ['png', 'jpg', 'jpeg', 'svg', 'webp'];
      
      for (const ext of formats) {
        if (fs.existsSync(path.join(this.logosDir, `${slug}.${ext}`))) {
          return false;
        }
      }
      return true;
    });
  }
}

module.exports = LogoScraper;
