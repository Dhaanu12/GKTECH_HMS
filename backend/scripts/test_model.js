const MedicationMaster = require('../models/MedicationMaster');
const db = require('../config/db');

async function testModel() {
    try {
        console.log('Testing MedicationMaster.findByHospital(1)...');
        // Assuming hospital_id 1 or any hospital, global meds should show up
        const meds = await MedicationMaster.findByHospital(1);

        console.log(`Found ${meds.length} medications.`);
        if (meds.length > 0) {
            console.log('First medication:', JSON.stringify(meds[0], null, 2));

            // Check for manufacturer_name
            const missingMan = meds.filter(m => !m.manufacturer_name);
            console.log(`Medications missing manufacturer_name: ${missingMan.length}`);
            if (missingMan.length > 0) {
                console.log('Sample missing:', JSON.stringify(missingMan[0], null, 2));
            }
        }
    } catch (err) {
        console.error('Error:', err);
    } finally {
        process.exit();
    }
}

testModel();
