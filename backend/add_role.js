const db = require('./config/db');

(async () => {
    try {
        console.log('Adding ACCOUNTANT_MANAGER role...\n');

        // Check if role exists
        const check = await db.query("SELECT * FROM roles WHERE role_code = 'ACCOUNTANT_MANAGER'");

        if (check.rows.length > 0) {
            console.log('✅ Role ACCOUNTANT_MANAGER already exists');
        } else {
            const result = await db.query(`
                INSERT INTO roles (role_name, role_code, description, is_active)
                VALUES ('Accountant Manager', 'ACCOUNTANT_MANAGER', 'Manager of Accountants', true)
                RETURNING *
            `);
            console.log('✅ Created role:', result.rows[0]);
        }

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
})();
