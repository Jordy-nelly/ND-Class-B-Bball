/**
 * SQLite cache for scraped web pages
 * Caches HTML responses to avoid re-scraping and respect rate limits
 */

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

// Ensure cache directory exists
const cacheDir = path.join(__dirname, '..', '..', '.cache');
if (!fs.existsSync(cacheDir)) {
  fs.mkdirSync(cacheDir, { recursive: true });
}

const dbPath = path.join(cacheDir, 'scraper-cache.db');
const db = new Database(dbPath);

// Initialize database schema
db.exec(`
  CREATE TABLE IF NOT EXISTS page_cache (
    url_hash TEXT PRIMARY KEY,
    url TEXT NOT NULL,
    html TEXT NOT NULL,
    scraped_at INTEGER NOT NULL,
    expires_at INTEGER NOT NULL
  );
  
  CREATE INDEX IF NOT EXISTS idx_expires ON page_cache(expires_at);
  
  CREATE TABLE IF NOT EXISTS scraped_data (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    source TEXT NOT NULL,
    data_type TEXT NOT NULL,
    data TEXT NOT NULL,
    scraped_at INTEGER NOT NULL,
    year INTEGER,
    school TEXT
  );
  
  CREATE INDEX IF NOT EXISTS idx_source_type ON scraped_data(source, data_type);
  CREATE INDEX IF NOT EXISTS idx_year ON scraped_data(year);
`);

/**
 * Generate a hash for a URL to use as cache key
 */
function hashUrl(url) {
  return crypto.createHash('sha256').update(url).digest('hex').slice(0, 32);
}

/**
 * Get cached HTML for a URL if it exists and hasn't expired
 * @param {string} url - The URL to look up
 * @returns {string|null} - Cached HTML or null if not found/expired
 */
function getCached(url) {
  const hash = hashUrl(url);
  const now = Date.now();
  
  const stmt = db.prepare(`
    SELECT html FROM page_cache 
    WHERE url_hash = ? AND expires_at > ?
  `);
  
  const row = stmt.get(hash, now);
  return row ? row.html : null;
}

/**
 * Store HTML in cache
 * @param {string} url - The URL being cached
 * @param {string} html - The HTML content
 * @param {number} ttlMs - Time to live in milliseconds (default 24 hours)
 */
function setCache(url, html, ttlMs = 24 * 60 * 60 * 1000) {
  const hash = hashUrl(url);
  const now = Date.now();
  const expiresAt = now + ttlMs;
  
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO page_cache (url_hash, url, html, scraped_at, expires_at)
    VALUES (?, ?, ?, ?, ?)
  `);
  
  stmt.run(hash, url, html, now, expiresAt);
}

/**
 * Store scraped data for later validation
 * @param {string} source - Source identifier (e.g., 'ndhsaa', 'maxpreps')
 * @param {string} dataType - Type of data (e.g., 'district', 'school', 'mascot')
 * @param {object} data - The scraped data object
 * @param {number} year - Optional year the data pertains to
 * @param {string} school - Optional school name
 */
function storeScrapedData(source, dataType, data, year = null, school = null) {
  const stmt = db.prepare(`
    INSERT INTO scraped_data (source, data_type, data, scraped_at, year, school)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  
  stmt.run(source, dataType, JSON.stringify(data), Date.now(), year, school);
}

/**
 * Get all scraped data by type and source
 * @param {string} source - Source identifier
 * @param {string} dataType - Type of data
 * @returns {Array} - Array of scraped data objects
 */
function getScrapedData(source, dataType) {
  const stmt = db.prepare(`
    SELECT * FROM scraped_data 
    WHERE source = ? AND data_type = ?
    ORDER BY scraped_at DESC
  `);
  
  return stmt.all(source, dataType).map(row => ({
    ...row,
    data: JSON.parse(row.data)
  }));
}

/**
 * Clear expired cache entries
 */
function clearExpired() {
  const stmt = db.prepare(`DELETE FROM page_cache WHERE expires_at < ?`);
  const result = stmt.run(Date.now());
  return result.changes;
}

/**
 * Clear all cache (for testing/reset)
 */
function clearAll() {
  db.exec(`DELETE FROM page_cache`);
  db.exec(`DELETE FROM scraped_data`);
}

/**
 * Get cache statistics
 */
function getStats() {
  const cacheCount = db.prepare(`SELECT COUNT(*) as count FROM page_cache`).get();
  const dataCount = db.prepare(`SELECT COUNT(*) as count FROM scraped_data`).get();
  const expiredCount = db.prepare(`SELECT COUNT(*) as count FROM page_cache WHERE expires_at < ?`).get(Date.now());
  
  return {
    cachedPages: cacheCount.count,
    scrapedDataEntries: dataCount.count,
    expiredEntries: expiredCount.count
  };
}

module.exports = {
  getCached,
  setCache,
  storeScrapedData,
  getScrapedData,
  clearExpired,
  clearAll,
  getStats,
  db // Export for advanced queries
};
