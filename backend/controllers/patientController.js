const { query } = require('../config/db');
const { AppError } = require('../middleware/errorHandler');

class PatientController {
    /**
     * Create a new patient
     * POST /api/patients
     */
    static async createPatient(req, res, next) {
        try {
            const {
                first_name, last_name, gender, date_of_birth, age,
                blood_group, contact_number, email, address,
                city, state, pincode, emergency_contact_name,
                emergency_contact_number, emergency_contact_relation,
                aadhar_number, insurance_provider, insurance_policy_number,
                medical_history, allergies, current_medications
            } = req.body;

            // Generate MRN (Medical Record Number)
            // Format: MRN-YYYYMMDD-XXXX (where XXXX is random 4 digits)
            const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
            const randomSuffix = Math.floor(1000 + Math.random() * 9000);
            const mrn_number = `MRN-${dateStr}-${randomSuffix}`;

            // Generate Patient Code
            // Format: PAT-XXXXXX (random 6 digits)
            const patient_code = `PAT-${Math.floor(100000 + Math.random() * 900000)}`;

            // Sanitize optional fields
            const sanitizedAdhaar = aadhar_number && aadhar_number.trim() !== '' ? aadhar_number : null;
            const sanitizedBloodGroup = blood_group && blood_group.trim() !== '' ? blood_group : null;
            const sanitizedEmail = email && email.trim() !== '' ? email : null;

            const result = await query(`
                INSERT INTO patients (
                    mrn_number, patient_code, first_name, last_name,
                    gender, date_of_birth, age, blood_group,
                    contact_number, email, address, city, state, pincode,
                    emergency_contact_name, emergency_contact_number, emergency_contact_relation,
                    aadhar_number, insurance_provider, insurance_policy_number,
                    medical_history, allergies, current_medications
                ) VALUES (
                    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14,
                    $15, $16, $17, $18, $19, $20, $21, $22, $23
                ) RETURNING *
            `, [
                mrn_number, patient_code, first_name, last_name,
                gender, date_of_birth, age, sanitizedBloodGroup,
                contact_number, sanitizedEmail, address, city, state, pincode,
                emergency_contact_name, emergency_contact_number, emergency_contact_relation,
                sanitizedAdhaar, insurance_provider, insurance_policy_number,
                medical_history, allergies, current_medications
            ]);

            res.status(201).json({
                status: 'success',
                message: 'Patient registered successfully',
                data: { patient: result.rows[0] }
            });
        } catch (error) {
            console.error('Create patient error:', error);
            if (error.code === '23505') { // Unique violation
                return next(new AppError('Patient with this contact number or email already exists', 409));
            }
            next(new AppError('Failed to register patient', 500));
        }
    }

    /**
     * Get all patients (limited to recent, filtered by branch)
     * GET /api/patients
     */
    static async getAllPatients(req, res, next) {
        try {
            const branch_id = req.user.branch_id;

            // If user has no branch (e.g. super admin), return all
            // But for receptionist, branch_id should be present
            let sql;
            let params = [];

            if (branch_id) {
                // Better approach for performance:
                sql = `
                    WITH BranchPatients AS (
                        SELECT DISTINCT p.patient_id
                        FROM patients p
                        LEFT JOIN opd_entries o ON p.patient_id = o.patient_id
                        LEFT JOIN appointments a ON p.patient_id = a.patient_id
                        WHERE (o.branch_id = $1 OR a.branch_id = $1) AND p.is_active = true
                    ),
                    LatestOPD AS (
                        SELECT DISTINCT ON (patient_id) *
                        FROM opd_entries
                        WHERE branch_id = $1
                        ORDER BY patient_id, visit_date DESC, visit_time DESC
                    )
                    SELECT p.*, 
                           lo.visit_status as last_visit_status,
                           lo.payment_status as last_payment_status,
                           co.next_visit_date
                    FROM patients p
                    JOIN BranchPatients bp ON p.patient_id = bp.patient_id
                    LEFT JOIN LatestOPD lo ON p.patient_id = lo.patient_id
                    LEFT JOIN consultation_outcomes co ON lo.opd_id = co.opd_id
                    ORDER BY p.created_at DESC
                    LIMIT 50
                `;
                params.push(branch_id);
            } else {
                sql = `
                    SELECT * FROM patients 
                    WHERE is_active = true 
                    ORDER BY created_at DESC 
                    LIMIT 50
                `;
            }

            const result = await query(sql, params);

            res.status(200).json({
                status: 'success',
                data: { patients: result.rows }
            });
        } catch (error) {
            console.error('Get all patients error:', error);
            next(new AppError('Failed to fetch patients', 500));
        }
    }

    /**
     * Search patients
     * GET /api/patients/search
     * Query params: q (search term), type (phone, mrn, code)
     */
    static async searchPatients(req, res, next) {
        try {
            const { q, type } = req.query;

            // If no query, return recent patients
            if (!q) {
                return PatientController.getAllPatients(req, res, next);
            }

            let sql = 'SELECT * FROM patients WHERE is_active = true';
            let params = [];

            if (type === 'phone') {
                sql += ' AND contact_number LIKE $1';
                params.push(`%${q}%`);
            } else if (type === 'mrn') {
                sql += ' AND mrn_number ILIKE $1';
                params.push(`%${q}%`);
            } else if (type === 'code') {
                sql += ' AND patient_code ILIKE $1';
                params.push(`%${q}%`);
            } else {
                // General search
                sql += ' AND (first_name ILIKE $1 OR last_name ILIKE $1 OR contact_number LIKE $1 OR mrn_number ILIKE $1 OR patient_code ILIKE $1)';
                params.push(`%${q}%`);
            }

            sql += ' ORDER BY created_at DESC LIMIT 20';

            const result = await query(sql, params);

            res.status(200).json({
                status: 'success',
                data: { patients: result.rows }
            });
        } catch (error) {
            console.error('Search patients error:', error);
            next(new AppError('Failed to search patients', 500));
        }
    }

    /**
     * Get patient by ID
     * GET /api/patients/:id
     */
    static async getPatientById(req, res, next) {
        try {
            const { id } = req.params;
            const result = await query('SELECT * FROM patients WHERE patient_id = $1', [id]);

            if (result.rows.length === 0) {
                return next(new AppError('Patient not found', 404));
            }

            res.status(200).json({
                status: 'success',
                data: { patient: result.rows[0] }
            });
        } catch (error) {
            console.error('Get patient error:', error);
            next(new AppError('Failed to fetch patient details', 500));
        }
    }
    /**
     * Update patient details
     * PATCH /api/patients/:id
     */
    static async updatePatient(req, res, next) {
        try {
            const { id } = req.params;
            const updates = req.body;

            const allowedUpdates = [
                'first_name', 'last_name', 'gender', 'date_of_birth', 'age',
                'blood_group', 'contact_number', 'email', 'address', 'city', 'state', 'pincode',
                'emergency_contact_name', 'emergency_contact_number', 'emergency_contact_relation',
                'aadhar_number', 'insurance_provider', 'insurance_policy_number',
                'medical_history', 'allergies', 'current_medications',
                // Death fields
                'is_deceased', 'date_of_death', 'time_of_death', 'declared_dead_by',
                'cause_of_death', 'death_circumstances', 'is_death_mlc',
                'death_police_station', 'death_police_district', 'post_mortem_required', 'relatives_name', 'relatives_number', 'relatives_notified_at'
            ];

            const fields = [];
            const values = [];
            let index = 1;

            for (const key of Object.keys(updates)) {
                if (allowedUpdates.includes(key)) {
                    fields.push(`${key} = $${index}`);
                    values.push(updates[key]);
                    index++;
                }
            }

            if (fields.length === 0) {
                return next(new AppError('No valid fields to update', 400));
            }

            values.push(id);
            const sql = `UPDATE patients SET ${fields.join(', ')}, updated_at = NOW() WHERE patient_id = $${index} RETURNING *`;

            const result = await query(sql, values);

            if (result.rows.length === 0) {
                return next(new AppError('Patient not found', 404));
            }

            res.status(200).json({
                status: 'success',
                message: 'Patient updated successfully',
                data: { patient: result.rows[0] }
            });

        } catch (error) {
            console.error('Update patient error:', error);
            next(new AppError('Failed to update patient', 500));
        }
    }

    /**
     * Get patients for the logged-in doctor
     * GET /api/patients/my-patients
     */
    static async getMyPatients(req, res, next) {
        try {
            const userId = req.user.user_id;
            const { search } = req.query;

            let sql = `
                SELECT DISTINCT p.*, 
                       MAX(GREATEST(COALESCE(a.appointment_date, '1900-01-01'), COALESCE(o.visit_date, '1900-01-01'))) as last_visit
                FROM patients p
                LEFT JOIN appointments a ON p.patient_id = a.patient_id
                LEFT JOIN opd_entries o ON p.patient_id = o.patient_id
                JOIN doctors d ON (a.doctor_id = d.doctor_id OR o.doctor_id = d.doctor_id)
                WHERE d.user_id = $1
            `;
            const params = [userId];

            if (search) {
                sql += ` AND (
                    p.first_name ILIKE $${params.length + 1} OR 
                    p.last_name ILIKE $${params.length + 1} OR 
                    p.contact_number LIKE $${params.length + 1} OR
                    p.mrn_number ILIKE $${params.length + 1}
                )`;
                params.push(`%${search}%`);
            }

            sql += ` GROUP BY p.patient_id ORDER BY last_visit DESC`;

            const result = await query(sql, params);

            res.status(200).json({
                status: 'success',
                data: { patients: result.rows }
            });
        } catch (error) {
            console.error('Get my patients error:', error);
            next(new AppError('Failed to fetch patients', 500));
        }
    }
}

module.exports = PatientController;
