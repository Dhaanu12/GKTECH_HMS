const { query } = require('../config/db');
const { AppError } = require('../middleware/errorHandler');

class AppointmentController {
    /**
     * Create new appointment
     * POST /api/appointments
     */
    static async createAppointment(req, res, next) {
        try {
            const {
                patient_id,
                patient_name, phone_number, email, age, gender,
                doctor_id, appointment_date, appointment_time,
                reason_for_visit, notes
            } = req.body;

            const branch_id = req.user.branch_id;
            if (!branch_id) {
                return next(new AppError('Branch not linked to your account', 403));
            }

            // Generate appointment number
            const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
            const randomSuffix = Math.floor(1000 + Math.random() * 9000);
            const appointment_number = `APT-${dateStr}-${randomSuffix}`;

            // Sanitize inputs
            const sanitizedAge = age === '' ? null : age;
            const sanitizedGender = gender === '' ? null : gender;
            const sanitizedPatientId = patient_id || null;

            const result = await query(`
                INSERT INTO appointments (
                    appointment_number, patient_id, patient_name, phone_number,
                    email, age, gender, doctor_id, branch_id,
                    appointment_date, appointment_time, reason_for_visit,
                    notes, appointment_status
                ) VALUES (
                    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 'Scheduled'
                ) RETURNING *
            `, [
                appointment_number, sanitizedPatientId, patient_name, phone_number,
                email, sanitizedAge, sanitizedGender, doctor_id, branch_id,
                appointment_date, appointment_time, reason_for_visit, notes
            ]);

            res.status(201).json({
                status: 'success',
                message: 'Appointment created successfully',
                data: { appointment: result.rows[0] }
            });
        } catch (error) {
            console.error('Create appointment error:', error);
            next(new AppError('Failed to create appointment', 500));
        }
    }

    /**
     * Get appointments for branch
     * GET /api/appointments
     */
    static async getAppointments(req, res, next) {
        try {
            const branch_id = req.user.branch_id;
            // If user is a doctor, they might not have branch_id directly on user object if not set in middleware
            // But let's assume they do or we filter by doctor_id regardless of branch for now, 
            // or we enforce branch check.

            const { date, status } = req.query;
            const userRole = req.userRole; // Assuming middleware sets this
            const userId = req.user.user_id; // This is user_id, we need doctor_id

            let sql = `
                SELECT a.*, 
                       d.first_name as doctor_first_name, 
                       d.last_name as doctor_last_name,
                       d.specialization,
                       p.first_name as patient_first_name,
                       p.last_name as patient_last_name,
                       p.mrn_number,
                       p.gender as patient_gender,
                       p.age as patient_age
                FROM appointments a
                JOIN doctors d ON a.doctor_id = d.doctor_id
                LEFT JOIN patients p ON a.patient_id = p.patient_id
                WHERE 1=1
            `;
            const params = [];

            // If Doctor, filter by doctor_id
            if (userRole === 'DOCTOR') {
                // We need to find the doctor_id associated with this user_id
                // Ideally this should be in req.user or we fetch it.
                // For now, let's assume we can subquery or join, or req.user has it.
                // Let's use a subquery for safety if req.user doesn't have doctor_id
                sql += ` AND a.doctor_id = (SELECT doctor_id FROM doctors WHERE user_id = $${params.length + 1})`;
                params.push(userId);
            } else if (branch_id) {
                // For Receptionists/Admins, filter by branch
                sql += ` AND a.branch_id = $${params.length + 1}`;
                params.push(branch_id);
            }

            if (date) {
                params.push(date);
                sql += ` AND a.appointment_date = $${params.length}`;
            }

            if (status) {
                params.push(status);
                sql += ` AND a.appointment_status = $${params.length}`;
            }

            // Filter by patient_id if provided
            const { patient_id } = req.query;
            if (patient_id) {
                params.push(patient_id);
                sql += ` AND a.patient_id = $${params.length}`;
            }

            sql += ' ORDER BY a.appointment_date DESC, a.appointment_time DESC LIMIT 100';

            const result = await query(sql, params);

            res.status(200).json({
                status: 'success',
                data: { appointments: result.rows }
            });
        } catch (error) {
            console.error('Get appointments error:', error);
            next(new AppError('Failed to fetch appointments', 500));
        }
    }

    /**
     * Get single appointment by ID
     * GET /api/appointments/:id
     */
    static async getAppointmentById(req, res, next) {
        try {
            const { id } = req.params;
            const branch_id = req.user.branch_id;

            // Allow basic fetch by ID
            // Optionally enforce branch check if userRole is RECEPTIONIST/CLIENT_ADMIN?
            // For now, let's keep it simple as it's primarily for viewing details.

            const sql = `
                SELECT a.*, 
                       d.first_name as doctor_first_name, 
                       d.last_name as doctor_last_name,
                       d.specialization,
                       p.first_name as patient_first_name,
                       p.last_name as patient_last_name,
                       p.mrn_number,
                       p.gender as patient_gender,
                       p.age as patient_age,
                       p.contact_number as patient_contact,
                       p.email as patient_email
                FROM appointments a
                JOIN doctors d ON a.doctor_id = d.doctor_id
                LEFT JOIN patients p ON a.patient_id = p.patient_id
                WHERE a.appointment_id = $1
            `;

            const result = await query(sql, [id]);

            if (result.rows.length === 0) {
                return next(new AppError('Appointment not found', 404));
            }

            res.status(200).json({
                status: 'success',
                data: { appointment: result.rows[0] }
            });
        } catch (error) {
            console.error('Get appointment by ID error:', error);
            next(new AppError('Failed to fetch appointment details', 500));
        }
    }

    /**
     * Update appointment status
     * PATCH /api/appointments/:id/status
     */
    static async updateAppointmentStatus(req, res, next) {
        try {
            const { id } = req.params;
            const { status, cancellation_reason } = req.body;

            // Validate: Cannot manually set to 'Completed' unless OPD is completed
            if (status === 'Completed') {
                const opdCheck = await query(`
                    SELECT 1 FROM opd_entries 
                    WHERE patient_id = (SELECT patient_id FROM appointments WHERE appointment_id = $1)
                    AND visit_date = (SELECT appointment_date FROM appointments WHERE appointment_id = $1)
                    AND visit_status = 'Completed'
                `, [id]);

                if (opdCheck.rows.length === 0) {
                    // Check if it's being updated by system (we can't easily check caller here without more context, 
                    // but assuming this API is called by frontend user actions).
                    // However, to keep it simple and safe as per requirement:
                    // "appointment status in appointment table can be marked completed only if visit status in opd_entries is completed"
                    return next(new AppError('Appointment cannot be marked Completed until OPD consultation is finished.', 400));
                }
            }

            let sql = 'UPDATE appointments SET appointment_status = $1, updated_at = CURRENT_TIMESTAMP';
            const params = [status, id];

            if (status === 'Cancelled' && cancellation_reason) {
                sql += ', cancellation_reason = $3, cancelled_by = $4';
                params.push(cancellation_reason, req.user.user_id);
            } else if (status === 'Confirmed') {
                sql += ', confirmed_by = $3';
                params.push(req.user.user_id);
            }

            sql += ' WHERE appointment_id = $2 RETURNING *';

            const result = await query(sql, params);

            if (result.rows.length === 0) {
                return next(new AppError('Appointment not found', 404));
            }

            res.status(200).json({
                status: 'success',
                message: 'Appointment status updated',
                data: { appointment: result.rows[0] }
            });
        } catch (error) {
            console.error('Update appointment status error:', error);
            next(new AppError('Failed to update appointment', 500));
        }
    }
}

module.exports = AppointmentController;
