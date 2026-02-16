const db = require('../config/db');
const xlsx = require('xlsx');
const path = require('path');
const MedicationMaster = require('../models/MedicationMaster');
const MedicationManufacturer = require('../models/MedicationManufacturer');

async function seedLargeMedications() {
    try {
        console.log('🌱 Starting Large Medication Seed...');

        // Connect to DB
        // Ensure connection is ready
        await db.query('SELECT NOW()');

        const filePath = path.join(__dirname, '../medicines_10000_multi_company.xlsx');
        console.log(`Reading file: ${filePath}`);
        const workbook = xlsx.readFile(filePath);

        // Assume first sheet
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        // Read with headers
        const data = xlsx.utils.sheet_to_json(worksheet);

        console.log(`Total rows to process: ${data.length}`);

        let addedCount = 0;
        let skippedCount = 0;
        let errorCount = 0;

        // Cache manufacturers to reduce DB calls
        const manufacturerCache = new Map();

        // Pre-load existing manufacturers
        const existingManufacturers = await db.query('SELECT id, name FROM medication_manufacturers');
        existingManufacturers.rows.forEach(m => {
            manufacturerCache.set(m.name.toLowerCase(), m.id);
        });
        console.log(`Loaded ${manufacturerCache.size} existing manufacturers into cache.`);

        for (let i = 0; i < data.length; i++) {
            const row = data[i];

            // Map columns based on inspection
            // "Brand_Name", "Generic_Name", "Company", "Strength", "Dosage_Form", "Schedule"

            const medicine_name = row['Brand_Name'];
            const generic_name = row['Generic_Name']; // Note: Excel header might have underscore or space, keys are usually as in Excel
            const manufacturer_name = row['Company'];
            const strength = row['Strength'] || 'N/A'; // Default if missing
            const dosage_form = row['Dosage_Form'] || 'Tablet';
            const schedule_type = row['Schedule'];

            if (!medicine_name || !manufacturer_name) {
                // console.log(`Skipping row ${i+1}: Missing name or company`);
                errorCount++;
                continue;
            }

            try {
                // 1. Get or Create Manufacturer
                let manufacturer_id = manufacturerCache.get(manufacturer_name.toLowerCase());

                if (!manufacturer_id) {
                    // Double check DB just in case content changed (unlikely in single-threaded script but safe)
                    // Or just create it
                    let manufacturer = await MedicationManufacturer.findByName(manufacturer_name);
                    if (!manufacturer) {
                        // console.log(`Creating manufacturer: ${manufacturer_name}`);
                        manufacturer = await MedicationManufacturer.create({ name: manufacturer_name });
                    }
                    manufacturer_id = manufacturer.id;
                    manufacturerCache.set(manufacturer_name.toLowerCase(), manufacturer_id);
                }

                // 2. Exact duplicate check
                const existing = await MedicationMaster.findExactDuplicate(medicine_name, strength, manufacturer_id, null);

                if (!existing) {
                    await MedicationMaster.create({
                        medicine_name,
                        generic_name,
                        manufacturer_id,
                        category: null,
                        strength,
                        dosage_form,
                        drug_class: null,
                        schedule_type,
                        prescription_required: schedule_type && schedule_type.toLowerCase().includes('schedule'), // Simple heuristic
                        is_global: true,
                        hospital_id: null
                    });
                    addedCount++;
                } else {
                    skippedCount++;
                }
            } catch (rowErr) {
                console.error(`Error processing row ${i + 1} (${medicine_name}):`, rowErr.message);
                errorCount++;
            }

            if ((i + 1) % 1000 === 0) {
                console.log(`Processed ${i + 1} rows... (Added: ${addedCount}, Skipped: ${skippedCount})`);
            }
        }

        console.log('✅ Seeding Completed!');
        console.log(`Added: ${addedCount}`);
        console.log(`Skipped: ${skippedCount}`);
        console.log(`Errors: ${errorCount}`);

        process.exit(0);

    } catch (error) {
        console.error('❌ Top-level error:', error);
        process.exit(1);
    }
}

seedLargeMedications();
