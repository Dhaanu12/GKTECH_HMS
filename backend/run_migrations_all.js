require('dotenv').config();
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const migrations = [
    '001_add_modules_and_marketing.sql',
    '002_update_schema_audit_and_timezone.sql',
    '003_add_uuid_fields.sql',
    '004_add_branch_modules_and_users.sql',
    '005_fix_duplicated_roles.sql',
    '006_add_referral_doctor_fields.sql',
    'create_hospital_services.sql',
    '007_add_gst_rate_to_services.sql',
    '008_create_referral_payments_table.sql',
    'referral_patients.sql'
];

async function runMigrations() {
    const client = new Client({
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 5432,
        database: process.env.DB_NAME || 'hms_database',
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD
    });

    try {
        await client.connect();
        console.log('✅ Connected to database');

        for (const file of migrations) {
            const sqlPath = path.join(__dirname, 'database', file);
            if (fs.existsSync(sqlPath)) {
                const sql = fs.readFileSync(sqlPath, 'utf8');
                console.log(`📦 Running migration ${file}...`);
                try {
                    await client.query(sql);
                    console.log(`✅ ${file} applied successfully!`);
                } catch (e) {
                    console.error(`❌ Failed to apply ${file}: ${e.message}`);
                    // Continue? Yes, some might already depend on others or exist.
                }
            } else {
                console.error(`❌ Migration file not found: ${file}`);
            }
        }

    } catch (error) {
        console.error('❌ Database connection error:', error);
    } finally {
        await client.end();
    }
}

runMigrations();
