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

// Helper to get assigned branch IDs for a user
async function getAssignedBranchIds(user) {
    const assignedBranchesQuery = `
        SELECT branch_id FROM staff_branches sb
        JOIN staff s ON sb.staff_id = s.staff_id
        WHERE s.user_id = $1 AND sb.is_active = true
    `;
    const assignedBranches = await pool.query(assignedBranchesQuery, [user.user_id]);
    return assignedBranches.rows.length > 0
        ? assignedBranches.rows.map(row => row.branch_id)
        : [user.branch_id].filter(Boolean);
}

// Helper to check status
const calculateStatus = (data) => {
    // Critical Fields (All must be present for 'Pending')
    // Helper: is non-empty string or present
    const isPresent = (val) => val && val.toString().trim() !== '';

    const requiredFields = [
        'doctor_name', 'mobile_number', 'speciality_type', 'department_id',
        'medical_council_membership_number', 'council', 'clinic_name', 'address',
        'pan_card_number', 'aadhar_card_number',
        'bank_name', 'bank_branch', 'bank_address', 'bank_account_number', 'bank_ifsc_code',
        'photo_upload_path', 'pan_upload_path', 'aadhar_upload_path', 'clinic_photo_path', 'kyc_upload_path'
    ];

    const missing = requiredFields.filter(field => !isPresent(data[field]));

    // If NO missing fields, it's Pending. Otherwise Initialization.
    return missing.length === 0 ? 'Pending' : 'Initialization';
};

const checkDuplicates = async (tenantId, data, excludeId = null) => {
    const { mobile_number, medical_council_membership_number, pan_card_number, aadhar_card_number } = data;

    // Optional: optimization - only check checks if we have at least one value to check
    if (!mobile_number && !medical_council_membership_number && !pan_card_number && !aadhar_card_number) return { isDuplicate: false };

    const result = await pool.query(
        'SELECT id, mobile_number, medical_council_membership_number, pan_card_number, aadhar_card_number FROM referral_doctor_module WHERE tenant_id = $1',
        [tenantId]
    );

    for (const row of result.rows) {
        if (excludeId && row.id === parseInt(excludeId)) continue;

        if (mobile_number && row.mobile_number === mobile_number) {
            return { isDuplicate: true, field: 'Mobile Number' };
        }
        if (medical_council_membership_number && row.medical_council_membership_number === medical_council_membership_number) {
            return { isDuplicate: true, field: 'Medical Council Number' };
        }

        if (pan_card_number && row.pan_card_number) {
            try {
                const dbPan = decrypt(row.pan_card_number);
                if (dbPan && dbPan === pan_card_number) return { isDuplicate: true, field: 'PAN Number' };
            } catch (e) {
                // Ignore decryption errors on individual rows
            }
        }

        if (aadhar_card_number && row.aadhar_card_number) {
            try {
                const dbAadhar = decrypt(row.aadhar_card_number);
                if (dbAadhar && dbAadhar === aadhar_card_number) return { isDuplicate: true, field: 'Aadhaar Number' };
            } catch (e) {
                // Ignore decryption errors
            }
        }
    }

    return { isDuplicate: false };
};

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

    try {
        // Validate Uniqueness
        const uniquenessCheck = await checkDuplicates(effective_tenant_id, {
            mobile_number,
            medical_council_membership_number,
            pan_card_number,
            aadhar_card_number
        });

        if (uniquenessCheck.isDuplicate) {
            // Delete uploaded files if validation fails to prevent orphan files
            return res.status(400).json({ success: false, message: `${uniquenessCheck.field} already exists.` });
        }

        // Determine initial status based on completeness
        const statusData = {
            department_id, doctor_name, mobile_number, speciality_type,
            medical_council_membership_number, council,
            pan_card_number, aadhar_card_number,
            bank_name, bank_branch, bank_address, bank_account_number, bank_ifsc_code,
            address, clinic_name,
            photo_upload_path, pan_upload_path, aadhar_upload_path, clinic_photo_path, kyc_upload_path
        };
        const status = calculateStatus(statusData);

        // Encrypt sensitive data
        const encryptedPan = encrypt(pan_card_number);
        const encryptedAadhar = encrypt(aadhar_card_number);

        const query = `
            INSERT INTO referral_doctor_module (
                department_id, doctor_name, mobile_number, speciality_type,
                medical_council_membership_number, council,
                pan_card_number, aadhar_card_number,
                bank_name, bank_branch, bank_address, bank_account_number, bank_ifsc_code,
                photo_upload_path, pan_upload_path, aadhar_upload_path, clinic_photo_path, kyc_upload_path,
                referral_pay, tenant_id, marketing_spoc, introduced_by, address,
                geo_latitude, geo_longitude, geo_accuracy, created_by, clinic_name, branch_id, status,
                referral_means, means_id
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30,
                $31, $32
            ) RETURNING *`;

        const values = [
            department_id, doctor_name, mobile_number, speciality_type,
            medical_council_membership_number, council,
            encryptedPan, encryptedAadhar,
            bank_name, bank_branch, bank_address, bank_account_number, bank_ifsc_code,
            photo_upload_path, pan_upload_path, aadhar_upload_path, clinic_photo_path, kyc_upload_path,
            sanitizeNumeric(referral_pay), effective_tenant_id, marketing_spoc, introduced_by, address,
            sanitizeNumeric(geo_latitude), sanitizeNumeric(geo_longitude), sanitizeNumeric(geo_accuracy), created_by, clinic_name,
            req.user ? req.user.branch_id : null,
            status,
            req.body.referral_means, sanitizeNumeric(req.body.means_id)
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
        referral_pay, address, clinic_name, status: requested_status,
        referral_means, means_id
    } = req.body;

    const sanitizeNumeric = (val) => (val === '' || val === undefined || val === null) ? null : val;

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
        // 1. Fetch current doctor data for completeness check (we need merged state)
        // We need decrypted values for checking completeness if not updating them
        const currentDocResult = await pool.query('SELECT * FROM referral_doctor_module WHERE id = $1', [id]);
        if (currentDocResult.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Doctor not found' });
        }
        const currentDoc = currentDocResult.rows[0];

        // Decrypt current values to check presence if not being updated
        // Use try-catch in case existing data is malformed (not encrypted)
        let currentPan = currentDoc.pan_card_number;
        let currentAadhar = currentDoc.aadhar_card_number;
        try { currentPan = decrypt(currentDoc.pan_card_number); } catch (e) { }
        try { currentAadhar = decrypt(currentDoc.aadhar_card_number); } catch (e) { }

        // Merge for status calculation AND uniqueness check
        const mergedData = {
            department_id: department_id !== undefined ? department_id : currentDoc.department_id,
            doctor_name: doctor_name !== undefined ? doctor_name : currentDoc.doctor_name,
            mobile_number: mobile_number !== undefined ? mobile_number : currentDoc.mobile_number,
            speciality_type: speciality_type !== undefined ? speciality_type : currentDoc.speciality_type,
            medical_council_membership_number: medical_council_membership_number !== undefined ? medical_council_membership_number : currentDoc.medical_council_membership_number,
            council: council !== undefined ? council : currentDoc.council,
            pan_card_number: pan_card_number !== undefined ? pan_card_number : currentPan, // Unchanged ? Decrypted : New Input
            aadhar_card_number: aadhar_card_number !== undefined ? aadhar_card_number : currentAadhar,
            bank_name: bank_name !== undefined ? bank_name : currentDoc.bank_name,
            bank_branch: bank_branch !== undefined ? bank_branch : currentDoc.bank_branch,
            bank_address: bank_address !== undefined ? bank_address : currentDoc.bank_address,
            bank_account_number: bank_account_number !== undefined ? bank_account_number : currentDoc.bank_account_number,
            bank_ifsc_code: bank_ifsc_code !== undefined ? bank_ifsc_code : currentDoc.bank_ifsc_code,
            address: address !== undefined ? address : currentDoc.address,
            clinic_name: clinic_name !== undefined ? clinic_name : currentDoc.clinic_name,

            referral_means: referral_means !== undefined ? referral_means : currentDoc.referral_means,
            means_id: means_id !== undefined ? means_id : currentDoc.means_id,

            photo_upload_path: photo_upload_path !== undefined ? photo_upload_path : currentDoc.photo_upload_path,
            pan_upload_path: pan_upload_path !== undefined ? pan_upload_path : currentDoc.pan_upload_path,
            aadhar_upload_path: aadhar_upload_path !== undefined ? aadhar_upload_path : currentDoc.aadhar_upload_path,
            clinic_photo_path: clinic_photo_path !== undefined ? clinic_photo_path : currentDoc.clinic_photo_path,
            kyc_upload_path: kyc_upload_path !== undefined ? kyc_upload_path : currentDoc.kyc_upload_path,
        };

        // Validate Uniqueness
        const uniquenessCheck = await checkDuplicates(currentDoc.tenant_id, {
            mobile_number: mergedData.mobile_number,
            medical_council_membership_number: mergedData.medical_council_membership_number,
            pan_card_number: mergedData.pan_card_number,
            aadhar_card_number: mergedData.aadhar_card_number
        }, id);

        if (uniquenessCheck.isDuplicate) {
            return res.status(400).json({ success: false, message: `${uniquenessCheck.field} already exists.` });
        }

        let finalStatus = currentDoc.status;

        // Only auto-update status if not Active (Accountant control)
        // OR if previously Initialization/Pending
        if (currentDoc.status === 'Initialization' || currentDoc.status === 'Pending') {
            finalStatus = calculateStatus(mergedData);
        }

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
                status = $20,
                updated_by = $21,
                clinic_name = COALESCE($22, clinic_name),
                kyc_upload_path = COALESCE($23, kyc_upload_path),
                referral_means = COALESCE($24, referral_means),
                means_id = COALESCE($25, means_id),
                updated_at = (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata')
            WHERE id = $26 RETURNING *
        `;

        const values = [
            department_id, doctor_name, mobile_number, speciality_type,
            medical_council_membership_number, council,
            encryptedPan, encryptedAadhar,
            bank_name, bank_branch, bank_address, bank_account_number, bank_ifsc_code,
            photo_upload_path, pan_upload_path, aadhar_upload_path, clinic_photo_path,
            sanitizeNumeric(referral_pay), address, finalStatus,
            updated_by, clinic_name, kyc_upload_path,
            referral_means, sanitizeNumeric(means_id),
            id
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
        let query = `
            SELECT rdm.*, 
                   ra.name as referral_agent_name, 
                   rd_ref.doctor_name as referrer_doctor_name,
                   CONCAT(s.first_name, ' ', s.last_name) as created_by_name
            FROM referral_doctor_module rdm
            LEFT JOIN referral_agents ra ON rdm.referral_means = 'Agent' AND rdm.means_id = ra.id
            LEFT JOIN referral_doctor_module rd_ref ON rdm.referral_means = 'Doctor' AND rdm.means_id = rd_ref.id
            LEFT JOIN users u ON (rdm.created_by = u.username OR rdm.created_by = CAST(u.user_id AS VARCHAR))
            LEFT JOIN staff s ON u.user_id = s.user_id
            WHERE 1=1
        `;
        const params = [];

        // 1. Tenant Scope (Mandatory if meaningful)
        const tenantId = req.user.hospital_id || req.user.tenant_id;
        if (tenantId) {
            query += ` AND rdm.tenant_id = $${params.length + 1}`;
            params.push(tenantId);
        }

        // 2. Branch Scope (Optional refinement)
        const branchIds = await getAssignedBranchIds(req.user);
        if (branchIds.length > 0) {
            // Show if in my branch OR created by me
            query += ` AND (rdm.branch_id = ANY($${params.length + 1}) OR rdm.created_by = $${params.length + 2})`;
            params.push(branchIds);
            params.push(req.user.username || req.user.user_id.toString());
        }

        // Accountant Flow: Filter out 'Initialization' state
        const role = req.user.role_code || req.user.role;
        if (role === 'ACCOUNTANT' || role === 'ACCOUNTANT_MANAGER') {
            query += ` AND rdm.status != 'Initialization'`;
        }

        query += ' ORDER BY rdm.created_at DESC';

        const result = await pool.query(query, params);

        const shouldMask = req.query.mask === 'true';

        const processedData = result.rows.map(row => {
            // Decrypt
            let pan = '';
            let aadhar = '';

            try {
                pan = row.pan_card_number ? decrypt(row.pan_card_number) : '';
            } catch (e) { pan = row.pan_card_number; }

            try {
                aadhar = row.aadhar_card_number ? decrypt(row.aadhar_card_number) : '';
            } catch (e) { aadhar = row.aadhar_card_number; }

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

exports.getReferralDoctorById = async (req, res) => {
    console.log('getReferralDoctorById hit! params:', req.params);
    try {
        const { id } = req.params;
        // Use hospital_id as tenant_id fallback
        const tenantId = req.user.tenant_id || req.user.hospital_id;
        console.log('Fetching doctor id:', id, 'tenant/hospital:', tenantId);

        let query, params;

        if (tenantId) {
            query = `
                SELECT * FROM referral_doctor_module 
                WHERE id = $1 AND tenant_id = $2
            `;
            params = [id, tenantId];
        } else {
            // Fallback for Super Admin or debugging - remove tenant check if no tenant info found?
            // Or maybe it fails here. Let's try fetching by ID only if tenantId is missing but warn.
            console.warn('No tenant_id found in user object! creating permissive query for debugging.');
            query = `
                SELECT * FROM referral_doctor_module 
                WHERE id = $1
            `;
            params = [id];
        }

        const result = await pool.query(query, params);
        console.log('Query executed. Rows found:', result.rows.length);

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Doctor not found' });
        }

        const doctor = result.rows[0];

        // Decrypt sensitive fields
        if (doctor.pan_card_number) {
            try { doctor.pan_card_number = decrypt(doctor.pan_card_number); } catch (e) { }
        }
        if (doctor.aadhar_card_number) {
            try { doctor.aadhar_card_number = decrypt(doctor.aadhar_card_number); } catch (e) { }
        }

        res.status(200).json({ success: true, data: doctor });
    } catch (error) {
        console.error('Error fetching referral doctor:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
