const { query } = require('./config/db');

async function check() {
    try {
        console.log("Checking Geetha...");
        const res = await query("SELECT u.user_id, u.username, r.role_name, r.role_code FROM users u JOIN roles r ON u.role_id = r.role_id WHERE u.username ILIKE 'Geetha%'");
        console.log(res.rows);
    } catch (e) {
        console.error(e);
    }
    process.exit();
}
check();
