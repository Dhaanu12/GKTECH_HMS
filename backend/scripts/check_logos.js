const { pool } = require('../config/db');

async function checkLogos() {
    try {
        const res = await pool.query('SELECT hospital_id, hospital_name, logo FROM hospitals WHERE logo IS NOT NULL');
        console.log('Hospitals with logos:', res.rows);
    } catch (err) {
        console.error(err);
    } finally {
        pool.end();
    }
}

checkLogos();
