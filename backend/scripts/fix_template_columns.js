/**
 * Fix: Alter varchar column lengths for template_medications
 */

const { query, pool } = require('../config/db');

async function fixColumnLengths() {
    try {
        console.log('🔄 Fixing column lengths in template_medications...');

        await query(`ALTER TABLE template_medications ALTER COLUMN frequency TYPE VARCHAR(200)`);
        await query(`ALTER TABLE template_medications ALTER COLUMN dose TYPE VARCHAR(150)`);

        console.log('✅ Column lengths updated successfully');

    } catch (error) {
        // If columns are already the right size, that's fine
        if (error.code === '42P07') {
            console.log('ℹ️  Columns already have correct size');
        } else {
            console.error('❌ Error:', error.message);
        }
    } finally {
        await pool.end();
    }
}

fixColumnLengths();
