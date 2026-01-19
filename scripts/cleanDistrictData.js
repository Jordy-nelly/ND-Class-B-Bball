/**
 * Data Cleanup Script for ND Class B District Assignments
 * 
 * This script:
 * 1. Reads the Excel file with district assignments
 * 2. Identifies and logs all spelling/capitalization issues
 * 3. Can apply fixes to the Excel file with --apply flag
 * 
 * Run with: node scripts/cleanDistrictData.js
 * Apply fixes: node scripts/cleanDistrictData.js --apply
 */

const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const applyFixes = process.argv.includes('--apply');
const districtPath = path.join(__dirname, '..', 'District Assignments Over Time FINAL.xlsx');
const workbook = XLSX.readFile(districtPath);

// ============================================================
// SPELLING CORRECTIONS MAP
// Format: 'incorrect (lowercase)': 'Correct'
// ============================================================
const spellingCorrections = {
  // Lidgerwood variants
  'lindgerwood': 'Lidgerwood',
  'lingerwood': 'Lidgerwood',
  
  // Bottineau variants
  'bottinuea': 'Bottineau',
  'bobbineau': 'Bottineau',
  'boeauttin': 'Bottineau',
  
  // Bisbee variants
  'bisebee': 'Bisbee',
  'bisebee-egeland': 'Bisbee-Egeland',
  
  // Beulah variants
  'buelah': 'Beulah',
  'beulaheulah': 'Beulah',
  
  // Berthold variants
  'berhtold': 'Berthold',
  'berthod': 'Berthold',
  'berhold': 'Berthold',
  'berhold-carpio': 'Berthold-Carpio',
  
  // Binford variants
  'bindord': 'Binford',
  
  // Bowdon variants
  'bodwon': 'Bowdon',
  'bowdonw': 'Bowdon',
  'bowdown': 'Bowdon',
  'bowdown-hurdsfield/sykeston': 'Bowdon-Hurdsfield/Sykeston',
  
  // Buchanan variants
  'buchanana': 'Buchanan',
  
  // Carrington variants
  'carington': 'Carrington',
  'carringtring': 'Carrington',
  
  // Burke Central variants
  'burke centarl': 'Burke Central',
  'burke centra': 'Burke Central',
  'burke cout': 'Burke County',
  
  // Border Central variants
  'border cetnral': 'Border Central',
  
  // Other typos
  'mindway/minto': 'Midway/Minto',
  'chruchs ferry': 'Churchs Ferry',
  'churchs ferry': 'Churchs Ferry',
  'courteney': 'Courtenay',
  'divide coutn': 'Divide County',
  'discoll': 'Driscoll',
  'ashely': 'Ashley',
  'north sargetn': 'North Sargent',
  'argusvilleams/edinburg/milton-osnabrock': 'Argusville/Adams/Edinburg/Milton-Osnabrock',
};

// ============================================================
// CAPITALIZATION FIXES
// Exact matches for mid-word caps (like BEach)
// ============================================================
const capitalizationFixes = {
  'BAlfour': 'Balfour',
  'BEach': 'Beach',
  'BElfield': 'Belfield',
  'BEulah': 'Beulah',
  'CAndo': 'Cando',
  'CAthay': 'Cathay',
  'CAvalier': 'Cavalier',
  'DAkota': 'Dakota',
  'DESLacs': 'Des Lacs',
  'DRake': 'Drake',
  'DRayton': 'Drayton',
  'DRiscoll': 'Driscoll',
  // Garbled all-caps fixes
  'sURREY': 'Surrey',
  'gLENBURN': 'Glenburn',
  'kENMARE': 'Kenmare',
  // Multi-word fixes
  'willow city': 'Willow City',
};

// Collect all unique team names for analysis
const allTeamNames = new Set();
const issuesFound = [];
let fixesApplied = 0;

console.log('\n========================================');
console.log('ND Class B Data Cleanup Analysis');
console.log('========================================\n');

if (applyFixes) {
  console.log('*** APPLYING FIXES MODE ***\n');
}

// Process each sheet (district) in the workbook
workbook.SheetNames.forEach((sheetName, sheetIndex) => {
  const sheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
  
  // Skip if no data
  if (data.length < 2) return;
  
  const districtNum = sheetIndex + 1;
  
  // Process each row (year)
  for (let rowIndex = 1; rowIndex < data.length; rowIndex++) {
    const row = data[rowIndex];
    if (!row || !row[0]) continue;
    
    const year = row[0];
    
    // Process each team in the row
    for (let colIndex = 1; colIndex < row.length; colIndex++) {
      const teamName = row[colIndex];
      if (!teamName || teamName === '?') continue;
      
      const trimmed = String(teamName).trim();
      if (!trimmed) continue;
      
      allTeamNames.add(trimmed);
      
      let correctedName = trimmed;
      let issueType = null;
      
      // Check spelling corrections (case-insensitive)
      const lowerName = trimmed.toLowerCase();
      if (spellingCorrections[lowerName]) {
        correctedName = spellingCorrections[lowerName];
        issueType = 'spelling';
      }
      
      // Check exact capitalization fixes
      if (capitalizationFixes[trimmed]) {
        correctedName = capitalizationFixes[trimmed];
        issueType = 'capitalization';
      }
      
      // Check for lowercase first letter
      if (!issueType && trimmed.length > 0 && 
          trimmed[0] === trimmed[0].toLowerCase() && 
          trimmed[0] !== trimmed[0].toUpperCase()) {
        correctedName = trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
        issueType = 'lowercase_start';
      }
      
      // Check for double uppercase at start (like BEach pattern not in our list)
      if (!issueType && trimmed.length > 2 &&
          trimmed[0] === trimmed[0].toUpperCase() &&
          trimmed[1] === trimmed[1].toUpperCase() &&
          trimmed[2] === trimmed[2].toLowerCase() &&
          !/^[A-Z]{2,}/.test(trimmed.slice(0, 3))) {
        // Skip known acronyms like "PBK" or legitimate names
        const potentialFix = trimmed[0] + trimmed.slice(1, 2).toLowerCase() + trimmed.slice(2);
        correctedName = potentialFix;
        issueType = 'double_caps';
      }
      
      if (issueType && correctedName !== trimmed) {
        issuesFound.push({
          type: issueType,
          district: districtNum,
          year,
          original: trimmed,
          corrected: correctedName
        });
        
        if (applyFixes) {
          // Get the cell address
          const cellAddress = XLSX.utils.encode_cell({ r: rowIndex, c: colIndex });
          if (sheet[cellAddress]) {
            sheet[cellAddress].v = correctedName;
            fixesApplied++;
          }
        }
      }
    }
  }
});

// Report findings
console.log(`Total unique team names found: ${allTeamNames.size}\n`);

// Group issues by correction type
const issuesByType = {};
issuesFound.forEach(issue => {
  if (!issuesByType[issue.type]) {
    issuesByType[issue.type] = [];
  }
  issuesByType[issue.type].push(issue);
});

console.log('Issues Found by Type:');
console.log('---------------------');

Object.keys(issuesByType).forEach(type => {
  console.log(`\n${type.toUpperCase()}: ${issuesByType[type].length} issues`);
  
  // Show unique corrections
  const uniqueCorrections = {};
  issuesByType[type].forEach(issue => {
    const key = `${issue.original} -> ${issue.corrected}`;
    if (!uniqueCorrections[key]) {
      uniqueCorrections[key] = { count: 0, districts: new Set() };
    }
    uniqueCorrections[key].count++;
    uniqueCorrections[key].districts.add(issue.district);
  });
  
  Object.keys(uniqueCorrections).forEach(key => {
    const info = uniqueCorrections[key];
    console.log(`  ${key} (${info.count}x in D${[...info.districts].join(', D')})`);
  });
});

// Save the corrected workbook if applying fixes
if (applyFixes && fixesApplied > 0) {
  const backupPath = districtPath.replace('.xlsx', '_backup.xlsx');
  
  // Create backup first
  fs.copyFileSync(districtPath, backupPath);
  console.log(`\nBackup saved to: ${path.basename(backupPath)}`);
  
  // Write corrected file
  XLSX.writeFile(workbook, districtPath);
  console.log(`Applied ${fixesApplied} fixes to: ${path.basename(districtPath)}`);
}

// Write report to JSON file
const reportPath = path.join(__dirname, '..', 'data-cleanup-report.json');
const report = {
  generatedAt: new Date().toISOString(),
  mode: applyFixes ? 'APPLIED' : 'ANALYSIS',
  totalUniqueTeams: allTeamNames.size,
  totalIssuesFound: issuesFound.length,
  fixesApplied: fixesApplied,
  issuesByType: Object.keys(issuesByType).map(type => ({
    type,
    count: issuesByType[type].length,
    corrections: [...new Set(issuesByType[type].map(i => ({ from: i.original, to: i.corrected })))]
  })),
  allCorrections: {
    spelling: spellingCorrections,
    capitalization: capitalizationFixes
  },
  allTeamNames: [...allTeamNames].sort()
};

fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
console.log(`\nReport saved to: data-cleanup-report.json`);

// Summary
console.log('\n========================================');
console.log('SUMMARY');
console.log('========================================');
console.log(`Total unique team names: ${allTeamNames.size}`);
console.log(`Total issues found: ${issuesFound.length}`);
if (applyFixes) {
  console.log(`Fixes applied: ${fixesApplied}`);
} else {
  console.log('\nTo apply fixes, run: node scripts/cleanDistrictData.js --apply');
}
