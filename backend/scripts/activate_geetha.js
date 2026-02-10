
require('dotenv').config({ path: 'backend/.env' });
const { query } = require('../config/db');

async function activateUser() {
    try {
        console.log('--- Activating User Geetha ---');

        // 1. Find user ID (re-using logic to be safe)
        const staffRes = await query("SELECT * FROM staff WHERE first_name ILIKE '%Geetha%' OR last_name ILIKE '%Geetha%'");
        let userId = null;
        if (staffRes.rows.length > 0) {
            userId = staffRes.rows[0].user_id;
            console.log(`Found Staff User ID: ${userId}`);
        } else {
            console.log('User not found.');
            return;
        }

        // 2. Update is_active
        const updateRes = await query("UPDATE users SET is_active = true WHERE user_id = $1 RETURNING *", [userId]);
        console.log('Update Result:', updateRes.rows[0].is_active);
        console.log('User Activated Successfully.');

    } catch (error) {
        console.error('Activation script failed:', error);
    } finally {
        process.exit();
    }
}

activateUser();
