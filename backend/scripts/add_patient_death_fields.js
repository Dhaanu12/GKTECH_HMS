const { pool } = require('../config/db');

const addPatientDeathFields = async () => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        console.log('Adding Death Certificate columns to patients table...');

        const columns = [
            { name: 'is_deceased', type: 'BOOLEAN DEFAULT FALSE' },
            { name: 'date_of_death', type: 'DATE' },
            { name: 'time_of_death', type: 'TIME' },
            { name: 'declared_dead_by', type: 'VARCHAR(100)' }, // Doctor Name
            { name: 'cause_of_death', type: 'TEXT' }, // Provisional Cause
            { name: 'death_circumstances', type: 'TEXT' }, // History / Circumstances
            { name: 'is_death_mlc', type: 'BOOLEAN DEFAULT FALSE' },
            { name: 'death_police_station', type: 'VARCHAR(255)' }, // If linked to MLC, pre-fill?
            { name: 'post_mortem_required', type: 'BOOLEAN DEFAULT FALSE' },
            { name: 'relatives_name', type: 'VARCHAR(255)' },
            { name: 'relatives_notified_at', type: 'TIMESTAMP' }
        ];

        for (const col of columns) {
            await client.query(`
                ALTER TABLE patients 
                ADD COLUMN IF NOT EXISTS ${col.name} ${col.type}
            `);
            console.log(`Checked/Added column: ${col.name}`);
        }

        await client.query('COMMIT');
        console.log('Successfully updated patients table for Death Certificate.');
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error updating table:', error);
    } finally {
        client.release();
        process.exit(0);
    }
};

addPatientDeathFields();
