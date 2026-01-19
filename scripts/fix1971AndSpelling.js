/**
 * Script to:
 * 1. Fill in 1971 data for District 1 (only safe district to copy)
 * 2. Fix spelling errors across the data file
 * 
 * Run with: node scripts/fix1971AndSpelling.js
 */

const fs = require('fs');
const path = require('path');

const dataFilePath = path.join(__dirname, '../app/data/allDistricts.ts');

let content = fs.readFileSync(dataFilePath, 'utf-8');

// SPELLING CORRECTIONS
const spellingFixes = [
  { wrong: '"Enderline"', correct: '"Enderlin"' },
  { wrong: '"Monago"', correct: '"Monango"' },
  { wrong: '"Chruchs Ferry"', correct: '"Churchs Ferry"' },
  { wrong: '"New England?Regent"', correct: '"New England/Regent"' },
  { wrong: '"Dickey Central (Monago)"', correct: '"Dickey Central (Monango)"' },
  { wrong: '"Lindgerwood"', correct: '"Lidgerwood"' },
  { wrong: '"HOpe"', correct: '"Hope"' },
  { wrong: '"Emore"', correct: '"Edmore"' },
  { wrong: '"Munihc"', correct: '"Munich"' },
  { wrong: '"MIdway"', correct: '"Midway"' },
  { wrong: '"Pilsbury"', correct: '"Pillsbury"' },
  { wrong: '"New Enland"', correct: '"New England"' },
  { wrong: '"New Engladn/Regent"', correct: '"New England/Regent"' },
  { wrong: '"CAthay"', correct: '"Cathay"' },
  { wrong: '"Sheynne"', correct: '"Sheyenne"' },
  { wrong: '"Bowdown"', correct: '"Bowdon"' },
  { wrong: '"FEssenden"', correct: '"Fessenden"' },
  { wrong: '"Courteney"', correct: '"Courtenay"' },
  { wrong: '"Tinity Christian"', correct: '"Trinity Christian"' },
  { wrong: '"Meinda"', correct: '"Medina"' },
  { wrong: '"GAckle"', correct: '"Gackle"' },
  { wrong: '"Buchanana"', correct: '"Buchanan"' },
  { wrong: '"BAlfour"', correct: '"Balfour"' },
  { wrong: '"DRake"', correct: '"Drake"' },
  { wrong: '"DESLacs"', correct: '"Des Lacs"' },
  { wrong: '"SAwyer"', correct: '"Sawyer"' },
  { wrong: '"Palmero"', correct: '"Palermo"' },
  { wrong: '"Willow Wity"', correct: '"Willow City"' },
  { wrong: '"Makota"', correct: '"Makoti"' },
  { wrong: '"Montepelier"', correct: '"Montpelier"' },
  { wrong: '"GRandin"', correct: '"Grandin"' },
  { wrong: '"North Sargetn"', correct: '"North Sargent"' },
  { wrong: '"Beulaheulah"', correct: '"Beulah"' },
];

console.log('Applying spelling fixes...');
let fixCount = 0;
for (const fix of spellingFixes) {
  const regex = new RegExp(fix.wrong.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
  const matches = content.match(regex);
  if (matches) {
    fixCount += matches.length;
    console.log(`  Fixed: ${fix.wrong} -> ${fix.correct} (${matches.length} occurrences)`);
    content = content.replace(regex, fix.correct);
  }
}
console.log(`Total spelling fixes: ${fixCount}\n`);

// FILL IN DISTRICT 1 FOR 1971 (only safe one to copy)
const old1971 = `"1971": {
      "teams": [
        "?"
      ]
    }`;
const new1971 = `"1971": {
      "teams": [
        "Fairmount",
        "Forman Sargent Central",
        "Gwinner North Sargent",
        "Hankinson",
        "Lidgerwood",
        "Milnor",
        "Wyndmere"
      ]
    }`;

const d1Start = content.indexOf('"1": {');
const d2Start = content.indexOf('"2": {');
if (d1Start !== -1 && d2Start !== -1) {
  const d1Section = content.substring(d1Start, d2Start);
  if (d1Section.includes('"?"')) {
    content = content.substring(0, d1Start) + d1Section.replace(old1971, new1971) + content.substring(d2Start);
    console.log('Filled in 1971 data for District 1 (copied from 1970/1972)');
  } else {
    console.log('District 1 already has 1971 data');
  }
}

fs.writeFileSync(dataFilePath, content, 'utf-8');
console.log('\nFile updated successfully!');

console.log(`
============================================
DISTRICTS NEEDING MANUAL 1971 RESEARCH:
============================================

A statewide re-districting occurred between 1970-1972.
Most districts cannot be inferred from adjacent years.

SAFE (already fixed):
  - District 1: Copied from 1970/1972 (identical)

NEED HISTORICAL RESEARCH (completely different rosters):
  - District 11: Edmore, Langdon -> Alsen, Calvin, Egeland
  - District 12: Alsen, Calvin -> Belcourt, Bisbee, Cando
  - District 13: Bisbee, Cando -> Binford, Glenfield
  - District 14: Belcourt, Dunseith -> Devils Lake area
  - District 20: Ashley, Linton -> Buchanan, Pingree
  - District 21: Anamoose, Velva -> Garrison, Washburn
  - District 22: Berthold, Carpio -> Anamoose, Balfour
  - District 24: Bowbells, Kenmare -> New Town, Parshall
  - District 25: Alamo, Alexander -> Antler, Westhope

SIGNIFICANT CHANGES (partial research needed):
  - Districts 2-10, 15-19, 23, 26-32
`);
