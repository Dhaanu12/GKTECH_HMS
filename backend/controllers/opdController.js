const { query } = require('../config/db');
const { AppError } = require('../middleware/errorHandler');
const OPDEntry = require('../models/OPDEntry');

class OpdController {
    /**
     * Create new OPD entry (with optional patient creation)
     * POST /api/opd
     */
    static async createOpdEntry(req, res, next) {
        try {
            const {
                // Patient info (for new or existing)
                patient_id, // If provided, use existing patient
                first_name, last_name, age, gender, contact_number, blood_group,
                // OPD Entry info
                doctor_id, visit_type, visit_date, visit_time,
                reason_for_visit, symptoms, vital_signs, chief_complaint,
                consultation_fee, payment_status, payment_method,
                // New Fields
                is_mlc, attender_name, attender_contact_number, adhaar_number, mlc_remarks,
                // Referral Fields
                referral_hospital, referral_doctor_name,
                // Address Fields
                address_line_1, address_line_2, city, state, pincode
            } = req.body;


            // Sanitize optional fields to null if empty
            const sanitizedAdhaar = adhaar_number && adhaar_number.trim() !== '' ? adhaar_number : null;
            const sanitizedBloodGroup = blood_group && blood_group.trim() !== '' ? blood_group : null;
            const sanitizedAttenderContact = attender_contact_number && attender_contact_number.trim() !== '' ? attender_contact_number : null;
            const sanitizedMlcRemarks = mlc_remarks && mlc_remarks.trim() !== '' ? mlc_remarks : null;

            // Get branch_id from logged-in user (receptionist)
            const branch_id = req.user.branch_id;
            if (!branch_id) {
                return next(new AppError('Branch not linked to your account', 403));
            }

            // MLC Validation - Attender details are optional for MLC
            // For non-MLC cases, keep existing optional Adhaar logic
            if (!is_mlc) {
                // Non-MLC: Adhaar is optional but encouraged.
                // No mandatory validation here now.
                if (!adhaar_number && !patient_id) {
                    // return next(new AppError('Adhaar Number is mandatory for non-MLC cases.', 400));
                }
            }

            let finalPatientId = patient_id;

            // 1. Handle Patient Logic
            if (finalPatientId) {
                // Update existing patient's Adhaar, Blood Group, and Address details if provided
                if (sanitizedAdhaar || sanitizedBloodGroup || address_line_1 || address_line_2 || city || state || pincode) {
                    let updateFields = [];
                    let updateValues = [];
                    let queryParts = [];

                    if (sanitizedAdhaar) {
                        updateFields.push('adhaar_number');
                        updateValues.push(sanitizedAdhaar);
                        queryParts.push(`adhaar_number = $${updateValues.length}`);
                    }
                    if (sanitizedBloodGroup) {
                        updateFields.push('blood_group');
                        updateValues.push(sanitizedBloodGroup);
                        queryParts.push(`blood_group = $${updateValues.length}`);
                    }
                    if (address_line_1) {
                        updateFields.push('address');
                        updateValues.push(address_line_1);
                        queryParts.push(`address = $${updateValues.length}`);
                    }
                    if (address_line_2) {
                        updateFields.push('address_line2');
                        updateValues.push(address_line_2);
                        queryParts.push(`address_line2 = $${updateValues.length}`);
                    }
                    if (city) {
                        updateFields.push('city');
                        updateValues.push(city);
                        queryParts.push(`city = $${updateValues.length}`);
                    }
                    if (state) {
                        updateFields.push('state');
                        updateValues.push(state);
                        queryParts.push(`state = $${updateValues.length}`);
                    }
                    if (pincode) {
                        updateFields.push('pincode');
                        updateValues.push(pincode);
                        queryParts.push(`pincode = $${updateValues.length}`);
                    }

                    if (queryParts.length > 0) {
                        updateValues.push(finalPatientId);
                        await query(`UPDATE patients SET ${queryParts.join(', ')} WHERE patient_id = $${updateValues.length}`, updateValues);
                    }
                }
            } else {
                // No ID provided. Check if exists by contact (if provided)
                if (!first_name || !age || !gender) {
                    return next(new AppError('Patient basic information is required: first_name, age, gender', 400));
                }

                let existingPatient = null;

                // Check by contact only if contact_number is provided
                if (contact_number && contact_number.trim() !== '') {
                    const potentialMatches = await query(
                        'SELECT patient_id, first_name FROM patients WHERE contact_number = $1 AND is_active = true',
                        [contact_number]
                    );

                    // Refined Logic: If matches found, check if the input NAME matches any of them.
                    // If name matches, reuse ID. If not, treat as NEW patient (family member with same phone).
                    if (potentialMatches.rows.length > 0) {
                        const inputName = first_name.trim().toLowerCase();
                        const exactMatch = potentialMatches.rows.find(p => p.first_name.toLowerCase() === inputName);

                        if (exactMatch) {
                            existingPatient = { rows: [exactMatch] };
                        } else {
                            // Phone matches, but Name does not. Assume new patient.
                            existingPatient = null;
                        }
                    }
                }

                if (existingPatient && existingPatient.rows.length > 0) {
                    finalPatientId = existingPatient.rows[0].patient_id;
                    // Update Adhaar/Blood Group/Address if provided
                    if (sanitizedAdhaar || sanitizedBloodGroup || address_line_1 || address_line_2 || city || state || pincode) {
                        let updateFields = [];
                        let updateValues = [];
                        let queryParts = [];

                        if (sanitizedAdhaar) {
                            updateFields.push('adhaar_number');
                            updateValues.push(sanitizedAdhaar);
                            queryParts.push(`adhaar_number = $${updateValues.length}`);
                        }
                        if (sanitizedBloodGroup) {
                            updateFields.push('blood_group');
                            updateValues.push(sanitizedBloodGroup);
                            queryParts.push(`blood_group = $${updateValues.length}`);
                        }
                        if (address_line_1) {
                            updateFields.push('address');
                            updateValues.push(address_line_1);
                            queryParts.push(`address = $${updateValues.length}`);
                        }
                        if (address_line_2) {
                            updateFields.push('address_line2');
                            updateValues.push(address_line_2);
                            queryParts.push(`address_line2 = $${updateValues.length}`);
                        }
                        if (city) {
                            updateFields.push('city');
                            updateValues.push(city);
                            queryParts.push(`city = $${updateValues.length}`);
                        }
                        if (state) {
                            updateFields.push('state');
                            updateValues.push(state);
                            queryParts.push(`state = $${updateValues.length}`);
                        }
                        if (pincode) {
                            updateFields.push('pincode');
                            updateValues.push(pincode);
                            queryParts.push(`pincode = $${updateValues.length}`);
                        }

                        if (queryParts.length > 0) {
                            updateValues.push(finalPatientId);
                            await query(`UPDATE patients SET ${queryParts.join(', ')} WHERE patient_id = $${updateValues.length}`, updateValues);
                        }
                    }
                } else {
                    // Generate Sequential MRN
                    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
                    const lastMrnQuery = await query(
                        `SELECT mrn_number FROM patients WHERE mrn_number LIKE $1 ORDER BY patient_id DESC LIMIT 1`,
                        [`MRN-${dateStr}-%`]
                    );

                    let nextMrnSuffix = 1;
                    if (lastMrnQuery.rows.length > 0) {
                        const lastMrn = lastMrnQuery.rows[0].mrn_number; // e.g. MRN-20250120-0001
                        const parts = lastMrn.split('-');
                        if (parts.length === 3) {
                            const numPart = parseInt(parts[2]);
                            if (!isNaN(numPart)) {
                                nextMrnSuffix = numPart + 1;
                            }
                        }
                    }
                    const mrn_number = `MRN-${dateStr}-${nextMrnSuffix.toString().padStart(4, '0')}`;
                    const patient_code = `PAT-${Math.floor(100000 + Math.random() * 900000)}`;

                    const newPatient = await query(`
                        INSERT INTO patients (
                            mrn_number, patient_code, first_name, last_name,
                            age, gender, contact_number, registration_date, adhaar_number, blood_group,
                            address, address_line2, city, state, pincode
                        ) VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_DATE, $8, $9, $10, $11, $12, $13, $14)
                        RETURNING patient_id
                    `, [mrn_number, patient_code, first_name, last_name, age, gender, contact_number, sanitizedAdhaar, sanitizedBloodGroup, address_line_1, address_line_2, city, state, pincode]);

                    finalPatientId = newPatient.rows[0].patient_id;
                }
            }

            // 2. Generate OPD Numbers
            const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
            const randomSuffix = Math.floor(1000 + Math.random() * 9000);
            const opd_number = `OPD-${dateStr}-${randomSuffix}`;
            // Generate Sequential Token
            const lastTokenQuery = await query(
                `SELECT token_number FROM opd_entries WHERE branch_id = $1 AND visit_date = $2 ORDER BY opd_id DESC LIMIT 1`,
                [branch_id, visit_date]
            );

            let nextTokenInt = 1;
            if (lastTokenQuery.rows.length > 0) {
                const lastToken = lastTokenQuery.rows[0].token_number; // e.g "T-101"
                if (lastToken && lastToken.includes('-')) {
                    const numPart = parseInt(lastToken.split('-')[1]);
                    if (!isNaN(numPart)) {
                        nextTokenInt = numPart + 1;
                    }
                }
            }
            const token_number = `T-${nextTokenInt}`;

            const finalConsultationFee = consultation_fee === '' || consultation_fee === null || consultation_fee === undefined ? null : consultation_fee;
            const finalDoctorId = doctor_id === '' || doctor_id === null || doctor_id === undefined ? null : doctor_id;

            // 3. Create OPD Entry
            const result = await query(`
                INSERT INTO opd_entries (
                    opd_number, patient_id, branch_id, doctor_id,
                    visit_type, visit_date, visit_time, token_number,
                    reason_for_visit, symptoms, vital_signs, chief_complaint,
                    consultation_fee, payment_status, payment_method, visit_status,
                    checked_in_by, checked_in_time,
                    is_mlc, attender_name, attender_contact_number, mlc_remarks,
                    referral_hospital, referral_doctor_name
                ) VALUES (
                    $1, $2, $3, $4,
                    $5, $6, $7, $8,
                    $9, $10, $11, $12,
                    $13, $14, $15, 'Registered',
                    $16, CURRENT_TIMESTAMP,
                    $17, $18, $19, $20,
                    $21, $22
                ) RETURNING *
            `, [
                opd_number, finalPatientId, branch_id, finalDoctorId,
                visit_type, visit_date, visit_time, token_number,
                reason_for_visit, symptoms, vital_signs, chief_complaint,
                finalConsultationFee, payment_status,
                payment_method || 'Cash', // Default to Cash if not provided
                req.user.user_id,
                is_mlc || false, attender_name, sanitizedAttenderContact, sanitizedMlcRemarks,
                referral_hospital || null, referral_doctor_name || null
            ]);


            // 4. Sync Appointment Status
            const { appointment_id } = req.body;

            if (appointment_id) {
                await query(`
                    UPDATE appointments 
                    SET appointment_status = 'In OPD', patient_id = $2, updated_at = CURRENT_TIMESTAMP
                    WHERE appointment_id = $1
                `, [appointment_id, finalPatientId]);
            } else {
                await query(`
                    UPDATE appointments 
                    SET appointment_status = 'In OPD', patient_id = $2, updated_at = CURRENT_TIMESTAMP
                    WHERE patient_id = $1 
                    AND doctor_id = $2 
                    AND appointment_date = $3
                    AND appointment_status IN ('Scheduled', 'Confirmed')
                `, [finalPatientId, doctor_id, visit_date]);
            }

            res.status(201).json({
                status: 'success',
                message: 'OPD entry created successfully',
                data: { opdEntry: result.rows[0] }
            });
        } catch (error) {
            console.error('Create OPD entry error:', error);
            next(new AppError('Failed to create OPD entry', 500));
        }
    }

    /**
     * Get OPD entries for the branch
     * GET /api/opd
     */
    static async getOpdEntries(req, res, next) {
        try {
            const branch_id = req.user.branch_id;
            if (!branch_id) {
                return next(new AppError('Branch not linked to your account', 403));
            }

            const { search, startDate, endDate } = req.query;
            let queryText = `
                SELECT o.*, 
                       p.first_name as patient_first_name, p.last_name as patient_last_name, p.mrn_number, p.contact_number, p.age, p.gender,
                       d.first_name as doctor_first_name, d.last_name as doctor_last_name, d.specialization,
                       co.next_visit_date
                FROM opd_entries o
                JOIN patients p ON o.patient_id = p.patient_id
                JOIN doctors d ON o.doctor_id = d.doctor_id
                LEFT JOIN consultation_outcomes co ON o.opd_id = co.opd_id
                WHERE o.branch_id = $1
            `;

            const queryParams = [branch_id];

            if (startDate) {
                queryParams.push(startDate);
                queryText += ` AND o.visit_date >= $${queryParams.length}`;
            }

            if (endDate) {
                queryParams.push(endDate);
                queryText += ` AND o.visit_date <= $${queryParams.length}`;
            }

            if (search) {
                const searchLower = `%${search.toLowerCase()}%`;
                const idx = queryParams.length + 1;
                queryText += ` AND (
                    LOWER(d.first_name) LIKE $${idx} OR 
                    LOWER(d.last_name) LIKE $${idx} OR
                    LOWER(o.token_number) LIKE $${idx} OR
                    LOWER(p.mrn_number) LIKE $${idx} OR
                    LOWER(o.opd_number) LIKE $${idx} OR
                    LOWER(p.first_name) LIKE $${idx} OR
                    LOWER(p.last_name) LIKE $${idx}
                )`;
                queryParams.push(searchLower);
            }

            queryText += ` ORDER BY o.visit_date DESC, o.visit_time DESC LIMIT 50`;

            const result = await query(queryText, queryParams);

            res.status(200).json({
                status: 'success',
                data: { opdEntries: result.rows }
            });
        } catch (error) {
            console.error('Get OPD entries error:', error);
            next(new AppError('Failed to fetch OPD entries', 500));
        }
    }

    /**
     * Update OPD payment status
     * PATCH /api/opd/:id/payment
     */
    static async updatePaymentStatus(req, res, next) {
        try {
            const { id } = req.params;
            const { payment_status } = req.body;
            const branch_id = req.user.branch_id;

            if (!['Pending', 'Paid', 'Partial', 'Waived'].includes(payment_status)) {
                return next(new AppError('Invalid payment status', 400));
            }

            const result = await query(`
                UPDATE opd_entries 
                SET payment_status = $1 
                WHERE opd_id = $2 AND branch_id = $3
                RETURNING *
            `, [payment_status, id, branch_id]);

            if (result.rows.length === 0) {
                return next(new AppError('OPD entry not found', 404));
            }

            res.status(200).json({
                status: 'success',
                message: 'Payment status updated',
                data: { opdEntry: result.rows[0] }
            });
        } catch (error) {
            console.error('Update payment status error:', error);
            next(new AppError('Failed to update payment status', 500));
        }
    }

    /**
     * Get dashboard stats for receptionist
     * GET /api/opd/stats
     */
    static async getDashboardStats(req, res, next) {
        try {
            const branch_id = req.user.branch_id;
            if (!branch_id) {
                return next(new AppError('Branch not linked to your account', 403));
            }

            // 1. Today's OPD Count
            const opdResult = await query(`
                SELECT COUNT(*) as count 
                FROM opd_entries 
                WHERE branch_id = $1 AND visit_date = CURRENT_DATE
            `, [branch_id]);

            // 2. New Patients Today
            const patientsResult = await query(`
                SELECT COUNT(*) as count 
                FROM patients 
                WHERE created_at::date = CURRENT_DATE
            `);

            // 3. Today's Appointments
            const apptResult = await query(`
                SELECT COUNT(*) as count 
                FROM appointments 
                WHERE branch_id = $1 AND appointment_date = CURRENT_DATE
            `, [branch_id]);

            // 5. Financial Stats (Today)
            const financialResult = await query(`
                SELECT 
                    SUM(CASE WHEN payment_status = 'Paid' THEN CAST(consultation_fee AS DECIMAL) ELSE 0 END) as collected_amount,
                    COUNT(CASE WHEN payment_status = 'Paid' THEN 1 END) as collected_count,
                    SUM(CASE WHEN payment_status = 'Pending' THEN CAST(consultation_fee AS DECIMAL) ELSE 0 END) as pending_amount,
                    COUNT(CASE WHEN payment_status = 'Pending' THEN 1 END) as pending_count,
                    COUNT(CASE WHEN visit_status IN ('Registered', 'In-consultation') THEN 1 END) as queue_count
                FROM opd_entries 
                WHERE branch_id = $1 AND visit_date = CURRENT_DATE
            `, [branch_id]);

            const finStats = financialResult.rows[0];

            res.status(200).json({
                status: 'success',
                data: {
                    stats: {
                        todayOpd: parseInt(opdResult.rows[0].count),
                        newPatients: parseInt(patientsResult.rows[0].count),
                        todayAppointments: parseInt(apptResult.rows[0].count),
                        pendingOpd: parseInt(finStats.queue_count || 0), // Queue (Registered + In-consultation)

                        // Financials
                        collectedAmount: parseFloat(finStats.collected_amount || 0),
                        collectedCount: parseInt(finStats.collected_count || 0),
                        pendingAmount: parseFloat(finStats.pending_amount || 0),
                        pendingCount: parseInt(finStats.pending_count || 0)
                    }
                }
            });
        } catch (error) {
            console.error('Get dashboard stats error:', error);
            next(new AppError('Failed to fetch dashboard stats', 500));
        }
    }

    /**
     * Get OPD entry by ID
     * GET /api/opd/:id
     */
    static async getOpdEntryById(req, res, next) {
        try {
            const { id } = req.params;
            const branch_id = req.user.branch_id;

            const opdEntry = await OPDEntry.findWithDetails(id);

            if (!opdEntry) {
                return next(new AppError('OPD entry not found', 404));
            }

            // Ensure branch access
            if (opdEntry.branch_id !== branch_id) {
                return next(new AppError('Unauthorized access to this OPD entry', 403));
            }

            res.status(200).json({
                status: 'success',
                data: { opdEntry }
            });


        } catch (error) {
            console.error('Get OPD entry error:', error);
            next(new AppError('Failed to fetch OPD entry', 500));
        }
    }
    /**
     * Get OPD history for a patient
     * GET /api/opd/patient/:patientId
     */
    static async getOpdHistoryByPatient(req, res, next) {
        try {
            const { patientId } = req.params;

            const result = await query(`
                SELECT o.*, 
                       d.first_name as doctor_first_name, d.last_name as doctor_last_name, d.specialization,
                       b.branch_name, CONCAT(b.address_line1, ', ', b.city) as branch_address, h.hospital_name
                FROM opd_entries o
                JOIN doctors d ON o.doctor_id = d.doctor_id
                JOIN branches b ON o.branch_id = b.branch_id
                JOIN hospitals h ON b.hospital_id = h.hospital_id
                WHERE o.patient_id = $1
                ORDER BY o.visit_date DESC, o.visit_time DESC
            `, [patientId]);

            res.status(200).json({
                status: 'success',
                data: { opdHistory: result.rows }
            });
        } catch (error) {
            console.error('Get OPD history error:', error);
            next(new AppError('Failed to fetch OPD history', 500));
        }
    }
    /**
     * Get analytics for reports
     * GET /api/opd/stats/analytics
     */
    /**
     * Get analytics for reports
     * GET /api/opd/stats/analytics
     */
    static async getAnalytics(req, res, next) {
        try {
            const branch_id = req.user.branch_id;
            const userRole = req.userRole;
            const { startDate, endDate } = req.query;

            if (!branch_id) {
                return next(new AppError('Branch not linked to your account', 403));
            }

            // Default to today if no dates provided
            const start = startDate || new Date().toISOString().split('T')[0];
            const end = endDate || new Date().toISOString().split('T')[0];

            let doctorFilter = '';
            const params = [branch_id, start, end];

            // If user is a Doctor, filter by their doctor_id
            if (userRole === 'DOCTOR') {
                if (!req.user.doctor_id) {
                    return next(new AppError('Doctor profile not found for this user', 403));
                }
                doctorFilter = `AND doctor_id = $${params.length + 1}`;
                params.push(req.user.doctor_id);
            }

            // 1. Visit Type Distribution
            // Note: opd_entries has doctor_id, so we can filter directly
            const visitTypeResult = await query(`
                SELECT visit_type, COUNT(*) as count
                FROM opd_entries
                WHERE branch_id = $1 
                AND visit_date >= $2 AND visit_date <= $3
                ${doctorFilter}
                GROUP BY visit_type
            `, params);

            // 2. Doctor Performance (Patients seen)
            // If doctor is logged in, this will just show their own stats (1 row)
            const doctorPerfResult = await query(`
                SELECT d.first_name, d.last_name, COUNT(*) as count
                FROM opd_entries o
                JOIN doctors d ON o.doctor_id = d.doctor_id
                WHERE o.branch_id = $1
                AND o.visit_date >= $2 AND o.visit_date <= $3
                ${doctorFilter.replace('doctor_id', 'o.doctor_id')}
                GROUP BY d.doctor_id, d.first_name, d.last_name
                ORDER BY count DESC
                LIMIT 10
            `, params);

            // 3. Peak Hours (Hourly Traffic)
            const hourlyResult = await query(`
                SELECT EXTRACT(HOUR FROM visit_time) as hour, COUNT(*) as count
                FROM opd_entries
                WHERE branch_id = $1
                AND visit_date >= $2 AND visit_date <= $3
                ${doctorFilter}
                GROUP BY hour
                ORDER BY hour ASC
            `, params);

            // 4. Summary Stats
            const summaryResult = await query(`
                SELECT 
                    COUNT(*) as total_visits,
                    COUNT(DISTINCT patient_id) as unique_patients,
                    SUM(CASE WHEN visit_status = 'Completed' THEN 1 ELSE 0 END) as completed_visits
                FROM opd_entries
                WHERE branch_id = $1
                AND visit_date >= $2 AND visit_date <= $3
                ${doctorFilter}
            `, params);

            res.status(200).json({
                status: 'success',
                data: {
                    visitTypes: visitTypeResult.rows,
                    doctorPerformance: doctorPerfResult.rows,
                    hourlyTraffic: hourlyResult.rows,
                    summary: summaryResult.rows[0]
                }
            });
        } catch (error) {
            console.error('Get analytics error:', error);
            next(new AppError('Failed to fetch analytics', 500));
        }
    }
    /**
     * Update OPD Entry
     * PATCH /api/opd/:id
     */
    static async updateOpdEntry(req, res, next) {
        try {
            const { id } = req.params;
            const updates = req.body;
            const branch_id = req.user.branch_id;

            // Fields that can be updated by Receptionist
            const allowedFields = [
                'payment_status', 'payment_method', 'consultation_fee',
                'visit_type', 'visit_date', 'visit_time',
                'symptoms', 'chief_complaint', 'vital_signs',
                'is_mlc', 'attender_name', 'attender_contact_number', 'mlc_remarks',
                'referral_hospital', 'referral_doctor_name'
            ];

            const updateValues = [];
            const queryParts = [];
            let paramIndex = 1;

            for (const key of Object.keys(updates)) {
                if (allowedFields.includes(key)) {
                    queryParts.push(`${key} = $${paramIndex}`);
                    updateValues.push(updates[key]);
                    paramIndex++;
                }
            }

            if (queryParts.length === 0) {
                return next(new AppError('No valid fields to update', 400));
            }

            updateValues.push(id);
            updateValues.push(branch_id);

            const queryText = `
                UPDATE opd_entries 
                SET ${queryParts.join(', ')}
                WHERE opd_id = $${paramIndex} AND branch_id = $${paramIndex + 1}
                RETURNING *
            `;

            const result = await query(queryText, updateValues);

            if (result.rows.length === 0) {
                return next(new AppError('OPD entry not found or unauthorized', 404));
            }

            res.status(200).json({
                status: 'success',
                data: { opdEntry: result.rows[0] }
            });
        } catch (error) {
            console.error('Update OPD entry error:', error);
            next(new AppError('Failed to update OPD entry', 500));
        }
    }
    /**
     * Delete OPD Entry
     * DELETE /api/opd/:id
     */
    static async deleteOpdEntry(req, res, next) {
        try {
            const { id } = req.params;
            const branch_id = req.user.branch_id;

            const result = await query(`
                DELETE FROM opd_entries 
                WHERE opd_id = $1 AND branch_id = $2
                RETURNING *
            `, [id, branch_id]);

            if (result.rows.length === 0) {
                return next(new AppError('OPD entry not found or unauthorized', 404));
            }

            res.status(200).json({
                status: 'success',
                message: 'OPD entry deleted successfully',
                data: null
            });
        } catch (error) {
            console.error('Delete OPD entry error:', error);
            next(new AppError('Failed to delete OPD entry', 500));
        }
    }
}

module.exports = OpdController;
