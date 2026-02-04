/**
 * Run Lab Orders Migration
 * Creates lab_orders, patient_documents, and related tables
 */
const fs = require('fs');
const path = require('path');
const { pool } = require('../config/db');

async function runMigration() {
    const client = await pool.connect();

    try {
        console.log('🚀 Starting Lab Orders migration...\n');

        // Read the SQL file
        const sqlPath = path.join(__dirname, '../database/015_lab_orders_and_documents.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        // Execute the migration
        await client.query(sql);

        console.log('✅ Migration completed successfully!');
        console.log('   - lab_orders table created');
        console.log('   - patient_documents table created');
        console.log('   - document_access_log table created');
        console.log('   - lab_order_status_history table created');
        console.log('   - Triggers and indexes created');

    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        if (error.message.includes('already exists')) {
            console.log('\n⚠️  Tables may already exist. This is OK if you have run this before.');
        }
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

runMigration()
    .then(() => {
        console.log('\n🎉 All done!');
        process.exit(0);
    })
    .catch((err) => {
        console.error('\n💥 Migration error:', err);
        process.exit(1);
    });
