const db = require('./config/db');
(async () => {
    const r = await db.query(`
        SELECT b.hospital_id, h.hospital_name 
        FROM users u 
        JOIN staff s ON u.user_id = s.user_id 
        JOIN staff_branches sb ON s.staff_id = sb.staff_id 
        JOIN branches b ON sb.branch_id = b.branch_id 
        JOIN hospitals h ON b.hospital_id = h.hospital_id 
        WHERE u.email = 'acc@gktech.ai'
    `);
    console.log('Accountant hospital:', r.rows[0]);

    const claims = await db.query('SELECT hospital_id, COUNT(*) FROM insurance_claims GROUP BY hospital_id');
    console.log('Claims by hospital:', claims.rows);

    process.exit(0);
})();
