const MLCCase = require('../models/MLCCase');
const db = require('../config/db');

async function verifyMLCCases() {
    try {
        console.log('🔍 Verifying MLC Cases...');
        const cases = await MLCCase.findAll();
        console.log(`✅ Found ${cases.length} MLC Cases.`);

        if (cases.length > 0) {
            console.log('Sample Case:', cases[0]);
        }

        const injuryCases = await MLCCase.findByCategory('Injury & Violence');
        console.log(`✅ Found ${injuryCases.length} cases in "Injury & Violence" category.`);

        process.exit(0);
    } catch (error) {
        console.error('❌ Error verifying MLC Cases:', error);
        process.exit(1);
    }
}

verifyMLCCases();
