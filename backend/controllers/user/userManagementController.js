const { Pool } = require('pg');
require('dotenv').config();
const { PasswordUtils } = require('../../utils/authUtils');

const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD
});

exports.createUser = async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const {
            username, email, password, phone_number, first_name, last_name,
            branch_id, role_code
        } = req.body;

        // Validation
        if (!username || !email || !password || !role_code) {
            throw new Error('Missing required fields: username, email, password, role_code');
        }

        // For hospital staff, branch_id is required. 
        // Allow creating SUPER_ADMIN or Hospital Admin without branch? 
        // The request says "add user by selecting roles for a specific hospital and branch". 
        // So we enforce branch_id for these roles.
        if (role_code !== 'SUPER_ADMIN' && role_code !== 'CLIENT_ADMIN' && !branch_id) {
            throw new Error('Branch is required for this role');
        }

        // However, CLIENT_ADMIN logic is handled separately usually, but let's allow it here if branch provided.
        // Or if strictly following previous logic, CLIENT_ADMIN maps to a branch too.

        // 1. Get Role ID
        const roleRes = await client.query('SELECT role_id FROM roles WHERE role_code = $1', [role_code]);
        if (roleRes.rows.length === 0) throw new Error('Invalid role code');
        const roleId = roleRes.rows[0].role_id;

        // 2. Create User
        // Check exists
        const exists = await client.query('SELECT 1 FROM users WHERE email = $1 OR username = $2', [email, username]);
        if (exists.rows.length > 0) throw new Error('User already exists');

        const password_hash = await PasswordUtils.hashPassword(password);

        const userRes = await client.query(
            `INSERT INTO users (username, email, phone_number, password_hash, role_id, is_active, is_email_verified)
             VALUES ($1, $2, $3, $4, $5, true, true)
             RETURNING user_id`,
            [username, email, phone_number, password_hash, roleId]
        );
        const userId = userRes.rows[0].user_id;

        // 3. Create Staff Entry (if relevant role)
        // Typically all non-super-admins here are staff.
        if (role_code !== 'SUPER_ADMIN') {
            const staffCode = (role_code.substring(0, 3) + Date.now().toString().slice(-6)).toUpperCase();

            const staffRes = await client.query(
                `INSERT INTO staff (user_id, first_name, last_name, staff_code, staff_type, is_active)
                 VALUES ($1, $2, $3, $4, $5, true) RETURNING staff_id`,
                [userId, first_name, last_name, staffCode, role_code]
            );
            const staffId = staffRes.rows[0].staff_id;

            // 4. Link to Branch
            if (branch_id) {
                await client.query(
                    `INSERT INTO staff_branches (staff_id, branch_id, employment_type, is_active)
                     VALUES ($1, $2, 'Permanent', true)`,
                    [staffId, branch_id]
                );
            }
        }

        await client.query('COMMIT');
        res.status(201).json({ success: true, message: 'User created successfully', userId });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Create User Error:', error);
        res.status(400).json({ success: false, message: error.message });
    } finally {
        client.release();
    }
};

exports.getUsers = async (req, res) => {
    // List users filtered by hospital/branch
    try {
        const { branch_id, role_code, hospital_id } = req.query;

        let query = `
            SELECT u.user_id, u.username, u.email, u.phone_number, r.role_name, r.role_code, 
                   s.first_name, s.last_name, b.branch_id, b.branch_name, h.hospital_id, h.hospital_name
            FROM users u
            JOIN roles r ON u.role_id = r.role_id
            LEFT JOIN staff s ON u.user_id = s.user_id
            LEFT JOIN staff_branches sb ON s.staff_id = sb.staff_id
            LEFT JOIN branches b ON sb.branch_id = b.branch_id
            LEFT JOIN hospitals h ON b.hospital_id = h.hospital_id
            WHERE u.is_active = true
        `;

        const params = [];
        let pIdx = 1;

        if (branch_id) {
            query += ` AND b.branch_id = $${pIdx++}`;
            params.push(branch_id);
        } else if (hospital_id) {
            query += ` AND h.hospital_id = $${pIdx++}`;
            params.push(hospital_id);
        }

        if (role_code) {
            query += ` AND r.role_code = $${pIdx++}`;
            params.push(role_code);
        }

        query += ` ORDER BY u.created_at DESC`;

        const result = await pool.query(query, params);
        res.status(200).json({ success: true, data: result.rows });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.updateUser = async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const { id } = req.params; // user_id
        const {
            username, email, phone_number, first_name, last_name,
            branch_id, password
        } = req.body;

        // update user details
        const userUpdates = [];
        const userValues = [];
        let p = 1;

        if (username) { userUpdates.push(`username = $${p++}`); userValues.push(username); }
        if (email) { userUpdates.push(`email = $${p++}`); userValues.push(email); }
        if (phone_number !== undefined) { userUpdates.push(`phone_number = $${p++}`); userValues.push(phone_number || null); }
        if (password) {
            const password_hash = await PasswordUtils.hashPassword(password);
            userUpdates.push(`password_hash = $${p++}`);
            userValues.push(password_hash);
        }

        if (userUpdates.length > 0) {
            userValues.push(id);
            await client.query(`UPDATE users SET ${userUpdates.join(', ')} WHERE user_id = $${p}`, userValues);
        }

        // Find staff_id to update staff details and branch
        const staffRes = await client.query('SELECT staff_id FROM staff WHERE user_id = $1', [id]);
        if (staffRes.rows.length > 0) {
            const staffId = staffRes.rows[0].staff_id;

            // update staff
            if (first_name || last_name) {
                await client.query(
                    `UPDATE staff SET first_name = COALESCE($1, first_name), last_name = COALESCE($2, last_name) WHERE staff_id = $3`,
                    [first_name, last_name, staffId]
                );
            }

            // update branch
            if (branch_id) {
                await client.query('DELETE FROM staff_branches WHERE staff_id = $1', [staffId]);
                await client.query(
                    `INSERT INTO staff_branches (staff_id, branch_id, employment_type, is_active) VALUES ($1, $2, 'Permanent', true)`,
                    [staffId, branch_id]
                );
            }
        }

        await client.query('COMMIT');
        res.status(200).json({ success: true, message: 'User updated successfully' });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Update User Error:', error);
        res.status(400).json({ success: false, message: error.message });
    } finally {
        client.release();
    }
};
