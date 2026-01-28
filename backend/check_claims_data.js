const db = require('./config/db');

(async () => {
    try {
        console.log('Checking insurance claims data for accountant...\n');

        // 1. Get accountant's hospital
        const accountantHospital = await db.query(`
            SELECT DISTINCT b.hospital_id, h.hospital_name, b.branch_id, b.branch_name
            FROM users u
            JOIN roles r ON u.role_id = r.role_id
            JOIN staff s ON u.user_id = s.user_id
            JOIN staff_branches sb ON s.staff_id = sb.staff_id
            JOIN branches b ON sb.branch_id = b.branch_id
            JOIN hospitals h ON b.hospital_id = h.hospital_id
            WHERE u.email = 'acc@gktech.ai' AND r.role_code = 'ACCOUNTANT'
        `);

        if (accountantHospital.rows.length === 0) {
            console.log('❌ Accountant has no hospital assignments!');
            process.exit(1);
        }

        console.log('✅ Accountant assigned to:');
        console.table(accountantHospital.rows);

        const hospitalId = accountantHospital.rows[0].hospital_id;

        // 2. Check total insurance claims
        const totalClaims = await db.query(`
            SELECT COUNT(*) as count FROM insurance_claims
        `);
        console.log(`\nTotal insurance claims in database: ${totalClaims.rows[0].count}`);

        // 3. Check claims in accountant's hospital
        const hospitalClaims = await db.query(`
            SELECT COUNT(*) as count 
            FROM insurance_claims 
            WHERE hospital_id = $1
        `, [hospitalId]);
        console.log(`Claims in accountant's hospital (ID ${hospitalId}): ${hospitalClaims.rows[0].count}`);

        // 4. Show sample claims from accountant's hospital
        if (parseInt(hospitalClaims.rows[0].count) > 0) {
            const sampleClaims = await db.query(`
                SELECT claim_id, patient_name, insurance_name, bill_amount, branch_id
                FROM insurance_claims
                WHERE hospital_id = $1
                LIMIT 5
            `, [hospitalId]);

            console.log('\nSample claims:');
            console.table(sampleClaims.rows);
        } else {
            console.log('\n❌ NO CLAIMS DATA in accountant\'s hospital!');
            console.log('ℹ️  This is why the analytics page is empty.');
            console.log('\n💡 To fix this:');
            console.log('   1. Upload insurance claims data via the File Upload page');
            console.log('   2. OR insert sample data into the database');
        }

        process.exit(0);

    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
})();
