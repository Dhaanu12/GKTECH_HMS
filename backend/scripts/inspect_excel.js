const xlsx = require('xlsx');
const path = require('path');

const filePath = path.join(__dirname, '../medicines_10000_multi_company.xlsx');
const workbook = xlsx.readFile(filePath);
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];
const data = xlsx.utils.sheet_to_json(worksheet, { header: 1, range: 0, defval: null });

console.log('First 5 rows:');
console.log(JSON.stringify(data.slice(0, 5), null, 2));
