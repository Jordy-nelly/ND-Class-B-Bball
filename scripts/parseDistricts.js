const XLSX = require('xlsx');
const path = require('path');

// Load the Excel file
const filePath = path.join(__dirname, '..', 'District Assignments Over Time FINAL.xlsx');
const workbook = XLSX.readFile(filePath);

console.log('=== Sheet Names ===');
console.log(workbook.SheetNames);
console.log(`\nTotal sheets: ${workbook.SheetNames.length}\n`);

// Parse each sheet and show structure
workbook.SheetNames.forEach((sheetName) => {
  const sheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
  
  // Filter out empty rows
  const nonEmptyRows = data.filter(row => row.some(cell => cell !== undefined && cell !== ''));
  
  console.log(`\n=== ${sheetName} ===`);
  console.log(`Rows with data: ${nonEmptyRows.length}`);
  
  // Show first 3 rows as sample
  if (nonEmptyRows.length > 0) {
    console.log('Sample rows:');
    nonEmptyRows.slice(0, 5).forEach((row, i) => {
      console.log(`  Row ${i}: ${JSON.stringify(row)}`);
    });
  }
});
