const MLCCaseType = require('../models/MLCCaseType');
const db = require('../config/db');

async function verifyMLCCaseTypes() {
    try {
        console.log('🔍 Verifying MLC Case Types...');
        const cases = await MLCCaseType.findAll();
        console.log(`✅ Found ${cases.length} MLC Case Types.`);

        if (cases.length > 0) {
            console.log('Sample Case Type:', cases[0]);
        }

        const injuryCases = await MLCCaseType.findByCategory('Injury & Violence');
        console.log(`✅ Found ${injuryCases.length} cases in "Injury & Violence" category.`);

        process.exit(0);
    } catch (error) {
        console.error('❌ Error verifying MLC Case Types:', error);
        process.exit(1);
    }
}

verifyMLCCaseTypes();
