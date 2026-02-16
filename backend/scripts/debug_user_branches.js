const { Pool } = require('pg');
const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'hms_database_beta',
    password: 'root',
    port: 5432
});

(async () => {
    const client = await pool.connect();
    try {
        const query = `
            SELECT u.user_id, u.username, 
                   COALESCE(sb.branch_id, db.branch_id, nb.branch_id) as branch_id,
                   s.staff_id, d.doctor_id, n.nurse_id
            FROM users u
            LEFT JOIN staff s ON u.user_id = s.user_id
            LEFT JOIN staff_branches sb ON s.staff_id = sb.staff_id
            LEFT JOIN doctors d ON u.user_id = d.user_id
            LEFT JOIN doctor_branches db ON d.doctor_id = db.doctor_id
            LEFT JOIN nurses n ON u.user_id = n.user_id
            LEFT JOIN nurse_branches nb ON n.nurse_id = nb.nurse_id
            ORDER BY u.user_id
        `;
        const res = await client.query(query);
        console.log(JSON.stringify(res.rows, null, 2));
    } catch (e) {
        console.log(e);
    } finally {
        client.release();
        pool.end();
    }
})();
