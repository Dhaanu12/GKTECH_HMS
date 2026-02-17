const db = require('../config/db');
const xlsx = require('xlsx');
const path = require('path');
const MedicationMaster = require('../models/MedicationMaster');
const MedicationManufacturer = require('../models/MedicationManufacturer');

async function seedMedications() {
    try {
        console.log('🌱 Starting Medication Seed...');

        // Connect to DB
        await db.query('SELECT NOW()');

        // Path to Excel file
        const filePath = path.join(__dirname, '../drugs_master.csv.xlsx');
        const workbook = xlsx.readFile(filePath);

        // Iterate through all sheets
        for (const sheetName of workbook.SheetNames) {
            console.log(`Processing sheet: ${sheetName}`);
            const worksheet = workbook.Sheets[sheetName];
            // Read as array of arrays since there are no headers
            const data = xlsx.utils.sheet_to_json(worksheet, { header: 1 });

            let addedCount = 0;

            for (const row of data) {
                // Row format: [Name, Strength, Form, Route, Manufacturer]
                // Example: ["Paracetamol", "100 mg", "Tablet", "Oral", "Intas Pharmaceuticals"]

                if (!row || row.length === 0) continue;

                const medicine_name = row[0];
                if (!medicine_name) continue;

                const strength = row[1];
                const dosage_form = row[2];
                const route_of_administration = row[3];
                const manufacturer_name = row[4];

                // 1. Get or Create Manufacturer
                let manufacturer_id = null;
                if (manufacturer_name) {
                    let manufacturer = await MedicationManufacturer.findByName(manufacturer_name);
                    if (!manufacturer) {
                        manufacturer = await MedicationManufacturer.create({ name: manufacturer_name });
                    }
                    manufacturer_id = manufacturer.id;
                }

                // 2. Check if exists
                const existing = await MedicationMaster.findByNameAndStrength(medicine_name, strength, null); // Global check

                if (!existing) {
                    await MedicationMaster.create({
                        medicine_name,
                        generic_name: null, // Not in excel
                        manufacturer_id,
                        category: null,
                        strength,
                        dosage_form,
                        drug_class: null,
                        schedule_type: null,
                        prescription_required: false, // Default
                        default_adult_dose: null,
                        default_pediatric_dose: null,
                        route_of_administration,
                        frequency: null,
                        duration: null,
                        instructions: null,
                        max_dose_limit: null,
                        is_global: true,
                        hospital_id: null
                    });
                    addedCount++;
                }
            }
            console.log(`Sheet ${sheetName}: Added ${addedCount} medications.`);
        }

        console.log('✅ Medication Seed Completed!');
        process.exit(0);

    } catch (error) {
        console.error('❌ Seed failed:', error);
        process.exit(1);
    }
}

seedMedications();
