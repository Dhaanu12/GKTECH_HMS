const db = require('./config/db');

(async () => {
    try {
        console.log('Checking insurance_claims structure for hospital 6...\n');

        // Check what columns exist and sample data
        const sampleData = await db.query(`
            SELECT 
                claim_id,
                hospital_id,
                branch_id,
                patient_name,
                insurance_name,
                bill_amount
            FROM insurance_claims
            WHERE hospital_id = 6
            LIMIT 3
        `);

        console.log('Sample claims from hospital 6:');
        console.table(sampleData.rows);

        // Check if branch_id is populated
        const branchCheck = await db.query(`
            SELECT 
                COUNT(*) as total,
                COUNT(branch_id) as with_branch,
                COUNT(*) - COUNT(branch_id) as without_branch
            FROM insurance_claims
            WHERE hospital_id = 6
        `);

        console.log('\nBranch ID analysis:');
        console.table(branchCheck.rows);

        if (parseInt(branchCheck.rows[0].without_branch) > 0) {
            console.log('\n⚠️  PROBLEM: Some claims have NULL branch_id!');
            console.log('The analytics query uses LEFT JOIN on branches, which might cause empty results.');
        }

        process.exit(0);

    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
})();
