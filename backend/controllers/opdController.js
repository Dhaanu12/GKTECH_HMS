const { query, getClient } = require('../config/db');
const { AppError } = require('../middleware/errorHandler');
const OPDEntry = require('../models/OPDEntry');

class OpdController {
    /**
     * Create new OPD entry (with optional patient creation)
     * POST /api/opd
     */
    static async createOpdEntry(req, res, next) {
        // Use a dedicated client for transaction
        const client = await getClient();
        try {
            await client.query('BEGIN');

            let {
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
                await client.query('ROLLBACK');
                return next(new AppError('Branch not linked to your account', 403));
            }

            // MLC Validation
            if (!is_mlc) {
                if (!adhaar_number && !patient_id) {
                    // return next(new AppError('Adhaar Number is mandatory for non-MLC cases.', 400));
                }
            }

            let finalPatientId = patient_id;

            // 1. Handle Patient Logic
            if (finalPatientId) {
                // Update existing patient's details if provided
                if (first_name || last_name || age || gender || sanitizedAdhaar || sanitizedBloodGroup || address_line_1 || address_line_2 || city || state || pincode) {
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
                    if (first_name) {
                        updateFields.push('first_name');
                        updateValues.push(first_name);
                        queryParts.push(`first_name = $${updateValues.length}`);
                    }
                    if (last_name) {
                        updateFields.push('last_name');
                        updateValues.push(last_name);
                        queryParts.push(`last_name = $${updateValues.length}`);
                    }
                    if (age) {
                        updateFields.push('age');
                        updateValues.push(age);
                        queryParts.push(`age = $${updateValues.length}`);
                    }
                    if (gender) {
                        updateFields.push('gender');
                        updateValues.push(gender);
                        queryParts.push(`gender = $${updateValues.length}`);
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
                        await client.query(`UPDATE patients SET ${queryParts.join(', ')} WHERE patient_id = $${updateValues.length}`, updateValues);
                    }
                }
            } else {
                // No ID provided. Check if exists by contact (if provided)
                if (!first_name || !age || !gender) {
                    if (is_mlc) {
                        // For MLC, allow missing details. Default them if not provided.
                        if (!first_name) {
                            first_name = "Unknown";
                            last_name = "Patient"; // Or "MLC"
                        }
                        if (!age) age = 0;
                        if (!gender) gender = "Other";
                        if (!contact_number) contact_number = null;
                    } else {
                        await client.query('ROLLBACK');
                        return next(new AppError('Patient basic information is required: first_name, age, gender', 400));
                    }
                }

                let existingPatient = null;

                // Check by contact only if contact_number is provided
                if (contact_number && contact_number.trim() !== '') {
                    const potentialMatches = await client.query(
                        'SELECT patient_id, first_name FROM patients WHERE contact_number = $1 AND is_active = true',
                        [contact_number]
                    );

                    if (potentialMatches.rows.length > 0) {
                        const inputName = first_name.trim().toLowerCase();
                        const exactMatch = potentialMatches.rows.find(p => p.first_name.toLowerCase() === inputName);

                        if (exactMatch) {
                            existingPatient = { rows: [exactMatch] };
                        } else {
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
                        // Similar update logic as above... omitted for brevity if duplicate, but must be exact.
                        // Ideally, refactor patient update to a helper, but for now copying is safer to ensure correct client usage.

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
                            await client.query(`UPDATE patients SET ${queryParts.join(', ')} WHERE patient_id = $${updateValues.length}`, updateValues);
                        }
                    }
                } else {
                    // Generate Sequential MRN
                    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
                    const lastMrnQuery = await client.query(
                        `SELECT mrn_number FROM patients WHERE mrn_number LIKE $1 ORDER BY patient_id DESC LIMIT 1`,
                        [`MRN-${dateStr}-%`]
                    );

                    let nextMrnSuffix = 1;
                    if (lastMrnQuery.rows.length > 0) {
                        const lastMrn = lastMrnQuery.rows[0].mrn_number;
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

                    const newPatient = await client.query(`
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

            // CHECK DUPLICATE
            if (finalPatientId && doctor_id) {
                const duplicateCheck = await client.query(
                    `SELECT opd_id FROM opd_entries 
                     WHERE patient_id = $1 AND doctor_id = $2 AND visit_date = $3 
                     AND visit_status NOT IN ('Cancelled', 'Completed')`,
                    [finalPatientId, doctor_id, visit_date]
                );

                if (duplicateCheck.rows.length > 0) {
                    await client.query('ROLLBACK');
                    return res.status(409).json({
                        error: 'Duplicate Entry',
                        message: 'This patient is already registered with this doctor for today.'
                    });
                }
            }

            // 2. Generate OPD Numbers
            const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
            const randomSuffix = Math.floor(1000 + Math.random() * 9000);
            const opd_number = `OPD-${dateStr}-${randomSuffix}`;
            // Generate Sequential Token
            const lastTokenQuery = await client.query(
                `SELECT token_number FROM opd_entries WHERE branch_id = $1 AND visit_date = $2 ORDER BY opd_id DESC LIMIT 1`,
                [branch_id, visit_date]
            );

            let nextTokenInt = 1;
            if (lastTokenQuery.rows.length > 0) {
                const lastToken = lastTokenQuery.rows[0].token_number;
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

            // Fetch Staff Code for created_by
            const staffRes = await client.query(`SELECT staff_code FROM staff WHERE user_id = $1`, [req.user.user_id]);
            const staffCode = staffRes.rows[0]?.staff_code || req.user.username || 'SYSTEM';

            // 2.5. Get Department from Doctor
            let departmentId = null;
            if (finalDoctorId) {
                const docRes = await client.query(`
                    SELECT department_id 
                    FROM doctor_departments 
                    WHERE doctor_id = $1 
                    ORDER BY is_primary_department DESC, department_id ASC 
                    LIMIT 1
                `, [finalDoctorId]);

                if (docRes.rows.length > 0) {
                    departmentId = docRes.rows[0].department_id;
                }
            }

            // 3. Create OPD Entry
            let actualMlcFee = 0;
            if (is_mlc) {
                const branchRes = await client.query(`SELECT mlc_fee FROM branches WHERE branch_id = $1`, [branch_id]);
                actualMlcFee = parseFloat(branchRes.rows[0]?.mlc_fee || '0');
            }
            const consultationFeeNum = parseFloat(finalConsultationFee || '0');
            const totalOpdFee = consultationFeeNum + actualMlcFee;

            const result = await client.query(`
                INSERT INTO opd_entries (
                    opd_number, patient_id, branch_id, doctor_id, department_id,
                    visit_type, visit_date, visit_time, token_number,
                    reason_for_visit, symptoms, vital_signs, chief_complaint,
                    consultation_fee, payment_status, payment_method, visit_status,
                    checked_in_by, checked_in_time,
                    is_mlc, attender_name, attender_contact_number, mlc_remarks,
                    referral_hospital, referral_doctor_name
                ) VALUES (
                    $1, $2, $3, $4, $23,
                    $5, $6, $7, $8,
                    $9, $10, $11, $12,
                    $13, $14,
                    $15, 'Registered',
                    $16, CURRENT_TIMESTAMP,
                    $17, $18, $19, $20,
                    $21, $22
                ) RETURNING *
            `, [
                opd_number, finalPatientId, branch_id, finalDoctorId,
                visit_type, visit_date, visit_time, token_number,
                reason_for_visit, symptoms, vital_signs, chief_complaint,
                totalOpdFee, payment_status, // Store base + MLC for backward compatibility
                payment_method || 'Cash', // Default to Cash if not provided
                staffCode,
                is_mlc || false, attender_name, sanitizedAttenderContact, sanitizedMlcRemarks,
                referral_hospital || null, referral_doctor_name || null,
                departmentId // $23
            ]);

            const newOpdEntry = result.rows[0];
            const newOpdId = newOpdEntry.opd_id;

            // 3.5. Auto-create Billing Master & Details (Pending Status)
            if (consultationFeeNum > 0 || is_mlc) {
                const consultationFeeForBill = consultationFeeNum;
                const totalBillAmount = consultationFeeNum + actualMlcFee;

                if (totalBillAmount > 0) {
                    const patientRes = await client.query(`SELECT mrn_number, first_name, last_name, address, contact_number FROM patients WHERE patient_id = $1`, [finalPatientId]);
                    const patientData = patientRes.rows[0];
                    const patientMrn = patientData?.mrn_number;
                    const patientName = `${patientData?.first_name} ${patientData?.last_name}`.trim();

                    const dateStrBill = new Date().toISOString().slice(0, 10).replace(/-/g, '');
                    const randomSuffixBill = Math.floor(1000 + Math.random() * 9000);
                    const bill_number = `BILL-${dateStrBill}-${randomSuffixBill}`;

                    const lastInvQuery = await client.query(
                        `SELECT invoice_number FROM billing_master WHERE invoice_number LIKE $1 ORDER BY bill_master_id DESC LIMIT 1`,
                        [`INV-${dateStrBill}-%`]
                    );

                    let nextInvSuffix = 1;
                    if (lastInvQuery.rows.length > 0) {
                        const lastInv = lastInvQuery.rows[0].invoice_number;
                        const parts = lastInv.split('-');
                        if (parts.length === 3) {
                            const numPart = parseInt(parts[2]);
                            if (!isNaN(numPart)) nextInvSuffix = numPart + 1;
                        }
                    }
                    const invoice_number = `INV-${dateStrBill}-${nextInvSuffix.toString().padStart(4, '0')}`;

                    const masterResult = await client.query(`
                        INSERT INTO billing_master (
                            bill_number, invoice_number, opd_id, opd_number, branch_id,
                            patient_id, mrn_number, patient_name, patient_address, contact_number,
                            billing_date, 
                            subtotal_amount, total_amount, paid_amount, pending_amount,
                            payment_mode, payment_status, status,
                            created_by, invoice_type
                        ) VALUES (
                            $1, $2, $3, $4, $5,
                            $6, $7, $8, $9, $10,
                            CURRENT_DATE,
                            $11, $11, 0, $11,
                            $12, 'Unpaid', 'Pending',
                            $13, $14
                        ) RETURNING bill_master_id
                    `, [
                        bill_number, invoice_number, newOpdId, opd_number, branch_id,
                        finalPatientId, patientMrn, patientName, patientData?.address || 'N/A', patientData?.contact_number || '0000000000',
                        totalBillAmount,
                        payment_method || 'Cash',
                        staffCode,
                        is_mlc ? 'Emergency' : 'OPD'
                    ]);

                    const bill_master_id = masterResult.rows[0].bill_master_id;

                    // Insert Consultation Fee Line Item
                    if (consultationFeeNum > 0) {
                        await client.query(`
                            INSERT INTO bill_details (
                                bill_master_id, branch_id, department_id, patient_id, mrn_number, opd_id,
                                service_type, service_name, quantity, unit_price, subtotal, final_price, status,
                                is_cancellable, created_by
                            ) VALUES (
                                $1, $2, $3, $4, $5, $6,
                                'consultation', 'OPD Consultation', 1, $7, $7, $7, 'Pending',
                                false, $8
                            )
                        `, [
                            bill_master_id, branch_id, departmentId || 0, finalPatientId, patientMrn, newOpdId,
                            consultationFeeNum, staffCode
                        ]);
                    }

                    // Insert MLC Fee Line Item
                    if (actualMlcFee > 0) {
                        await client.query(`
                            INSERT INTO bill_details (
                                bill_master_id, branch_id, department_id, patient_id, mrn_number, opd_id,
                                service_type, service_name, quantity, unit_price, subtotal, final_price, status,
                                is_cancellable, created_by
                            ) VALUES (
                                $1, $2, $3, $4, $5, $6,
                                'other', 'MLC Fee', 1, $7, $7, $7, 'Pending',
                                false, $8
                            )
                        `, [
                            bill_master_id, branch_id, departmentId || 0, finalPatientId, patientMrn, newOpdId,
                            actualMlcFee, staffCode
                        ]);
                    }
                }
            }

            // 4. Sync Appointment Status
            const { appointment_id } = req.body;

            if (appointment_id) {
                await client.query(`
                    UPDATE appointments 
                    SET appointment_status = 'In OPD', patient_id = $2, updated_at = CURRENT_TIMESTAMP
                    WHERE appointment_id = $1
                `, [appointment_id, finalPatientId]);
            } else {
                let matchQuery = `
                    UPDATE appointments 
                    SET appointment_status = 'In OPD', patient_id = $1, updated_at = CURRENT_TIMESTAMP
                    WHERE doctor_id = $2 
                    AND appointment_date = $3
                    AND appointment_status IN ('Scheduled', 'Confirmed')
                    AND (
                        (patient_id IS NOT NULL AND patient_id = $1)
                        OR 
                        (patient_id IS NULL AND phone_number = $4)
                    )
                `;

                const checkPhone = contact_number || '';
                await client.query(matchQuery, [finalPatientId, doctor_id, visit_date, checkPhone]);
            }

            await client.query('COMMIT');

            res.status(201).json({
                status: 'success',
                message: 'OPD entry created successfully',
                data: { opdEntry: result.rows[0] }
            });
        } catch (error) {
            await client.query('ROLLBACK');
            console.error('Create OPD entry error:', error);
            next(new AppError('Failed to create OPD entry', 500));
        } finally {
            client.release();
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
                       p.first_name as patient_first_name, p.last_name as patient_last_name, p.mrn_number, p.contact_number, p.age, p.gender, p.blood_group,
                       p.address as address_line1, p.address_line2, p.city, p.state, p.pincode, p.adhaar_number, p.created_at as patient_created_at,
                       d.first_name as doctor_first_name, d.last_name as doctor_last_name, d.specialization,
                       co.next_visit_date,
                       dept.department_name
                FROM opd_entries o
                JOIN patients p ON o.patient_id = p.patient_id
                JOIN doctors d ON o.doctor_id = d.doctor_id
                LEFT JOIN departments dept ON o.department_id = dept.department_id
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

            if (req.query.includeCancelled !== 'true') {
                queryText += ` AND o.visit_status NOT IN ('Cancelled', 'Rescheduled')`;
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
     * Update OPD status
     * PATCH /api/opd/:id/status
     */
    static async updateOpdStatus(req, res, next) {
        const client = await getClient();
        try {
            await client.query('BEGIN');
            const { id } = req.params;
            const { visit_status } = req.body;
            const branch_id = req.user.branch_id;

            if (!visit_status) {
                await client.query('ROLLBACK');
                return next(new AppError('Visit status is required', 400));
            }

            // Fetch Staff Code for audit fields
            const staffRes = await client.query(`SELECT staff_code FROM staff WHERE user_id = $1`, [req.user.user_id]);
            const staffCode = staffRes.rows[0]?.staff_code || req.user.username || 'SYSTEM';

            const query = `
                UPDATE opd_entries 
                SET 
                    visit_status = $1, 
                    updated_at = CURRENT_TIMESTAMP,
                    consultation_start_time = CASE 
                        WHEN $4 = 'In-consultation' AND consultation_start_time IS NULL THEN CURRENT_TIMESTAMP 
                        ELSE consultation_start_time 
                    END
                WHERE opd_id = $2 AND branch_id = $3
                RETURNING *
            `;

            const result = await client.query(query, [visit_status, id, branch_id, visit_status]);

            if (result.rows.length === 0) {
                await client.query('ROLLBACK');
                return next(new AppError('OPD entry not found or unauthorized', 404));
            }

            // If status is 'Cancelled', also cancel billing
            if (visit_status === 'Cancelled') {
                // 1. Update Billing Master
                await client.query(`
                    UPDATE billing_master
                    SET 
                        status = 'Cancelled',
                        payment_status = 'Cancelled',
                        updated_by = $1,
                        updated_at = CURRENT_TIMESTAMP
                    WHERE opd_id = $2 AND branch_id = $3
                `, [staffCode, id, branch_id]);

                // 2. Update Bill Details
                await client.query(`
                    UPDATE bill_details
                    SET 
                        status = 'Cancelled',
                        is_cancelled = true,
                        cancelled_by = $1,
                        cancelled_at = CURRENT_TIMESTAMP,
                        updated_by = $1,
                        updated_at = CURRENT_TIMESTAMP
                    WHERE opd_id = $2 AND branch_id = $3
                `, [staffCode, id, branch_id]);
            }

            await client.query('COMMIT');

            res.status(200).json({
                status: 'success',
                message: `OPD status updated to ${visit_status} successfully`,
                data: { opdEntry: result.rows[0] }
            });
        } catch (error) {
            await client.query('ROLLBACK');
            console.error('Update OPD status error:', error);
            next(new AppError('Failed to update OPD status', 500));
        } finally {
            client.release();
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

            // 5. Queue Status (Today)
            const queueResult = await query(`
                SELECT COUNT(*) as queue_count
                FROM opd_entries
                WHERE branch_id = $1 AND visit_date = CURRENT_DATE
                AND visit_status IN ('Registered', 'In-consultation')
            `, [branch_id]);

            // 6. Financial Stats (Today)
            const financialResult = await query(`
                SELECT 
                    COALESCE(SUM(CAST(paid_amount AS DECIMAL)), 0) as collected_amount,
                    COUNT(CASE WHEN CAST(paid_amount AS DECIMAL) > 0 THEN 1 END) as collected_count,
                    COALESCE(SUM(CAST(total_amount AS DECIMAL) - COALESCE(CAST(paid_amount AS DECIMAL), 0)), 0) as pending_amount,
                    COUNT(CASE WHEN (CAST(total_amount AS DECIMAL) - COALESCE(CAST(paid_amount AS DECIMAL), 0)) > 0 THEN 1 END) as pending_count
                FROM billing_master 
                WHERE branch_id = $1 AND DATE(billing_date) = CURRENT_DATE AND status != 'Cancelled'
            `, [branch_id]);

            // 6. Yesterday's OPD Count (for growth comparison)
            const yesterdayOpdResult = await query(`
                SELECT COUNT(*) as count 
                FROM opd_entries 
                WHERE branch_id = $1 AND visit_date = (
                    SELECT MAX(visit_date) 
                    FROM opd_entries 
                    WHERE branch_id = $1 AND visit_date < CURRENT_DATE
                )
            `, [branch_id]);

            const finStats = financialResult.rows[0];
            const queueStats = queueResult.rows[0];

            res.status(200).json({
                status: 'success',
                data: {
                    stats: {
                        todayOpd: parseInt(opdResult.rows[0].count),
                        yesterdayOpd: parseInt(yesterdayOpdResult.rows[0].count),
                        newPatients: parseInt(patientsResult.rows[0].count),
                        todayAppointments: parseInt(apptResult.rows[0].count),
                        pendingOpd: parseInt(queueStats.queue_count || 0), // Queue (Registered + In-consultation)

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
     * Get today's OPD entries
     * GET /api/opd/today
     */
    static async getTodayOpdEntries(req, res, next) {
        try {
            const branch_id = req.user.branch_id;
            if (!branch_id) {
                return next(new AppError('Branch not linked to your account', 403));
            }

            const result = await query(`
                SELECT o.*, 
                       p.first_name as patient_first_name, p.last_name as patient_last_name, p.mrn_number, p.contact_number, p.age, p.gender, p.blood_group,
                       p.address as address_line1, p.address_line2, p.city, p.state, p.pincode, p.adhaar_number,
                       d.first_name as doctor_first_name, d.last_name as doctor_last_name, d.specialization,
                       dept.department_name
                FROM opd_entries o
                JOIN patients p ON o.patient_id = p.patient_id
                JOIN doctors d ON o.doctor_id = d.doctor_id
                LEFT JOIN departments dept ON o.department_id = dept.department_id
                WHERE o.branch_id = $1 AND o.visit_date = CURRENT_DATE
                ORDER BY o.visit_time DESC
            `, [branch_id]);

            res.status(200).json({
                status: 'success',
                data: { entries: result.rows }
            });
        } catch (error) {
            console.error('Get today OPD entries error:', error);
            next(new AppError('Failed to fetch today\'s OPD entries', 500));
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
                       d.first_name as doctor_first_name, d.last_name as doctor_last_name, d.specialization, d.registration_number as doctor_registration_number,
                       b.branch_name, CONCAT(b.address_line1, ', ', b.city) as branch_address, b.contact_number as branch_contact_number, b.email as branch_email, h.hospital_name
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
     * Update Vitals for an OPD Entry
     * PATCH /api/opd/:id/vitals
     * Accessible by Nurse, Doctor, Receptionist
     */
    static async updateVitals(req, res, next) {
        try {
            const { id } = req.params;
            const { vital_signs, notes } = req.body;

            if (!vital_signs || typeof vital_signs !== 'object') {
                return next(new AppError('vital_signs object is required', 400));
            }

            // Update the vital_signs JSONB field
            const result = await query(`
                UPDATE opd_entries 
                SET vital_signs = $1,
                    notes = CASE WHEN $2 IS NOT NULL THEN COALESCE(notes, '') || E'\n' || $2 ELSE notes END,
                    updated_at = CURRENT_TIMESTAMP
                WHERE opd_id = $3
                RETURNING opd_id, opd_number, patient_id, vital_signs, notes, updated_at
            `, [JSON.stringify(vital_signs), notes || null, id]);

            if (result.rows.length === 0) {
                return next(new AppError('OPD entry not found', 404));
            }

            res.status(200).json({
                status: 'success',
                message: 'Vitals updated successfully',
                data: { opdEntry: result.rows[0] }
            });
        } catch (error) {
            console.error('Update vitals error:', error);
            next(new AppError('Failed to update vitals', 500));
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

            // Fields that can be updated in OPD Entry
            const opdFields = [
                'payment_status', 'payment_method', 'consultation_fee',
                'visit_type', 'visit_date', 'visit_time',
                'symptoms', 'chief_complaint', 'vital_signs',
                'is_mlc', 'attender_name', 'attender_contact_number', 'mlc_remarks',
                'referral_hospital', 'referral_doctor_name'
            ];

            // Fields for Patient Update
            const patientFields = [
                'first_name', 'last_name', 'age', 'gender', 'contact_number', 'blood_group',
                'address_line_1', 'address_line_2', 'city', 'state', 'pincode', 'adhaar_number'
            ];

            // Intercept consultation_fee to store total (base + MLC) in database
            if (updates.consultation_fee !== undefined || updates.is_mlc !== undefined) {
                // Fetch current values to fill gaps
                const currentEntry = await query(`SELECT consultation_fee, is_mlc FROM opd_entries WHERE opd_id = $1`, [id]);
                if (currentEntry.rows.length > 0) {
                    const existingIsMlc = currentEntry.rows[0].is_mlc;
                    // Note: existing consultation_fee in DB is TOTAL. 
                    // But we expect frontend to send BASE fee in updates.consultation_fee.

                    const newIsMlc = updates.is_mlc !== undefined ? updates.is_mlc : existingIsMlc;
                    let baseFee = updates.consultation_fee !== undefined ? parseFloat(updates.consultation_fee || '0') : null;

                    if (baseFee === null) {
                        // If we are only updating is_mlc, we need the old base fee.
                        // We have to extract base fee from old total fee.
                        const oldTotal = parseFloat(currentEntry.rows[0].consultation_fee || '0');
                        let oldMlcFee = 0;
                        if (existingIsMlc) {
                            const branchRes = await query(`SELECT mlc_fee FROM branches WHERE branch_id = $1`, [branch_id]);
                            oldMlcFee = parseFloat(branchRes.rows[0]?.mlc_fee || '0');
                        }
                        baseFee = oldTotal - oldMlcFee;
                    }

                    let mlcFee = 0;
                    if (newIsMlc) {
                        const branchRes = await query(`SELECT mlc_fee FROM branches WHERE branch_id = $1`, [branch_id]);
                        mlcFee = parseFloat(branchRes.rows[0]?.mlc_fee || '0');
                    }

                    updates.consultation_fee = (baseFee + mlcFee).toString();

                    // 1.1 Synchronize with Billing if exist
                    const billRes = await query(`SELECT bill_master_id, total_amount, pending_amount, paid_amount FROM billing_master WHERE opd_id = $1`, [id]);
                    if (billRes.rows.length > 0) {
                        const billMaster = billRes.rows[0];
                        const billMasterId = billMaster.bill_master_id;

                        // Calculate difference for Consultation Fee
                        const consultationDetailRes = await query(
                            `SELECT bill_detail_id, final_price FROM bill_details WHERE bill_master_id = $1 AND service_type = 'consultation'`,
                            [billMasterId]
                        );

                        if (consultationDetailRes.rows.length > 0) {
                            const detail = consultationDetailRes.rows[0];
                            const oldConsFee = parseFloat(detail.final_price || '0');
                            const newConsFee = baseFee; // This is the base fee we want for 'consultation' item

                            if (oldConsFee !== newConsFee) {
                                // Update ONLY the consultation line item
                                await query(
                                    `UPDATE bill_details SET unit_price = $1, subtotal = $1, final_price = $1, updated_at = CURRENT_TIMESTAMP WHERE bill_detail_id = $2`,
                                    [newConsFee, detail.bill_detail_id]
                                );

                                // Calculate new master totals
                                const diff = newConsFee - oldConsFee;
                                const newTotal = parseFloat(billMaster.total_amount || '0') + diff;
                                const newPending = parseFloat(billMaster.pending_amount || '0') + diff;

                                // Update Master record
                                await query(
                                    `UPDATE billing_master SET total_amount = $1, pending_amount = $2, updated_at = CURRENT_TIMESTAMP WHERE bill_master_id = $3`,
                                    [newTotal, newPending, billMasterId]
                                );

                                console.log(`OPD Update: Adjusted Bill ${billMasterId} totals. Diff: ${diff}`);
                            }
                        }
                    }
                }
            }

            // 1. Update OPD Entry
            const opdUpdateValues = [];
            const opdQueryParts = [];
            let opdParamIndex = 1;

            for (const key of Object.keys(updates)) {
                if (opdFields.includes(key)) {
                    opdQueryParts.push(`${key} = $${opdParamIndex}`);
                    opdUpdateValues.push(updates[key]);
                    opdParamIndex++;
                }
            }

            let updatedOpdEntry = null;

            if (opdQueryParts.length > 0) {
                opdUpdateValues.push(id);
                opdUpdateValues.push(branch_id);

                const queryText = `
                    UPDATE opd_entries 
                    SET ${opdQueryParts.join(', ')}
                    WHERE opd_id = $${opdParamIndex} AND branch_id = $${opdParamIndex + 1}
                    RETURNING *
                `;

                const result = await query(queryText, opdUpdateValues);
                if (result.rows.length === 0) {
                    return next(new AppError('OPD entry not found or unauthorized', 404));
                }
                updatedOpdEntry = result.rows[0];
            } else {
                // Fetch the entry if no OPD updates, to ensure existence and get patient_id
                const existing = await query(`SELECT * FROM opd_entries WHERE opd_id = $1 AND branch_id = $2`, [id, branch_id]);
                if (existing.rows.length === 0) {
                    return next(new AppError('OPD entry not found or unauthorized', 404));
                }
                updatedOpdEntry = existing.rows[0];
            }

            // 2. Handle Patient Updates & Merging
            // Check if we need to switch patient_id (Merge Scenario)
            if (updates.patient_id && updatedOpdEntry.patient_id && updates.patient_id !== updatedOpdEntry.patient_id) {
                const oldPatientId = updatedOpdEntry.patient_id;
                const newPatientId = updates.patient_id;

                console.log(`Merging OPD ${id}: Switching from Patient ${oldPatientId} to ${newPatientId}`);

                // 2a. Update OPD entry to new patient_id
                await query(`UPDATE opd_entries SET patient_id = $1 WHERE opd_id = $2`, [newPatientId, id]);
                updatedOpdEntry.patient_id = newPatientId; // Update local obj

                // 2b. Check if old patient is "Orphaned" (No other OPDs, Appointments)
                // We only delete if it was a temporary/placeholder patient.
                // Safest check: Does this patient have ANY other records?
                // REFINEMENT: Also check if patient has a phone number. If yes, DO NOT DELETE.
                const dependencyCheck = await query(`
                    SELECT 
                        contact_number,
                        (SELECT COUNT(*) FROM opd_entries WHERE patient_id = $1) as opd_count,
                        (SELECT COUNT(*) FROM appointments WHERE patient_id = $1) as appt_count
                FROM patients WHERE patient_id = $1`, [oldPatientId]);

                const { opd_count, appt_count, contact_number } = dependencyCheck.rows[0];

                // If counts are 0 (since we already moved the current OPD entry away from it), it's safe to delete
                // BUT only if contact_number is empty/null (Temporary/Unknown patient).
                if (parseInt(opd_count) === 0 && parseInt(appt_count) === 0) {
                    if (!contact_number || contact_number.trim() === '') {
                        console.log(`Deleting orphan patient ${oldPatientId} (No Phone)`);
                        await query(`DELETE FROM patients WHERE patient_id = $1`, [oldPatientId]);
                    } else {
                        console.log(`Skipping deletion of orphan patient ${oldPatientId} because they have a phone number: ${contact_number}`);
                    }
                }
            }

            // 3. Update Patient Details (for whichever patient is NOW associated)
            if (updatedOpdEntry && updatedOpdEntry.patient_id) {
                const patientUpdateValues = [];
                const patientQueryParts = [];
                let patientParamIndex = 1;

                // Mapping helpers
                const mapField = (key) => {
                    if (key === 'address_line1') return 'address'; // DB column usually 'address'
                    if (key === 'address_line2') return 'address_line2';
                    return key;
                };

                for (const key of Object.keys(updates)) {
                    // Check if it's a patient field
                    if (['address_line1', 'address_line2', 'city', 'state', 'pincode', 'first_name', 'last_name', 'age', 'gender', 'contact_number', 'blood_group', 'adhaar_number'].includes(key)) {
                        const dbCol = mapField(key);
                        patientQueryParts.push(`${dbCol} = $${patientParamIndex}`);

                        // Sanitize empty strings to NULL
                        let val = updates[key];
                        if (typeof val === 'string' && val.trim() === '') {
                            val = null;
                        }

                        patientUpdateValues.push(val);
                        patientParamIndex++;
                    }
                }

                if (patientQueryParts.length > 0) {
                    patientUpdateValues.push(updatedOpdEntry.patient_id);
                    const patQuery = `
                        UPDATE patients 
                        SET ${patientQueryParts.join(', ')}
                        WHERE patient_id = $${patientParamIndex}
                    `;
                    await query(patQuery, patientUpdateValues);
                }
            }

            res.status(200).json({
                status: 'success',
                data: { opdEntry: updatedOpdEntry }
            });
        } catch (error) {
            console.error('Update OPD entry error:', error);
            // Return specific error message for debugging
            return res.status(500).json({
                status: 'error',
                message: error.message,
                detail: error.detail || error.toString()
            });
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

    /**
     * GET /api/opd/check-duplicate
     * Check if patient already has an OPD entry with this doctor on this date
     */
    static async checkDuplicate(req, res, next) {
        try {
            const { patient_id, doctor_id, visit_date } = req.query;

            if (!patient_id || !doctor_id || !visit_date) {
                return res.status(400).json({ status: 'fail', message: 'Missing parameters' });
            }

            const duplicateCheck = await query(
                `SELECT opd_id FROM opd_entries 
                 WHERE patient_id = $1 AND doctor_id = $2 AND visit_date = $3 
                 AND visit_status NOT IN ('Cancelled', 'Completed')`,
                [patient_id, doctor_id, visit_date]
            );

            if (duplicateCheck.rows.length > 0) {
                return res.status(200).json({
                    status: 'success',
                    exists: true,
                    message: 'Patient already registered with this doctor for today.'
                });
            }

            return res.status(200).json({
                status: 'success',
                exists: false
            });
        } catch (error) {
            console.error('Check duplicate error:', error);
            next(new AppError('Server Error', 500));
        }
    }
}

module.exports = OpdController;
