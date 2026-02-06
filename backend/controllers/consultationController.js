const { query } = require('../config/db');
const { AppError } = require('../middleware/errorHandler');

class ConsultationController {
    /**
     * Start a consultation (Update status to In-consultation)
     * POST /api/consultations/start
     */
    static async startConsultation(req, res, next) {
        try {
            const { opd_id } = req.body;

            if (!opd_id) {
                throw new AppError('Missing required field: opd_id', 400);
            }

            await query(`
                UPDATE opd_entries 
                SET visit_status = 'In-consultation' 
                WHERE opd_id = $1
            `, [opd_id]);

            res.status(200).json({
                status: 'success',
                message: 'Consultation started'
            });
        } catch (error) {
            console.error('Start consultation error:', error);
            next(new AppError('Failed to start consultation', 500));
        }
    }

    /**
     * Save consultation draft
     * POST /api/consultations/draft
     */
    static async saveDraft(req, res, next) {
        try {
            const {
                opd_id,
                patient_id,
                diagnosis,
                notes,
                next_visit_date,
                next_visit_status,
                medications,
                labs,
                referral_doctor_id,
                referral_notes
            } = req.body;

            const doctor_id = req.user.doctor_id || req.body.doctor_id;

            if (!opd_id || !patient_id || !doctor_id) {
                throw new AppError('Missing required fields: opd_id, patient_id, doctor_id', 400);
            }

            // Check if draft already exists for this OPD
            const existingDraft = await query(`
                SELECT outcome_id FROM consultation_outcomes
                WHERE opd_id = $1 AND consultation_status = 'Draft'
            `, [opd_id]);

            let result;
            if (existingDraft.rows.length > 0) {
                // Update existing draft
                result = await query(`
                    UPDATE consultation_outcomes
                    SET diagnosis = $1, notes = $2, labs = $3, medications = $4,
                        referral_doctor_id = $5, referral_notes = $6,
                        next_visit_date = $7, next_visit_status = $8,
                        updated_at = CURRENT_TIMESTAMP
                    WHERE opd_id = $9 AND consultation_status = 'Draft'
                    RETURNING *
                `, [
                    diagnosis,
                    notes,
                    JSON.stringify(labs || []),
                    JSON.stringify(medications || []),
                    referral_doctor_id || null,
                    referral_notes || null,
                    next_visit_date || null,
                    next_visit_status,
                    opd_id
                ]);
            } else {
                // Create new draft (OPD status remains 'In-consultation')
                result = await query(`
                    INSERT INTO consultation_outcomes (
                        opd_id, patient_id, doctor_id,
                        consultation_status, diagnosis, notes, labs, medications,
                        referral_doctor_id, referral_notes,
                        next_visit_date, next_visit_status
                    ) VALUES ($1, $2, $3, 'Draft', $4, $5, $6, $7, $8, $9, $10, $11)
                    RETURNING *
                `, [
                    opd_id, patient_id, doctor_id,
                    diagnosis, notes,
                    JSON.stringify(labs || []),
                    JSON.stringify(medications || []),
                    referral_doctor_id || null,
                    referral_notes || null,
                    next_visit_date || null,
                    next_visit_status
                ]);
            }

            res.status(200).json({
                status: 'success',
                message: 'Draft saved successfully',
                data: { draft: result.rows[0] }
            });
        } catch (error) {
            console.error('Save draft error:', error);
            next(new AppError('Failed to save draft', 500));
        }
    }

    /**
     * Get consultation draft for an OPD
     * GET /api/consultations/draft/:opdId
     */
    static async getDraft(req, res, next) {
        try {
            const { opdId } = req.params;

            const result = await query(`
                SELECT * FROM consultation_outcomes
                WHERE opd_id = $1 AND consultation_status = 'Draft'
            `, [opdId]);

            res.status(200).json({
                status: 'success',
                data: { draft: result.rows[0] || null }
            });
        } catch (error) {
            console.error('Get draft error:', error);
            next(new AppError('Failed to fetch draft', 500));
        }
    }

    /**
     * Complete a consultation
     * POST /api/consultations/complete
     */
    static async completeConsultation(req, res, next) {
        const client = await require('../config/db').pool.connect();
        try {
            await client.query('BEGIN');

            const {
                opd_id,
                patient_id,
                diagnosis,
                notes,
                next_visit_date,
                next_visit_status,
                // Prescription details
                medications,
                labs, // New field
                // Referral details
                referral_doctor_id,
                referral_notes
            } = req.body;

            const doctor_id = req.user.doctor_id || req.body.doctor_id; // Handle if passed explicitly or from token

            if (!opd_id || !patient_id || !doctor_id) {
                throw new AppError('Missing required fields: opd_id, patient_id, doctor_id', 400);
            }

            // Delete any existing draft for this OPD
            await client.query(`
                DELETE FROM consultation_outcomes
                WHERE opd_id = $1 AND consultation_status = 'Draft'
            `, [opd_id]);

            // 1. Create Prescription if medications or labs are provided
            let prescription_id = null;
            if ((medications && medications.length > 0) || (labs && labs.length > 0)) {
                // Fetch branch_id from OPD entry
                const opdResult = await client.query('SELECT branch_id FROM opd_entries WHERE opd_id = $1', [opd_id]);
                const branch_id = opdResult.rows[0]?.branch_id;

                const presResult = await client.query(`
                    INSERT INTO prescriptions (
                        doctor_id, patient_id, branch_id, medications, notes, diagnosis, labs, status
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'Active')
                    RETURNING prescription_id
                `, [doctor_id, patient_id, branch_id, JSON.stringify(medications), notes, diagnosis, JSON.stringify(labs || [])]);

                prescription_id = presResult.rows[0].prescription_id;
            }

            // 2. Create Consultation Outcome
            const outcomeResult = await client.query(`
                INSERT INTO consultation_outcomes (
                    opd_id, patient_id, doctor_id, prescription_id,
                    consultation_status, diagnosis, notes,
                    next_visit_date, next_visit_status, labs,
                    referral_doctor_id, referral_notes
                ) VALUES ($1, $2, $3, $4, 'Completed', $5, $6, $7, $8, $9, $10, $11)
                RETURNING *
            `, [opd_id, patient_id, doctor_id, prescription_id, diagnosis, notes, next_visit_date, next_visit_status, JSON.stringify(labs || []), referral_doctor_id || null, referral_notes || null]);

            // 3. Update OPD Entry Status
            await client.query(`
                UPDATE opd_entries 
                SET visit_status = 'Completed' 
                WHERE opd_id = $1
            `, [opd_id]);

            // 4. Update Appointment Status to 'Completed'
            // We need to match by patient, doctor and date of the OPD visit
            const opdDateResult = await client.query('SELECT visit_date FROM opd_entries WHERE opd_id = $1', [opd_id]);
            const visit_date = opdDateResult.rows[0]?.visit_date;

            if (visit_date) {
                await client.query(`
                    UPDATE appointments 
                    SET appointment_status = 'Completed', updated_at = CURRENT_TIMESTAMP
                    WHERE patient_id = $1 
                    AND doctor_id = $2 
                    AND appointment_date = $3
                    AND appointment_status IN ('In OPD', 'Scheduled', 'Confirmed')
                `, [patient_id, doctor_id, visit_date]);
            }

            await client.query('COMMIT');

            res.status(201).json({
                status: 'success',
                message: 'Consultation completed successfully',
                data: {
                    outcome: outcomeResult.rows[0],
                    prescription_id
                }
            });
        } catch (error) {
            await client.query('ROLLBACK');
            console.error('Complete consultation error:', error);
            next(new AppError('Failed to complete consultation', 500));
        } finally {
            client.release();
        }
    }

    /**
     * Get consultation history for a patient
     * GET /api/consultations/patient/:patientId
     */
    static async getPatientConsultations(req, res, next) {
        try {
            const { patientId } = req.params;
            const result = await query(`
                SELECT c.*, c.labs,
                       d.first_name as doctor_first_name, d.last_name as doctor_last_name, d.specialization, d.registration_number as doctor_registration_number,
                       p.medications as prescription_medications,
                       o.vital_signs,
                       h.hospital_name, h.headquarters_address, h.email as hospital_email, h.contact_number as hospital_contact
                FROM consultation_outcomes c
                JOIN doctors d ON c.doctor_id = d.doctor_id
                LEFT JOIN prescriptions p ON c.prescription_id = p.prescription_id
                JOIN opd_entries o ON c.opd_id = o.opd_id
                JOIN branches b ON o.branch_id = b.branch_id
                JOIN hospitals h ON b.hospital_id = h.hospital_id
                WHERE c.patient_id = $1
                ORDER BY c.created_at DESC
            `, [patientId]);

            res.status(200).json({
                status: 'success',
                data: { consultations: result.rows }
            });
        } catch (error) {
            console.error('Get patient consultations error:', error);
            next(new AppError('Failed to fetch consultation history', 500));
        }
    }
}

module.exports = ConsultationController;
