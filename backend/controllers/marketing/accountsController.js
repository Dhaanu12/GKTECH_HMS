const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'phc_hms_08',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD
});

/**
 * Save payment record after GST calculation
 */
exports.savePaymentRecord = async (req, res) => {
    try {
        const {
            referral_doctor_id,
            hosp_service_id,
            service_code,
            service_name,
            service_amount,
            referral_percentage,
            referral_amount,
            gst_rate,
            gst_amount,
            total_payable,
            payment_status,
            remarks
        } = req.body;

        const created_by = req.user ? (req.user.username || req.user.user_id.toString()) : 'unknown';

        const result = await pool.query(
            `INSERT INTO referral_payments (
                referral_doctor_id, hosp_service_id, service_code, service_name,
                service_amount, referral_percentage, referral_amount,
                gst_rate, gst_amount, total_payable,
                payment_status, remarks, created_by
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
            RETURNING *`,
            [
                referral_doctor_id, hosp_service_id, service_code, service_name,
                service_amount, referral_percentage, referral_amount,
                gst_rate, gst_amount, total_payable,
                payment_status || 'Pending', remarks, created_by
            ]
        );

        res.status(201).json({ success: true, data: result.rows[0] });
    } catch (error) {
        console.error('Error saving payment record:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

/**
 * Get payment history
 */
exports.getPaymentHistory = async (req, res) => {
    try {
        const { referral_doctor_id, payment_status, start_date, end_date } = req.query;

        let query = `
            SELECT 
                rp.*,
                rd.doctor_name,
                rd.mobile_number,
                rd.speciality_type
            FROM referral_payments rp
            INNER JOIN referral_doctor_module rd ON rp.referral_doctor_id = rd.id
            WHERE 1=1
        `;

        const params = [];
        let paramCount = 1;

        if (referral_doctor_id) {
            params.push(referral_doctor_id);
            query += ` AND rp.referral_doctor_id = $${paramCount++}`;
        }

        if (payment_status) {
            params.push(payment_status);
            query += ` AND rp.payment_status = $${paramCount++}`;
        }

        if (start_date) {
            params.push(start_date);
            query += ` AND rp.created_at >= $${paramCount++}`;
        }

        if (end_date) {
            params.push(end_date);
            query += ` AND rp.created_at <= $${paramCount++}`;
        }

        query += ' ORDER BY rp.created_at DESC';

        const result = await pool.query(query, params);
        res.status(200).json({ success: true, data: result.rows });
    } catch (error) {
        console.error('Error fetching payment history:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

/**
 * Update payment status
 */
exports.updatePaymentStatus = async (req, res) => {
    try {
        const { payment_id } = req.params;
        const { payment_status, payment_date, payment_mode, payment_reference, remarks } = req.body;
        const updated_by = req.user ? (req.user.username || req.user.user_id.toString()) : 'unknown';

        const result = await pool.query(
            `UPDATE referral_payments 
             SET payment_status = $1, payment_date = $2, payment_mode = $3, 
                 payment_reference = $4, remarks = $5, updated_by = $6
             WHERE payment_id = $7
             RETURNING *`,
            [payment_status, payment_date, payment_mode, payment_reference, remarks, updated_by, payment_id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Payment record not found' });
        }

        res.status(200).json({ success: true, data: result.rows[0] });
    } catch (error) {
        console.error('Error updating payment status:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

/**
 * Get all referral doctors with their service percentages
 */
exports.getAllReferralDoctorsWithPercentages = async (req, res) => {
    try {
        const query = `
            SELECT 
                rd.id,
                rd.doctor_name,
                rd.mobile_number,
                rd.speciality_type,
                rd.clinic_name,
                rd.medical_council_membership_number,
                rd.pan_card_number,
                rd.pan_upload_path,
                rd.status,
                rd.referral_pay,
                h.hospital_name,
                COALESCE(
                    json_agg(
                        json_build_object(
                            'percentage_id', rdsp.percentage_id,
                            'service_type', rdsp.service_type,
                            'referral_pay', rdsp.referral_pay,
                            'cash_percentage', rdsp.cash_percentage,
                            'inpatient_percentage', rdsp.inpatient_percentage,
                            'status', rdsp.status
                        )
                    ) FILTER (WHERE rdsp.percentage_id IS NOT NULL),
                    '[]'::json
                ) as percentages
            FROM referral_doctor_module rd
            LEFT JOIN referral_doctor_service_percentage_module rdsp ON rd.id = rdsp.referral_doctor_id
            LEFT JOIN hospitals h ON rd.tenant_id = h.hospital_id
            WHERE rd.tenant_id = $1
            GROUP BY rd.id, rd.doctor_name, rd.mobile_number, rd.speciality_type, rd.clinic_name, rd.medical_council_membership_number, rd.pan_card_number, rd.pan_upload_path, rd.status, rd.referral_pay, h.hospital_name
            ORDER BY rd.doctor_name
        `;

        const hospitalId = req.user.hospital_id;
        const result = await pool.query(query, [hospitalId]);
        res.status(200).json({ success: true, data: result.rows });
    } catch (error) {
        console.error('Error fetching referral doctors with percentages:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

/**
 * Get all hospital services
 */
exports.getHospitalServices = async (req, res) => {
    try {
        const branchId = req.user.branch_id;
        const result = await pool.query(
            `SELECT s.service_id, s.service_code, s.service_name, s.description as service_description, 18 as gst_rate, bs.is_active
             FROM services s
             JOIN branch_services bs ON s.service_id = bs.service_id
             WHERE bs.branch_id = $1 AND bs.is_active = true
             ORDER BY s.service_name`,
            [branchId]
        );
        res.status(200).json({ success: true, data: result.rows });
    } catch (error) {
        console.error('Error fetching hospital services:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

/**
 * Calculate GST for a service
 * Formula: 
 * - Referral Amount = Service Amount × (Referral Percentage / 100)
 * - GST Amount = Referral Amount × (GST Rate / 100)
 * - Total Payable = Referral Amount + GST Amount
 */
exports.calculateGST = async (req, res) => {
    try {
        const { service_amount, referral_percentage, gst_rate } = req.body;

        if (!service_amount || referral_percentage === undefined || gst_rate === undefined) {
            return res.status(400).json({
                success: false,
                message: 'service_amount, referral_percentage, and gst_rate are required'
            });
        }

        const serviceAmount = parseFloat(service_amount);
        const referralPercentage = parseFloat(referral_percentage);
        const gstRate = parseFloat(gst_rate);

        // Calculate referral amount
        const referralAmount = (serviceAmount * referralPercentage) / 100;

        // Calculate GST on referral amount
        const gstAmount = (referralAmount * gstRate) / 100;

        // Total payable to referral doctor
        const totalPayable = referralAmount + gstAmount;

        res.status(200).json({
            success: true,
            data: {
                service_amount: serviceAmount.toFixed(2),
                referral_percentage: referralPercentage.toFixed(2),
                referral_amount: referralAmount.toFixed(2),
                gst_rate: gstRate.toFixed(2),
                gst_amount: gstAmount.toFixed(2),
                total_payable: totalPayable.toFixed(2)
            }
        });
    } catch (error) {
        console.error('Error calculating GST:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

/**
 * Update GST rate for a hospital service
 */
exports.updateServiceGSTRate = async (req, res) => {
    try {
        const { hosp_service_id } = req.params;
        const { gst_rate } = req.body;

        if (gst_rate === undefined) {
            return res.status(400).json({
                success: false,
                message: 'gst_rate is required'
            });
        }

        const result = await pool.query(
            `UPDATE hospital_services 
             SET gst_rate = $1, updated_at = CURRENT_TIMESTAMP
             WHERE hosp_service_id = $2
             RETURNING *`,
            [gst_rate, hosp_service_id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Service not found'
            });
        }

        res.status(200).json({ success: true, data: result.rows[0] });
    } catch (error) {
        console.error('Error updating service GST rate:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

/**
 * Get referral payment summary/report
 */
exports.getReferralSummary = async (req, res) => {
    try {
        const { start_date, end_date, referral_doctor_id } = req.query;

        let query = `
            SELECT 
                rd.id as referral_doctor_id,
                rd.doctor_name,
                rd.speciality_type,
                rdsp.service_type,
                rdsp.cash_percentage,
                rdsp.inpatient_percentage,
                hs.service_name,
                hs.gst_rate
            FROM referral_doctor_module rd
            INNER JOIN referral_doctor_service_percentage_module rdsp ON rd.id = rdsp.referral_doctor_id
            LEFT JOIN hospital_services hs ON hs.service_code = rdsp.service_type
            WHERE rdsp.status = 'Active'
        `;

        const params = [];
        if (referral_doctor_id) {
            params.push(referral_doctor_id);
            query += ` AND rd.id = $${params.length}`;
        }

        query += ' ORDER BY rd.doctor_name, rdsp.service_type';

        const result = await pool.query(query, params);
        res.status(200).json({ success: true, data: result.rows });
    } catch (error) {
        console.error('Error fetching referral summary:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Export existing functions from accountsController
exports.upsertServicePercentage = async (req, res) => {
    const { referral_doctor_id, service_type, referral_pay, cash_percentage, inpatient_percentage, status } = req.body;
    const created_by = req.user ? (req.user.username || req.user.user_id.toString()) : 'unknown';
    const updated_by = req.user ? (req.user.username || req.user.user_id.toString()) : 'unknown';

    try {
        // Check if exists
        const check = await pool.query('SELECT * FROM referral_doctor_service_percentage_module WHERE referral_doctor_id = $1 AND service_type = $2', [referral_doctor_id, service_type]);

        if (check.rows.length > 0) {
            // Update
            const result = await pool.query(
                `UPDATE referral_doctor_service_percentage_module 
                 SET referral_pay = $1, cash_percentage = $2, inpatient_percentage = $3, status = $4, updated_by = $5 
                 WHERE referral_doctor_id = $6 AND service_type = $7 RETURNING *`,
                [referral_pay, cash_percentage, inpatient_percentage, status, updated_by, referral_doctor_id, service_type]
            );

            // Auto-activate the doctor profile
            await pool.query(
                "UPDATE referral_doctor_module SET status = 'Active', updated_at = (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata') WHERE id = $1 AND status != 'Active'",
                [referral_doctor_id]
            );

            return res.status(200).json({ success: true, data: result.rows[0] });
        } else {
            // Insert
            const result = await pool.query(
                `INSERT INTO referral_doctor_service_percentage_module 
                 (referral_doctor_id, service_type, referral_pay, cash_percentage, inpatient_percentage, status, created_by)
                 VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
                [referral_doctor_id, service_type, referral_pay, cash_percentage, inpatient_percentage, status, created_by]
            );

            // Auto-activate the doctor profile
            await pool.query(
                "UPDATE referral_doctor_module SET status = 'Active', updated_at = (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata') WHERE id = $1 AND status != 'Active'",
                [referral_doctor_id]
            );

            return res.status(201).json({ success: true, data: result.rows[0] });
        }
    } catch (error) {
        console.error('Error updating percentages:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.getPercentagesByDoctor = async (req, res) => {
    const { referral_doctor_id } = req.params;
    try {
        const result = await pool.query('SELECT * FROM referral_doctor_service_percentage_module WHERE referral_doctor_id = $1', [referral_doctor_id]);
        res.status(200).json({ success: true, data: result.rows });
    } catch (error) {
        console.error('Error fetching percentages:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
