/**
 * Research Agent CLI
 * Main entry point for running the research agent
 */

const NDHSAAScraper = require('./NDHSAAScraper');
const MaxPrepsScraper = require('./MaxPrepsScraper');
const LogoScraper = require('./LogoScraper');
const CoopScraper = require('./CoopScraper');
const ValidationEngine = require('./ValidationEngine');
const cache = require('./cache');
const path = require('path');
const fs = require('fs');

class ResearchAgent {
  constructor() {
    this.ndhsaaScraper = new NDHSAAScraper();
    this.maxprepsScraper = new MaxPrepsScraper();
    this.logoScraper = new LogoScraper();
    this.coopScraper = new CoopScraper();
    this.validator = new ValidationEngine();
  }

  /**
   * Run full research pipeline
   * @param {Object} options - Run options
   */
  async run(options = {}) {
    const {
      scrapeNdhsaa = true,
      scrapeMaxpreps = true,
      downloadLogos = true,
      validate = true,
      startYear = 2014,
      endYear = new Date().getFullYear(),
      logoLimit = 50, // Limit logos to download per run
    } = options;

    console.log('='.repeat(60));
    console.log('ND Class B Research Agent');
    console.log('='.repeat(60));
    console.log(`Start Year: ${startYear}`);
    console.log(`End Year: ${endYear}`);
    console.log(`Options: NDHSAA=${scrapeNdhsaa}, MaxPreps=${scrapeMaxpreps}, Logos=${downloadLogos}`);
    console.log('='.repeat(60));

    const results = {
      startedAt: new Date().toISOString(),
      ndhsaa: null,
      maxpreps: null,
      logos: null,
      validation: null,
      errors: []
    };

    try {
      // 1. Scrape NDHSAA
      if (scrapeNdhsaa) {
        console.log('\n📋 Scraping NDHSAA...');
        try {
          results.ndhsaa = await this.ndhsaaScraper.scrapeAll(startYear, endYear);
        } catch (error) {
          console.error('NDHSAA scrape failed:', error.message);
          results.errors.push({ source: 'ndhsaa', error: error.message });
        }
      }

      // 2. Scrape MaxPreps
      if (scrapeMaxpreps) {
        console.log('\n🏀 Scraping MaxPreps...');
        try {
          // Get unique schools from existing data
          const existingData = this.validator.loadExistingData();
          const schoolNames = Object.keys(existingData.schools).slice(0, 100); // Limit for testing
          
          const logosDir = path.join(__dirname, '..', '..', 'public', 'logos');
          results.maxpreps = await this.maxprepsScraper.scrapeSchools(schoolNames, logosDir);
        } catch (error) {
          console.error('MaxPreps scrape failed:', error.message);
          results.errors.push({ source: 'maxpreps', error: error.message });
        }
      }

      // 3. Download Logos
      if (downloadLogos) {
        console.log('\n🎨 Downloading logos...');
        try {
          const existingData = this.validator.loadExistingData();
          const schools = Object.entries(existingData.schools)
            .map(([key, data]) => ({
              name: key,
              mascot: data.mascot,
              city: data.city
            }))
            .slice(0, logoLimit);
          
          const missing = this.logoScraper.getSchoolsWithoutLogos(schools);
          console.log(`Found ${missing.length} schools without logos`);
          
          if (missing.length > 0) {
            results.logos = await this.logoScraper.batchDownloadLogos(missing.slice(0, logoLimit));
          } else {
            results.logos = { downloaded: [], existing: schools.length, failed: [] };
          }
        } catch (error) {
          console.error('Logo download failed:', error.message);
          results.errors.push({ source: 'logos', error: error.message });
        }
      }

      // 4. Validate
      if (validate) {
        console.log('\n✅ Validating data...');
        try {
          const schoolResults = [];
          const districtResults = [];

          // Validate NDHSAA school data
          if (results.ndhsaa?.schools) {
            for (const school of results.ndhsaa.schools.slice(0, 50)) {
              schoolResults.push(this.validator.validateSchool(school));
            }
          }

          // Validate MaxPreps school data
          if (results.maxpreps?.found) {
            for (const school of results.maxpreps.found) {
              schoolResults.push(this.validator.validateSchool(school));
            }
          }

          // Validate district data
          if (results.ndhsaa?.districts) {
            for (const [year, districts] of Object.entries(results.ndhsaa.districts)) {
              districtResults.push(this.validator.validateDistricts(parseInt(year), districts));
            }
          }

          // Generate report
          results.validation = this.validator.generateReport(schoolResults, districtResults);
          const reportPaths = this.validator.saveReport(results.validation);
          results.reportPaths = reportPaths;

        } catch (error) {
          console.error('Validation failed:', error.message);
          results.errors.push({ source: 'validation', error: error.message });
        }
      }

    } finally {
      // Cleanup
      await this.ndhsaaScraper.close();
      await this.maxprepsScraper.close();
      await this.logoScraper.close();
    }

    results.completedAt = new Date().toISOString();
    
    // Print summary
    this.printSummary(results);

    return results;
  }

  /**
   * Print summary of results
   * @param {Object} results - Run results
   */
  printSummary(results) {
    console.log('\n' + '='.repeat(60));
    console.log('RESEARCH AGENT SUMMARY');
    console.log('='.repeat(60));
    
    if (results.ndhsaa) {
      console.log(`\n📋 NDHSAA:`);
      console.log(`   Schools found: ${results.ndhsaa.schools?.length || 0}`);
      console.log(`   Years with district data: ${Object.keys(results.ndhsaa.districts || {}).length}`);
    }
    
    if (results.maxpreps) {
      console.log(`\n🏀 MaxPreps:`);
      console.log(`   Schools found: ${results.maxpreps.found?.length || 0}`);
      console.log(`   Schools not found: ${results.maxpreps.notFound?.length || 0}`);
      console.log(`   Logos downloaded: ${results.maxpreps.logos?.length || 0}`);
    }
    
    if (results.logos) {
      console.log(`\n🎨 Logos:`);
      console.log(`   Downloaded: ${results.logos.downloaded?.length || 0}`);
      console.log(`   Already existed: ${results.logos.existing?.length || 0}`);
      console.log(`   Failed: ${results.logos.failed?.length || 0}`);
    }
    
    if (results.validation) {
      console.log(`\n✅ Validation:`);
      console.log(`   Schools validated: ${results.validation.summary.schoolsValidated}`);
      console.log(`   New schools found: ${results.validation.summary.newSchools}`);
      console.log(`   Discrepancies: ${results.validation.summary.schoolsWithDiscrepancies}`);
    }
    
    if (results.errors.length > 0) {
      console.log(`\n❌ Errors: ${results.errors.length}`);
      for (const err of results.errors) {
        console.log(`   - ${err.source}: ${err.error}`);
      }
    }
    
    if (results.reportPaths) {
      console.log(`\n📄 Reports saved:`);
      console.log(`   JSON: ${results.reportPaths.json}`);
      console.log(`   Markdown: ${results.reportPaths.markdown}`);
    }
    
    console.log('\n' + '='.repeat(60));
  }

  /**
   * Quick test scrape (for development)
   */
  async quickTest() {
    console.log('Running quick test...');
    
    try {
      // Test NDHSAA
      console.log('\nTesting NDHSAA scraper...');
      const ndhsaaSchools = await this.ndhsaaScraper.getSchoolList();
      console.log(`Found ${ndhsaaSchools.length} schools`);
      
      // Test MaxPreps
      console.log('\nTesting MaxPreps scraper...');
      const testSchool = await this.maxprepsScraper.searchSchool('Minot');
      console.log('MaxPreps search result:', testSchool);
      
      // Test cache stats
      console.log('\nCache stats:', cache.getStats());
      
    } finally {
      await this.ndhsaaScraper.close();
      await this.maxprepsScraper.close();
    }
  }

  /**
   * Run co-op scraping and validation
   * @param {Object} options - Run options
   */
  async runCoopScrape(options = {}) {
    const {
      startYear = 2013,
      endYear = new Date().getFullYear(),
      validateCoops = true
    } = options;

    console.log('='.repeat(60));
    console.log('ND Class B Co-op Scraper');
    console.log('='.repeat(60));

    const results = {
      startedAt: new Date().toISOString(),
      scrape: null,
      validation: null,
      errors: []
    };

    try {
      // 1. Scrape co-ops
      console.log('\n🏀 Scraping basketball co-ops...');
      results.scrape = await this.coopScraper.scrapeAllCoops({
        startYear,
        endYear
      });

      // 2. Validate against CSV
      if (validateCoops && results.scrape?.allCoops) {
        console.log('\n✅ Validating co-ops against CSV data...');
        const validation = this.validator.validateCoops(results.scrape.allCoops);
        const report = this.validator.generateCoopReport(validation);
        const reportPaths = this.validator.saveCoopReport(report);
        results.validation = { ...report, paths: reportPaths };
      }

    } catch (error) {
      console.error('Co-op scrape failed:', error.message);
      results.errors.push({ source: 'coop-scrape', error: error.message });
    }

    results.completedAt = new Date().toISOString();

    // Print summary
    console.log('\n' + '='.repeat(60));
    console.log('CO-OP SCRAPE SUMMARY');
    console.log('='.repeat(60));
    
    if (results.scrape) {
      console.log(`\n🏀 Scrape Results:`);
      console.log(`   Total teams scraped: ${results.scrape.summary.totalTeamsScraped}`);
      console.log(`   Unique co-ops found: ${results.scrape.summary.uniqueCoops}`);
    }

    if (results.validation) {
      console.log(`\n✅ Validation Results:`);
      console.log(`   Matched: ${results.validation.summary.matched}`);
      console.log(`   New co-ops: ${results.validation.summary.newCoops}`);
      console.log(`   Membership changes: ${results.validation.summary.membershipChanges}`);
      console.log(`   Dissolved: ${results.validation.summary.dissolved}`);
    }

    if (results.errors.length > 0) {
      console.log(`\n❌ Errors: ${results.errors.length}`);
      for (const err of results.errors) {
        console.log(`   - ${err.source}: ${err.error}`);
      }
    }

    console.log('\n' + '='.repeat(60));

    return results;
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  const agent = new ResearchAgent();

  if (args.includes('--test')) {
    await agent.quickTest();
  } else if (args.includes('--coops-only')) {
    // Basketball co-op scraping
    const startYear = parseInt(args.find(a => a.startsWith('--start='))?.split('=')[1]) || 2013;
    const endYear = parseInt(args.find(a => a.startsWith('--end='))?.split('=')[1]) || new Date().getFullYear();
    const skipValidation = args.includes('--skip-validation');
    
    await agent.runCoopScrape({
      startYear,
      endYear,
      validateCoops: !skipValidation
    });
  } else if (args.includes('--logos-only')) {
    await agent.run({
      scrapeNdhsaa: false,
      scrapeMaxpreps: false,
      downloadLogos: true,
      validate: false,
      logoLimit: parseInt(args.find(a => a.startsWith('--limit='))?.split('=')[1]) || 20
    });
  } else if (args.includes('--validate-only')) {
    await agent.run({
      scrapeNdhsaa: false,
      scrapeMaxpreps: false,
      downloadLogos: false,
      validate: true
    });
  } else if (args.includes('--help')) {
    console.log(`
ND Class B Research Agent

Usage: node scripts/research/index.js [options]

Options:
  --test             Run quick connectivity test
  --coops-only       Scrape basketball co-ops (2013+) and validate
  --logos-only       Only download logos
  --validate-only    Only run validation against existing data
  --skip-validation  Skip validation step (use with --coops-only)
  --start=YEAR       Start year for co-op scraping (default: 2013)
  --end=YEAR         End year for co-op scraping (default: current)
  --limit=N          Limit number of items to process (default: 50)
  --help             Show this help message

Examples:
  npm run research:coops                    # Scrape co-ops 2013-present
  npm run research:coops -- --start=2020    # Scrape co-ops 2020-present
  npm run research:coops -- --skip-validation  # Scrape without validation

Full run (default):
  Scrapes NDHSAA, MaxPreps, downloads logos, and validates data
`);
  } else {
    // Full run
    await agent.run({
      scrapeNdhsaa: true,
      scrapeMaxpreps: true,
      downloadLogos: true,
      validate: true,
      logoLimit: parseInt(args.find(a => a.startsWith('--limit='))?.split('=')[1]) || 50
    });
  }
}

// Export for API use
module.exports = ResearchAgent;

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}
