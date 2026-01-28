const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'hms_database',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD,
});

exports.createReferralPatient = async (req, res) => {
    const {
        patient_name, mobile_number, gender, age, place,
        referral_doctor_id, service_required, remarks, referral_patient_id: manual_id,
        payment_type
    } = req.body;

    const created_by = req.user ? (req.user.username || req.user.user_id.toString()) : 'unknown';
    const marketing_spoc = req.user ? req.user.user_id.toString() : 'unknown';

    const referral_patient_id = manual_id || ('RP-' + Date.now());
    const final_payment_type = payment_type || 'Cash';

    try {
        const query = `
            INSERT INTO referral_patients (
                patient_name, mobile_number, gender, age, place,
                referral_doctor_id, service_required, remarks,
                created_by, marketing_spoc, referral_patient_id, payment_type
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12
            ) RETURNING *
        `;

        const values = [
            patient_name, mobile_number, gender === '' ? null : gender, age === '' ? null : age, place,
            referral_doctor_id, service_required, remarks,
            created_by, marketing_spoc, referral_patient_id, final_payment_type
        ];

        const result = await pool.query(query, values);
        res.status(201).json({ success: true, data: result.rows[0], message: 'Referral patient added successfully' });

    } catch (error) {
        console.error('Error creating referral patient:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.getAllReferralPatients = async (req, res) => {
    try {
        // Join with referral_doctor to get doctor name if needed
        const query = `
            SELECT rp.*, rd.doctor_name as referral_doctor_name
            FROM referral_patients rp
            LEFT JOIN referral_doctor_module rd ON rp.referral_doctor_id = rd.id
            ORDER BY rp.created_at DESC
        `;
        const result = await pool.query(query);
        res.status(200).json({ success: true, data: result.rows });
    } catch (error) {
        console.error('Error fetching referral patients:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
