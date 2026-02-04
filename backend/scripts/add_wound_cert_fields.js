const { pool } = require('../config/db');

const addWoundCertFields = async () => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        console.log('Adding Wound Certificate columns...');

        const columns = [
            { name: 'incident_date_time', type: 'TIMESTAMP' },
            { name: 'alleged_cause', type: 'TEXT' },
            { name: 'danger_to_life', type: 'VARCHAR(50)' }, // Yes/No
            { name: 'age_of_injuries', type: 'VARCHAR(100)' },
            { name: 'treatment_given', type: 'TEXT' },
            { name: 'remarks', type: 'TEXT' },
            { name: 'examination_findings', type: 'TEXT' } // To store the diagnosis/findings if edited
        ];

        for (const col of columns) {
            await client.query(`
                ALTER TABLE mlc_entries 
                ADD COLUMN IF NOT EXISTS ${col.name} ${col.type}
            `);
            console.log(`Checked/Added column: ${col.name}`);
        }

        await client.query('COMMIT');
        console.log('Successfully updated mlc_entries table for Wound Certificate.');
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error updating table:', error);
    } finally {
        client.release();
        pool.end();
    }
};

addWoundCertFields();
