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
                referral_notes,
                pathology_lab // For external diagnostic center
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

            // 1. Fetch details needed for Labs and Billing
            const opdDetailsRes = await client.query(`
                SELECT o.branch_id, o.opd_number, 
                       p.first_name, p.last_name, p.mrn_number, p.contact_number, 
                       p.city, p.state, p.address
                FROM opd_entries o
                JOIN patients p ON o.patient_id = p.patient_id
                WHERE o.opd_id = $1
            `, [opd_id]);

            const opdData = opdDetailsRes.rows[0];

            if (!opdData) {
                throw new AppError('OPD Entry not found or Patient missing', 404);
            }

            const branch_id = opdData.branch_id;
            if (!branch_id) {
                throw new AppError('Critical Error: OPD Entry missing branch_id', 500);
            }
            if (!doctor_id) {
                throw new AppError('Critical Error: Missing Doctor ID in request or token', 400);
            }

            const user_id = req.user?.user_id || req.user?.userId; // Handle both naming conventions
            if (!user_id) {
                // Fallback: If no user_id found (rare), use a system user or throw error?
                // For now, throw error as it's required for audit trails (created_by)
                throw new AppError('Critical Error: User ID not found in session', 401);
            }

            const patientName = `${opdData.first_name} ${opdData.last_name}`;
            const patientAddress = `${opdData.address || ''}, ${opdData.city || ''}, ${opdData.state || ''}`;

            // Helper to handle potentially undefined values for SQL
            const safeInt = (val) => {
                if (val === undefined || val === null) return null;
                const converted = parseInt(val, 10);
                return isNaN(converted) ? null : converted;
            };

            // 2. Create Prescription if medications or labs are provided
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
                `, [doctor_id, patient_id, branch_id, JSON.stringify(medications || []), notes, diagnosis, JSON.stringify(labs || [])]);

                prescription_id = presResult.rows[0].prescription_id;
            }

            // Helper function to normalize category to valid DB values
            const normalizeCategory = (category) => {
                const cat = (category || '').toLowerCase();
                if (cat.includes('lab') || cat === 'lab_test') return 'Lab';
                if (cat.includes('imag') || cat.includes('radio') || cat.includes('x-ray')) return 'Imaging';
                if (cat.includes('proc')) return 'Procedure';
                if (cat.includes('exam')) return 'Examination';
                return 'Other';
            };

            // 3. Process Lab Orders & Billing
            let billMasterId = null;
            if (labs && labs.length > 0) {
                // Calculate Totals
                let subtotal = 0;
                const billingItems = [];

                for (const lab of labs) {
                    // Create Lab Order
                    const orderNumber = `LO-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

                    const normalizedCat = normalizeCategory(lab.category);
                    console.log(`[LAB ORDER] Category: "${lab.category}" -> "${normalizedCat}"`);


                    // Determine if external: TRUE for medical_service, FALSE for billing_master
                    const isExternal = lab.source !== 'billing_master'; // Default to TRUE (external) if not specified

                    await client.query(`
                        INSERT INTO lab_orders (
                            order_number, patient_id, doctor_id, branch_id, opd_id, prescription_id,
                            test_name, test_category, priority, status, ordered_at, notes, test_code, is_external
                        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'Routine', 'Ordered', NOW(), $9, $10, $11)
                    `, [
                        orderNumber,
                        safeInt(patient_id),
                        safeInt(doctor_id),
                        safeInt(branch_id),
                        safeInt(opd_id),
                        safeInt(prescription_id),
                        lab.test_name || lab.service_name,
                        normalizedCat,
                        lab.notes || '',
                        lab.code || null,
                        isExternal
                    ]);

                    // Prepare Billing Item (ONLY FOR IN_HOUSE LABS)
                    const price = parseFloat(lab.price || 0);

                    // Determine description based on source
                    const isInternal = lab.source === 'billing_master';
                    const description = isInternal ? 'In House' : 'External';

                    // Prepare Billing Item if price is valid
                    if (price > 0) {
                        subtotal += price;
                        billingItems.push({
                            service_name: lab.test_name || lab.service_name,
                            service_type: 'lab_order',
                            service_category: lab.category || 'Laboratory',
                            quantity: 1,
                            unit_price: price,
                            subtotal: price,
                            final_price: price,
                            description: description
                        });
                    }
                }

                // Create Billing Master if there are billable items
                if (subtotal > 0) {
                    const billNumber = `BILL-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
                    const invoiceNumber = `INV-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

                    const billRes = await client.query(`
                        INSERT INTO billing_master (
                            bill_number, invoice_number, opd_id, opd_number, branch_id, patient_id,
                            mrn_number, patient_name, patient_address, contact_number,
                            billing_date, subtotal_amount, total_amount, payment_mode, status, payment_status,
                            created_by
                        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), $11, $12, 'Cash', 'Pending', 'Unpaid', $13)
                        RETURNING bill_master_id
                    `, [
                        billNumber,
                        invoiceNumber,
                        safeInt(opd_id),
                        opdData.opd_number || 'UNKNOWN',
                        safeInt(branch_id),
                        safeInt(patient_id),
                        opdData.mrn_number || 'UNKNOWN',
                        patientName || 'Unknown Patient',
                        patientAddress || '',
                        opdData.contact_number || '',
                        subtotal,
                        subtotal,
                        safeInt(user_id)
                    ]);

                    billMasterId = billRes.rows[0].bill_master_id;

                    // Insert Bill Details
                    for (const item of billingItems) {
                        await client.query(`
                            INSERT INTO bill_details (
                                bill_master_id, branch_id, department_id, opd_id, patient_id, mrn_number,
                                service_type, service_name, service_category, description,
                                quantity, unit_price, subtotal, final_price, status, created_by
                            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, 'Pending', $15)
                        `, [
                            safeInt(billMasterId),
                            safeInt(branch_id),
                            1, // Default department_id - Lab/Diagnostic department
                            safeInt(opd_id),
                            safeInt(patient_id),
                            opdData.mrn_number || 'UNKNOWN',
                            item.service_type,
                            item.service_name,
                            item.service_category,
                            item.description || 'In House', // 'In House' or 'External'
                            item.quantity,
                            item.unit_price,
                            item.subtotal,
                            item.final_price,
                            safeInt(user_id)
                        ]);
                    }
                }
            }

            // 4. Create Consultation Outcome
            // 4. Create Consultation Outcome
            let outcomeResult;
            try {
                outcomeResult = await client.query(`
                    INSERT INTO consultation_outcomes (
                        opd_id, patient_id, doctor_id, prescription_id,
                        consultation_status, diagnosis, notes,
                        next_visit_date, next_visit_status, labs,
                        referral_doctor_id, referral_notes,
                        diagnostic_center
                    ) VALUES ($1, $2, $3, $4, 'Completed', $5, $6, $7, $8, $9, $10, $11, $12)
                    RETURNING *
                `, [
                    safeInt(opd_id),
                    safeInt(patient_id),
                    safeInt(doctor_id),
                    prescription_id,
                    diagnosis || '',
                    notes || '',
                    next_visit_date || null,
                    next_visit_status || 'Follow-up Required',
                    JSON.stringify(labs || []),
                    safeInt(referral_doctor_id),
                    referral_notes || null,
                    pathology_lab || null
                ]);
            } catch (err) {
                console.error('Error inserting consultation outcome:', err);
                throw new AppError(`Failed to save consultation outcome: ${err.message}`, 500);
            }

            // 5. Update OPD Entry Status & Clear Drafts... (Rest of function)

            // Delete any existing draft for this OPD (Moved to start usually, but fine here if transaction holds)
            // Wait, existing code had delete at start. I should keep it or ensure order.
            // I'll assume usage of existing delete at line 173-176 covered by previous steps if I kept it?
            // Actually, I am replacing lines 178-193 mostly.
            // The original code deleted draft at line 173. My replacement starts there?
            // No, my replacement starts at line ~182: "const opdResult = await client.query..."
            // I should check strict line numbers.

            // Wait, I am replacing lines 178-193 AND injecting new logic.
            // The existing code at 178-193 was just prescription creation.
            // So I am replacing that block with my expanded block.

            // Need to match context exactly.

            // Original line 173: await client.query... DELETE FROM consultation_outcomes...
            // Original line 178: // 1. Create Prescription...

            // So my replacement effectively handles prescription + labs + billing.

            // Wait, I need to check if I broke the flow.
            // My replacement ends before "const outcomeResult = await client.query..."
            // Which is line 196 in original.

            // So I should replace lines 178 to 193 with my new logic.
            // And I included "4. Create Consultation Outcome" in my replacement content, which duplicates line 196+
            // Ah, I need to be careful.

            // Let's look at what I am targeting.
            // I am targeting lines 178 to 204?
            // No, I want to replace the Prescription creation part and insert Lab/Billing before Outcome creation.

            // Original:
            // 178: // 1. Create Prescription...
            // ...
            // 193: }
            // 195: // 2. Create Consultation Outcome

            // So I will replace from line 178 to 193.
            // And insert my logic there.

            // BUT, my replacement content includes:
            // "4. Create Consultation Outcome" ...
            // That means I am duplicating the outcome creation if I don't remove the original.

            // Better strategy: Replace the whole block from 178 to 204.
            // But 196-204 is the outcome creation.

            // Let's rewrite the Instruction to be precise.



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
