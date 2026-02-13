const { Pool } = require('pg');
const { encrypt, decrypt, mask } = require('../../utils/encryption');
require('dotenv').config();

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'hms_database',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD,
});

exports.createReferralAgent = async (req, res) => {
    const { name, mobile, company, role, remarks, email, tenant_id,
        bank_name, bank_branch, bank_account_number, bank_ifsc_code, pan_card_number,
        referral_patient_commission, referral_doc_commission } = req.body;

    const created_by = req.user ? (req.user.username || req.user.user_id.toString()) : 'unknown';
    // Use user's hospital/tenant ID if not provided
    const effective_tenant_id = (req.user && req.user.hospital_id) ? req.user.hospital_id : tenant_id;

    // File path for PAN upload
    const pan_upload_path = req.files && req.files['pan'] ? req.files['pan'][0].path : req.body.pan_upload_path;

    // Encrypt sensitive data
    const encryptedPan = pan_card_number ? encrypt(pan_card_number) : null;

    try {
        const result = await pool.query(
            `INSERT INTO referral_agents (
                name, mobile, company, role, remarks, email, created_by, tenant_id,
                bank_name, bank_branch, bank_account_number, bank_ifsc_code, pan_card_number, pan_upload_path,
                referral_patient_commission, referral_doc_commission
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16) RETURNING *`,
            [name, mobile, company, role, remarks, email, created_by, effective_tenant_id,
                bank_name, bank_branch, bank_account_number, bank_ifsc_code, encryptedPan, pan_upload_path,
                referral_patient_commission || 0, referral_doc_commission || 0]
        );
        res.status(201).json({ success: true, data: result.rows[0] });
    } catch (error) {
        console.error('Error creating referral agent:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.getAllReferralAgents = async (req, res) => {
    try {
        // Filter by tenant/hospital if available to current user
        let query = `
            SELECT ra.*, 
                   CONCAT(s.first_name, ' ', s.last_name) as created_by_name
            FROM referral_agents ra
            LEFT JOIN users u ON (ra.created_by = u.username OR ra.created_by = CAST(u.user_id AS VARCHAR))
            LEFT JOIN staff s ON u.user_id = s.user_id
            WHERE ra.status != 'Deleted'
        `;
        const params = [];

        if (req.user && req.user.hospital_id) {
            query += ' AND tenant_id = $1';
            params.push(req.user.hospital_id);
        }

        query += ' ORDER BY created_at DESC';

        const result = await pool.query(query, params);

        const shouldMask = req.query.mask === 'true';

        const processedData = result.rows.map(row => {
            // Decrypt PAN
            let pan = '';
            try {
                pan = row.pan_card_number ? decrypt(row.pan_card_number) : '';
            } catch (e) { pan = row.pan_card_number; }

            // Mask if requested
            if (shouldMask) {
                pan = mask(pan);
            }

            return {
                ...row,
                pan_card_number: pan
            };
        });

        res.status(200).json({ success: true, data: processedData });
    } catch (error) {
        console.error('Error fetching referral agents:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.updateReferralAgent = async (req, res) => {
    const { id } = req.params;
    const { name, mobile, company, role, remarks, email, status,
        bank_name, bank_branch, bank_account_number, bank_ifsc_code, pan_card_number,
        referral_patient_commission, referral_doc_commission } = req.body;

    // File path for PAN upload
    const pan_upload_path = req.files && req.files['pan'] ? req.files['pan'][0].path : undefined;

    try {
        // Fetch current agent to check/preserve encryption if not updating
        const currentAgentResult = await pool.query('SELECT * FROM referral_agents WHERE id = $1', [id]);
        if (currentAgentResult.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Agent not found' });
        }
        const currentAgent = currentAgentResult.rows[0];

        // Encrypt PAN if provided, else keep existing (if not undefined)
        // If pan_card_number is sent as empty string '', it clears it. If undefined, it keeps it.
        let encryptedPan = currentAgent.pan_card_number;
        if (pan_card_number !== undefined) {
            encryptedPan = pan_card_number ? encrypt(pan_card_number) : null;
        }

        const result = await pool.query(
            `UPDATE referral_agents SET
                name = COALESCE($1, name),
                mobile = COALESCE($2, mobile),
                company = COALESCE($3, company),
                role = COALESCE($4, role),
                remarks = COALESCE($5, remarks),
                email = COALESCE($6, email),
                status = COALESCE($7, status),
                bank_name = COALESCE($8, bank_name),
                bank_branch = COALESCE($9, bank_branch),
                bank_account_number = COALESCE($10, bank_account_number),
                bank_ifsc_code = COALESCE($11, bank_ifsc_code),
                pan_card_number = COALESCE($12, pan_card_number),
                pan_upload_path = COALESCE($13, pan_upload_path),
                referral_patient_commission = COALESCE($14, referral_patient_commission),
                referral_doc_commission = COALESCE($15, referral_doc_commission),
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $16 RETURNING *`,
            [name, mobile, company, role, remarks, email, status,
                bank_name, bank_branch, bank_account_number, bank_ifsc_code, encryptedPan, pan_upload_path,
                referral_patient_commission, referral_doc_commission,
                id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Agent not found' });
        }
        res.status(200).json({ success: true, data: result.rows[0] });
    } catch (error) {
        console.error('Error updating referral agent:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.deleteReferralAgent = async (req, res) => {
    // Soft delete
    const { id } = req.params;
    try {
        const result = await pool.query(
            "UPDATE referral_agents SET status = 'Deleted' WHERE id = $1 RETURNING *",
            [id]
        );
        if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Agent not found' });
        res.status(200).json({ success: true, message: 'Agent deleted successfully' });
    } catch (error) {
        console.error('Error deleting agent:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.bulkUpdateReferralAgents = async (req, res) => {
    const { agents } = req.body; // Array of { id, referral_patient_commission, referral_doc_commission }

    if (!Array.isArray(agents) || agents.length === 0) {
        return res.status(400).json({ success: false, message: 'No agents provided' });
    }

    const client = await pool.connect();
    let updatedCount = 0;

    try {
        await client.query('BEGIN');

        for (const agent of agents) {
            // Only update commissions if they are different
            // using IS DISTINCT FROM to handle potential nulls gracefully, 
            // though we are defaulting to 0 in parameters.
            const result = await client.query(`
                UPDATE referral_agents SET
                    referral_patient_commission = $1,
                    referral_doc_commission = $2,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = $3
                AND (
                    referral_patient_commission IS DISTINCT FROM $1
                    OR referral_doc_commission IS DISTINCT FROM $2
                )
            `, [
                agent.referral_patient_commission || 0,
                agent.referral_doc_commission || 0,
                agent.id
            ]);
            updatedCount += result.rowCount;
        }

        await client.query('COMMIT');
        res.status(200).json({ success: true, message: 'Process completed', updatedCount });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error in bulk update agents:', error);
        res.status(500).json({ success: false, message: 'Server error during bulk update' });
    } finally {
        client.release();
    }
};
