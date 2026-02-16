const api = require('axios');

async function testPagination() {
    try {
        console.log('Testing Pagination API...');
        // Mock request to localhost:5000 directly as we are in backend folder context usually or can run node script
        // Need auth token? 
        // This is tricky without a valid token. 
        // I'll rely on the user manual verification or unit test if I had one.
        // Let's just do a dry run of the model function directly.

        const MedicationMaster = require('../models/MedicationMaster');
        const db = require('../config/db'); // Ensure DB connection works

        // Mock user hospital_id = 1
        const result = await MedicationMaster.findByHospital(1, {
            branchId: 1,
            page: 1,
            limit: 5
        });

        console.log('Meta:', JSON.stringify(result.meta, null, 2));
        console.log('Data Length:', result.data.length);
        console.log('First Item:', result.data[0] ? result.data[0].medicine_name : 'None');

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

testPagination();
