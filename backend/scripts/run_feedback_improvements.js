/**
 * Run Core Feedback Improvements (Skip backfill UPDATE)
 */
const { pool } = require('../config/db');

async function runMigration() {
    const client = await pool.connect();

    try {
        console.log('🚀 Applying feedback improvements...\n');

        // Add columns one by one
        const statements = [
            "ALTER TABLE patient_feedback ADD COLUMN IF NOT EXISTS branch_id INT REFERENCES branches(branch_id)",
            "ALTER TABLE patient_feedback ADD COLUMN IF NOT EXISTS is_addressed BOOLEAN DEFAULT FALSE",
            "ALTER TABLE patient_feedback ADD COLUMN IF NOT EXISTS addressed_at TIMESTAMP",
            "ALTER TABLE patient_feedback ADD COLUMN IF NOT EXISTS addressed_by INT REFERENCES users(user_id)",
            "ALTER TABLE patient_feedback ADD COLUMN IF NOT EXISTS follow_up_notes TEXT",
            "ALTER TABLE patient_feedback ADD COLUMN IF NOT EXISTS opd_id INT REFERENCES opd_entries(opd_id)",
            "ALTER TABLE patient_feedback ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP",
            "CREATE INDEX IF NOT EXISTS idx_feedback_branch ON patient_feedback(branch_id)",
            "CREATE INDEX IF NOT EXISTS idx_feedback_created ON patient_feedback(created_at DESC)",
            "CREATE INDEX IF NOT EXISTS idx_feedback_sentiment ON patient_feedback(sentiment)",
            "CREATE INDEX IF NOT EXISTS idx_feedback_addressed ON patient_feedback(is_addressed)"
        ];

        for (const sql of statements) {
            try {
                await client.query(sql);
                console.log('✅', sql.substring(0, 60) + '...');
            } catch (err) {
                console.log('⚠️  Skipped (may already exist):', err.message);
            }
        }

        console.log('\n✅ Feedback improvements applied!');

    } catch (error) {
        console.error('❌ Migration failed:', error.message);
    } finally {
        client.release();
        await pool.end();
    }
}

runMigration()
    .then(() => { console.log('\n🎉 Done!'); process.exit(0); })
    .catch((err) => { console.error(err); process.exit(1); });
