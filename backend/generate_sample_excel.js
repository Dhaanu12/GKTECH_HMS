const xlsx = require('xlsx');
const path = require('path');

const data = [
    {
        "S.NO": 1,
        "IP NO": "IP1001",
        "PATIENT NAME": "John Doe",
        "DR NAME": "Dr. Smith",
        "APPROVAL NO": "APP001",
        "FROM DATE ADMISSION": "2023-10-01",
        "TO DATE DISCHARGE": "2023-10-05",
        "DEPT": "Cardiology",
        "INSURANCE NAME": "HDFC Ergo",
        "BILL AMOUNT": 50000,
        "ADVANCE AMOUNT": 0,
        "CO- PAY": 0,
        "DISCOUNT": 0,
        "APPROVAL AMOUNT": 40000,
        "AMOUNT RECEVICED": 40000,
        "PENDING AMOUNT": 10000,
        "TDS": 0,
        "BANK NAME": "HDFC Bank",
        "DATE": "2023-10-10",
        "UTR NO": "UTR123456",
        "REMAKRS": "Partial Payment"
    },
    {
        "S.NO": 2,
        "IP NO": "IP1002",
        "PATIENT NAME": "Jane Smith",
        "DR NAME": "Dr. Jones",
        "APPROVAL NO": "APP002",
        "FROM DATE ADMISSION": "2023-10-02",
        "TO DATE DISCHARGE": "2023-10-06",
        "DEPT": "Orthopedics",
        "INSURANCE NAME": "Star Health",
        "BILL AMOUNT": 75000,
        "ADVANCE AMOUNT": 5000,
        "CO- PAY": 0,
        "DISCOUNT": 0,
        "APPROVAL AMOUNT": 70000,
        "AMOUNT RECEVICED": 70000,
        "PENDING AMOUNT": 0,
        "TDS": 0,
        "BANK NAME": "SBI",
        "DATE": "2023-10-12",
        "UTR NO": "UTR789012",
        "REMAKRS": "Full Payment"
    }
];

const wb = xlsx.utils.book_new();
const ws = xlsx.utils.json_to_sheet(data);

// Adjust column widths
const wscols = [
    {wch: 6}, // S.NO
    {wch: 10}, // IP NO
    {wch: 15}, // PATIENT NAME
    {wch: 15}, // INSURANCE NAME
    {wch: 15}, // ADMISSION DATE
    {wch: 15}, // DISCHARGE DATE
    {wch: 12}, // BILL AMOUNT
    {wch: 15}, // PENDING AMOUNT
    {wch: 12}, // CLAIM STATUS
    {wch: 20}  // REMARKS
];
ws['!cols'] = wscols;

xlsx.utils.book_append_sheet(wb, ws, "Sample Claims");

const outputPath = path.join(__dirname, '../frontend/public/sample_claims.xlsx');
xlsx.writeFile(wb, outputPath);

console.log(`Sample Excel file generated at: ${outputPath}`);
