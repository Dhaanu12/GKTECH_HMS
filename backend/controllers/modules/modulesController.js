const { Client } = require('pg');
require('dotenv').config();

// Standard database connection for each request (following pattern from existing files if ANY, but usually pool is better)
// Looking at create_database.js it uses Client. But looking at codebase, there's likely a db config. 
// I should use the utils/db (if it worked) or just create a pool here. existing 'utils/db.js' was missing. 
// I will create a DB pool instance in a separate file if I could, but let's stick to using pg directly here effectively or look for `config/db.js`.
// List dir 'config' earlier showed 2 children.
// Let's assume standard connection pattern for now, but to be robust I should probably create a db config if I didn't find one.
// Wait, I saw `DATABASE_SETUP.md`. 
// I'll check `server.js` to see how it connects.
// For now, I will use a local pool definition for this controller to ensure it works.

const { Pool } = require('pg');

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'hms_database',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD
});

// Create a new module
exports.createModule = async (req, res) => {
    const { module_code, module_name, field1, field2, status } = req.body;
    const created_by = req.user ? (req.user.username || req.user.user_id.toString()) : 'unknown';

    try {
        const result = await pool.query(
            `INSERT INTO modules (module_code, module_name, field1, field2, status, created_by)
             VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
            [module_code, module_name, field1, field2, status || 'Active', created_by]
        );
        res.status(201).json({ success: true, data: result.rows[0] });
    } catch (error) {
        console.error('Error creating module:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Update an existing module
exports.updateModule = async (req, res) => {
    const { id } = req.params;
    const { module_name, field1, field2, status } = req.body;
    const updated_by = req.user ? (req.user.username || req.user.user_id.toString()) : 'unknown';

    try {
        const result = await pool.query(
            `UPDATE modules 
             SET module_name = COALESCE($1, module_name), 
                 field1 = COALESCE($2, field1), 
                 field2 = COALESCE($3, field2), 
                 status = COALESCE($4, status), 
                 updated_by = $5,
                 updated_at = (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata')
             WHERE module_id = $6 RETURNING *`,
            [module_name, field1, field2, status, updated_by, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Module not found' });
        }

        res.status(200).json({ success: true, data: result.rows[0] });
    } catch (error) {
        console.error('Error updating module:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// List all modules
exports.getAllModules = async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM modules ORDER BY created_at DESC');
        res.status(200).json({ success: true, data: result.rows });
    } catch (error) {
        console.error('Error fetching modules:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Assign module to a client (hospital) or specific branch
exports.assignModuleToClient = async (req, res) => {
    const { client_id, module_id, marketing_id, status, branch_id } = req.body;
    const created_by = req.user ? (req.user.username || req.user.user_id.toString()) : 'unknown';

    try {
        const result = await pool.query(
            `INSERT INTO client_modules (client_id, module_id, marketing_id, status, created_by, branch_id)
             VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
            [client_id, module_id, marketing_id, status || 'Active', created_by, branch_id || null]
        );
        res.status(201).json({ success: true, data: result.rows[0] });
    } catch (error) {
        console.error('Error assigning module:', error);
        if (error.code === '23505') { // Unique violation
            return res.status(400).json({ success: false, message: 'Module already assigned to this client/branch' });
        }
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Update client module assignment (e.g. status)
exports.updateClientModule = async (req, res) => {
    const { id } = req.params; // client_module_id
    const { marketing_id, status } = req.body;
    const updated_by = req.user ? (req.user.username || req.user.user_id.toString()) : 'unknown';

    try {
        const result = await pool.query(
            `UPDATE client_modules 
             SET marketing_id = COALESCE($1, marketing_id), 
                 status = COALESCE($2, status), 
                 updated_by = $3,
                 updated_at = (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata')
             WHERE client_module_id = $4 RETURNING *`,
            [marketing_id, status, updated_by, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Assignment not found' });
        }

        res.status(200).json({ success: true, data: result.rows[0] });
    } catch (error) {
        console.error('Error updating client module:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Get modules for a specific client (optionally filtered by branch or include NULL branch ones)
exports.getClientModules = async (req, res) => {
    const { client_id } = req.params;
    const { branch_id } = req.query; // Optional query param

    try {
        let query = `SELECT cm.*, m.module_name, m.module_code 
                     FROM client_modules cm
                     JOIN modules m ON cm.module_id = m.module_id
                     WHERE cm.client_id = $1`;

        const values = [client_id];

        if (branch_id) {
            query += ` AND (cm.branch_id = $2 OR cm.branch_id IS NULL)`;
            values.push(branch_id);
        } else {
            //If no branch specified, maybe show all for the hospital? Or just Global?
            // Let's show all for the hospital if no branch specified, to see overview.
        }

        query += ` ORDER BY cm.created_at DESC`;

        const result = await pool.query(query, values);
        res.status(200).json({ success: true, data: result.rows });
    } catch (error) {
        console.error('Error fetching client modules:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
