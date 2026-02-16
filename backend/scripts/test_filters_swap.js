const MedicationMaster = require('../models/MedicationMaster');
const db = require('../config/db');

async function testFilters() {
    try {
        console.log('Testing Filters...');

        // 1. Fetch proper list (Page 1, All)
        const resultAll = await MedicationMaster.findByHospital(1, {
            branchId: 1,
            page: 1,
            limit: 5
        });

        console.log('--- ALL MEDICATIONS (Top 1) ---');
        const med1 = resultAll.data[0];
        console.log(`ID: ${med1.id}`);
        console.log(`Name: '${med1.medicine_name}'`);
        console.log(`Generic: '${med1.generic_name}'`);
        console.log(`Manufacturer: '${med1.manufacturer_name}'`);
        console.log(`Selected: ${med1.isSelected}`);

        // Toggle one to be selected
        console.log('Toggling ID 9058 to selected...');
        const BranchMedication = require('../models/BranchMedication');
        await BranchMedication.toggleMedication(1, 9058, true);

        // 2. Fetch 'My Branch Only'
        // Pass onlySelected = true
        console.log('\n--- MY BRANCH ONLY (Top 1) ---');
        const resultMyBranch = await MedicationMaster.findByHospital(1, {
            branchId: 1,
            page: 1,
            limit: 5,
            onlySelected: true
        });

        if (resultMyBranch.data.length > 0) {
            const med2 = resultMyBranch.data[0];
            console.log(`ID: ${med2.id}`);
            console.log(`Name: '${med2.medicine_name}'`);
            console.log(`Generic: '${med2.generic_name}'`);
            console.log(`Manufacturer: '${med2.manufacturer_name}'`);
            console.log(`Selected: ${med2.isSelected}`);
        } else {
            console.log('No medications found in My Branch.');
        }

    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
}

testFilters();
