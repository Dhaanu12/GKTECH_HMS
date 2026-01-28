const { encrypt, decrypt, mask } = require('../../utils/encryption');
require('dotenv').config();

const { Pool } = require('pg');

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'hms_database',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD,
    // Ensure connection uses IST if possible, though 'SET timezone' query on connect is safer for pool
});

// Helper to set timezone for pool connections? 
// pg pool doesn't have a simple 'on connect' for every client easily without event listener.
// But we relied on DEFAULT value in DB for inserts. For valid DATE object retrieval, node-pg converts based on local system time usually.
// Let's focus on logic.

exports.createReferralDoctor = async (req, res) => {
    const {
        department_id, doctor_name, mobile_number, speciality_type,
        medical_council_membership_number, council,
        pan_card_number, aadhar_card_number,
        bank_name, bank_branch, bank_address, bank_account_number, bank_ifsc_code,
        referral_pay, tenant_id, address,
        geo_latitude, geo_longitude, geo_accuracy, clinic_name
    } = req.body;

    // created_by should be passed from req.user (e.g. username or ID). Now it's VARCHAR.
    const created_by = req.user ? (req.user.username || req.user.user_id.toString()) : 'unknown';
    // Auto-capture SPOC and Introduced By from logged in user
    const marketing_spoc = req.user ? req.user.user_id.toString() : 'unknown';
    const introduced_by = req.user ? req.user.user_id.toString() : 'unknown';

    // Use tenant_id from JWT if available (e.g. branch_id or client_id), else fallback to body. 
    // Assuming req.user.client_id or req.user.hospital_id holds the tenant/hospital ID.
    const effective_tenant_id = (req.user && req.user.hospital_id) ? req.user.hospital_id : tenant_id;

    // Helper to sanitize numeric inputs
    const sanitizeNumeric = (val) => (val === '' || val === undefined || val === null) ? null : val;

    // File paths
    const photo_upload_path = req.files && req.files['photo'] ? req.files['photo'][0].path : req.body.photo_upload_path;
    const pan_upload_path = req.files && req.files['pan'] ? req.files['pan'][0].path : req.body.pan_upload_path;
    const aadhar_upload_path = req.files && req.files['aadhar'] ? req.files['aadhar'][0].path : req.body.aadhar_upload_path;
    const clinic_photo_path = req.files && req.files['clinic_photo'] ? req.files['clinic_photo'][0].path : req.body.clinic_photo_path;
    const kyc_upload_path = req.files && req.files['kyc_document'] ? req.files['kyc_document'][0].path : req.body.kyc_upload_path;

    // Encrypt sensitive data
    const encryptedPan = encrypt(pan_card_number);
    const encryptedAadhar = encrypt(aadhar_card_number);

    try {
        const query = `
            INSERT INTO referral_doctor_module (
                department_id, doctor_name, mobile_number, speciality_type,
                medical_council_membership_number, council,
                pan_card_number, aadhar_card_number,
                bank_name, bank_branch, bank_address, bank_account_number, bank_ifsc_code,
                photo_upload_path, pan_upload_path, aadhar_upload_path, clinic_photo_path, kyc_upload_path,
                referral_pay, tenant_id, marketing_spoc, introduced_by, address,
                geo_latitude, geo_longitude, geo_accuracy, created_by, clinic_name, branch_id
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29
            ) RETURNING *`;

        const values = [
            department_id, doctor_name, mobile_number, speciality_type,
            medical_council_membership_number, council,
            encryptedPan, encryptedAadhar,
            bank_name, bank_branch, bank_address, bank_account_number, bank_ifsc_code,
            photo_upload_path, pan_upload_path, aadhar_upload_path, clinic_photo_path, kyc_upload_path,
            sanitizeNumeric(referral_pay), effective_tenant_id, marketing_spoc, introduced_by, address,
            sanitizeNumeric(geo_latitude), sanitizeNumeric(geo_longitude), sanitizeNumeric(geo_accuracy), created_by, clinic_name,
            req.user ? req.user.branch_id : null
        ];

        const result = await pool.query(query, values);
        res.status(201).json({ success: true, data: result.rows[0] });

    } catch (error) {
        console.error('Error creating referral doctor:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.updateReferralDoctor = async (req, res) => {
    const { id } = req.params;
    const {
        department_id, doctor_name, mobile_number, speciality_type,
        medical_council_membership_number, council,
        pan_card_number, aadhar_card_number,
        bank_name, bank_branch, bank_address, bank_account_number, bank_ifsc_code,
        referral_pay, status, address, clinic_name
    } = req.body;

    const updated_by = req.user ? (req.user.username || req.user.user_id.toString()) : 'unknown';

    // Handle files for update if present
    const photo_upload_path = req.files && req.files['photo'] ? req.files['photo'][0].path : undefined; // Only update if new file
    const pan_upload_path = req.files && req.files['pan'] ? req.files['pan'][0].path : undefined;
    const aadhar_upload_path = req.files && req.files['aadhar'] ? req.files['aadhar'][0].path : undefined;
    const clinic_photo_path = req.files && req.files['clinic_photo'] ? req.files['clinic_photo'][0].path : undefined;
    const kyc_upload_path = req.files && req.files['kyc_document'] ? req.files['kyc_document'][0].path : undefined;

    // Handle encryption only if values provided
    let encryptedPan = pan_card_number ? encrypt(pan_card_number) : undefined;
    let encryptedAadhar = aadhar_card_number ? encrypt(aadhar_card_number) : undefined;

    try {
        const query = `
            UPDATE referral_doctor_module SET
                department_id = COALESCE($1, department_id),
                doctor_name = COALESCE($2, doctor_name),
                mobile_number = COALESCE($3, mobile_number),
                speciality_type = COALESCE($4, speciality_type),
                medical_council_membership_number = COALESCE($5, medical_council_membership_number),
                council = COALESCE($6, council),
                pan_card_number = COALESCE($7, pan_card_number),
                aadhar_card_number = COALESCE($8, aadhar_card_number),
                bank_name = COALESCE($9, bank_name),
                bank_branch = COALESCE($10, bank_branch),
                bank_address = COALESCE($11, bank_address),
                bank_account_number = COALESCE($12, bank_account_number),
                bank_ifsc_code = COALESCE($13, bank_ifsc_code),
                photo_upload_path = COALESCE($14, photo_upload_path),
                pan_upload_path = COALESCE($15, pan_upload_path),
                aadhar_upload_path = COALESCE($16, aadhar_upload_path),
                clinic_photo_path = COALESCE($17, clinic_photo_path),
                referral_pay = COALESCE($18, referral_pay),
                address = COALESCE($19, address),
                status = COALESCE($20, status),
                updated_by = $21,
                clinic_name = COALESCE($22, clinic_name),
                kyc_upload_path = COALESCE($23, kyc_upload_path),
                updated_at = (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata')
            WHERE id = $24 RETURNING *
        `;

        const values = [
            department_id, doctor_name, mobile_number, speciality_type,
            medical_council_membership_number, council,
            encryptedPan, encryptedAadhar,
            bank_name, bank_branch, bank_address, bank_account_number, bank_ifsc_code,
            photo_upload_path, pan_upload_path, aadhar_upload_path, clinic_photo_path,
            referral_pay, address, status,
            updated_by, clinic_name, kyc_upload_path, id
        ];

        const result = await pool.query(query, values);

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Doctor not found' });
        }

        res.status(200).json({ success: true, data: result.rows[0] });

    } catch (error) {
        console.error('Error updating referral doctor:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.getAllReferralDoctors = async (req, res) => {
    try {
        let query = 'SELECT * FROM referral_doctor_module WHERE 1=1';
        const params = [];

        // Filter by branch_id if user belongs to a branch (and not just hospital-level admin without branch)
        // If user is Super Admin, they might see all ?? For now, assume strict branch isolation if branch_id exists.
        if (req.user && req.user.branch_id) {
            query += ' AND branch_id = $1';
            params.push(req.user.branch_id);
        }

        query += ' ORDER BY created_at DESC';

        const result = await pool.query(query, params);

        const shouldMask = req.query.mask === 'true';

        const processedData = result.rows.map(row => {
            // Decrypt
            let pan = decrypt(row.pan_card_number);
            let aadhar = decrypt(row.aadhar_card_number);

            // Mask if requested
            if (shouldMask) {
                pan = mask(pan);
                aadhar = mask(aadhar);
            }

            return {
                ...row,
                pan_card_number: pan,
                aadhar_card_number: aadhar
            };
        });

        res.status(200).json({ success: true, data: processedData });
    } catch (error) {
        console.error('Error fetching referral doctors:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
