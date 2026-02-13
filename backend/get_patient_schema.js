const { Pool } = require('pg');
const fs = require('fs');
require('dotenv').config();

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'hms_database',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD,
});

async function getTableInfo() {
    try {
        const query = `
            SELECT column_name, data_type, character_maximum_length, is_nullable, column_default
            FROM information_schema.columns
            WHERE table_name = 'referral_patients'
            ORDER BY ordinal_position;
        `;
        const res = await pool.query(query);

        let output = 'CREATE TABLE referral_patients (\n';
        res.rows.forEach((row, index) => {
            let line = `    ${row.column_name} ${row.data_type}`;
            if (row.character_maximum_length) {
                line += `(${row.character_maximum_length})`;
            }
            if (row.is_nullable === 'NO') {
                line += ' NOT NULL';
            }
            if (row.column_default) {
                line += ` DEFAULT ${row.column_default}`;
            }
            if (index < res.rows.length - 1) {
                line += ',';
            }
            output += line + '\n';
        });
        output += ');\n';

        fs.writeFileSync('patient_schema.txt', output);
        console.log('Schema written to patient_schema.txt');

    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

getTableInfo();
