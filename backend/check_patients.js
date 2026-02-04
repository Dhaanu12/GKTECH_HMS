const { query } = require('./config/db');

(async () => {
    try {
        const result = await query(
            "SELECT created_at, created_at::date as created_date, CURRENT_DATE as today, (created_at::date = CURRENT_DATE) as is_today FROM patients"
        );
        console.log('Patient dates:', result.rows);

        // Also check total count
        const count = await query("SELECT COUNT(*) as count FROM patients WHERE created_at::date = CURRENT_DATE");
        console.log('New patients today count:', count.rows[0].count);
    } catch (e) {
        console.error('Error:', e.message);
    }
    process.exit(0);
})();
