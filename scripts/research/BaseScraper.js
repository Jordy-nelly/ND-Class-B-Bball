/**
 * Base scraper class with rate limiting and caching
 * All scrapers extend this class for consistent behavior
 */

const { chromium } = require('playwright');
const cheerio = require('cheerio');
const cache = require('./cache');

class BaseScraper {
  constructor(options = {}) {
    this.name = options.name || 'BaseScraper';
    this.baseUrl = options.baseUrl || '';
    this.rateLimit = options.rateLimit || 2000; // ms between requests
    this.cacheTtl = options.cacheTtl || 24 * 60 * 60 * 1000; // 24 hours
    this.maxRetries = options.maxRetries || 3;
    this.lastRequestTime = 0;
    this.browser = null;
    this.context = null;
  }

  /**
   * Initialize browser instance
   */
  async init() {
    if (!this.browser) {
      console.log(`[${this.name}] Launching browser...`);
      this.browser = await chromium.launch({
        headless: true,
      });
      this.context = await this.browser.newContext({
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      });
    }
  }

  /**
   * Close browser instance
   */
  async close() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.context = null;
      console.log(`[${this.name}] Browser closed.`);
    }
  }

  /**
   * Wait to respect rate limits
   */
  async waitForRateLimit() {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    
    if (timeSinceLastRequest < this.rateLimit) {
      const waitTime = this.rateLimit - timeSinceLastRequest;
      console.log(`[${this.name}] Rate limiting: waiting ${waitTime}ms...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
    this.lastRequestTime = Date.now();
  }

  /**
   * Fetch a page with caching and rate limiting
   * @param {string} url - URL to fetch
   * @param {boolean} forceRefresh - Bypass cache
   * @returns {string} - HTML content
   */
  async fetchPage(url, forceRefresh = false) {
    // Check cache first
    if (!forceRefresh) {
      const cached = cache.getCached(url);
      if (cached) {
        console.log(`[${this.name}] Cache hit: ${url}`);
        return cached;
      }
    }

    await this.init();
    await this.waitForRateLimit();

    let lastError;
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        console.log(`[${this.name}] Fetching (attempt ${attempt}): ${url}`);
        
        const page = await this.context.newPage();
        
        try {
          await page.goto(url, {
            waitUntil: 'domcontentloaded', // Less strict than networkidle
            timeout: 30000,
          });
          
          // Wait a bit for any dynamic content
          await page.waitForTimeout(2000);
          
          const html = await page.content();
          
          // Cache the result
          cache.setCache(url, html, this.cacheTtl);
          
          return html;
        } finally {
          await page.close();
        }
      } catch (error) {
        lastError = error;
        console.error(`[${this.name}] Attempt ${attempt} failed: ${error.message}`);
        
        if (attempt < this.maxRetries) {
          // Exponential backoff
          const backoff = Math.pow(2, attempt) * 1000;
          console.log(`[${this.name}] Waiting ${backoff}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, backoff));
        }
      }
    }

    throw new Error(`Failed to fetch ${url} after ${this.maxRetries} attempts: ${lastError.message}`);
  }

  /**
   * Parse HTML into a Cheerio instance
   * @param {string} html - HTML string
   * @returns {CheerioAPI} - Cheerio instance
   */
  parseHtml(html) {
    return cheerio.load(html);
  }

  /**
   * Download an image and save it locally
   * @param {string} imageUrl - URL of the image
   * @param {string} savePath - Local path to save the image
   * @returns {boolean} - Success status
   */
  async downloadImage(imageUrl, savePath) {
    const fs = require('fs');
    const path = require('path');
    
    try {
      await this.init();
      await this.waitForRateLimit();
      
      const page = await this.context.newPage();
      
      try {
        const response = await page.goto(imageUrl, { timeout: 15000 });
        
        if (!response || !response.ok()) {
          console.log(`[${this.name}] Failed to download image: ${imageUrl}`);
          return false;
        }
        
        const buffer = await response.body();
        
        // Ensure directory exists
        const dir = path.dirname(savePath);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
        
        fs.writeFileSync(savePath, buffer);
        console.log(`[${this.name}] Downloaded: ${savePath}`);
        return true;
      } finally {
        await page.close();
      }
    } catch (error) {
      console.error(`[${this.name}] Image download failed: ${error.message}`);
      return false;
    }
  }

  /**
   * Normalize school name for consistent matching
   * @param {string} name - School name to normalize
   * @returns {string} - Normalized name
   */
  normalizeSchoolName(name) {
    if (!name) return '';
    return name
      .toLowerCase()
      .trim()
      .replace(/\s+/g, ' ')
      .replace(/['']/g, "'")
      .replace(/\s*\(.*?\)\s*/g, '') // Remove parenthetical content
      .replace(/\s*high\s*school\s*/gi, '')
      .replace(/\s*hs\s*/gi, '')
      .trim();
  }

  /**
   * Generate a slug from a school name for filenames
   * @param {string} name - School name
   * @returns {string} - URL-safe slug
   */
  slugify(name) {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
}

module.exports = BaseScraper;
