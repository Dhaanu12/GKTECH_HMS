const XLSX = require('xlsx');
const path = require('path');

const filePath = path.join(__dirname, '../drugs_master.csv.xlsx');

try {
    const workbook = XLSX.readFile(filePath);
    const sheetNames = workbook.SheetNames;

    console.log('Sheet Names:', sheetNames);

    sheetNames.forEach(sheetName => {
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        if (jsonData.length > 0) {
            console.log(`\n--- Sheet: ${sheetName} ---`);
            console.log('Headers:', JSON.stringify(jsonData[0]));
            if (jsonData.length > 1) {
                console.log('First Row Data:', JSON.stringify(jsonData[1]));
            }
        } else {
            console.log(`\n--- Sheet: ${sheetName} is empty ---`);
        }
    });

} catch (error) {
    console.error('Error reading file:', error);
}
