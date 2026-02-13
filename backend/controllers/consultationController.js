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
        const client = await require('../config/db').pool.connect();
        try {
            await client.query('BEGIN');

            const {
                opd_id,
                patient_id,
                diagnosis,
                diagnosis_list,
                notes,
                next_visit_date,
                next_visit_status,
                medications,
                labs,
                referral_doctor_id,
                referral_notes,
                procedures,
                procedures_list,
                pathology_lab
            } = req.body;

            const doctor_id = req.user.doctor_id || req.body.doctor_id;

            if (!opd_id || !patient_id || !doctor_id) {
                throw new AppError('Missing required fields: opd_id, patient_id, doctor_id', 400);
            }

            // --- 0. PREP DATA & HELPERS ---
            // Fetch OPD details (needed branches, validation, billing header)
            const opdDetailsRes = await client.query(`
                SELECT o.branch_id, o.opd_number, 
                       p.first_name, p.last_name, p.mrn_number, p.contact_number, 
                       p.city, p.state, p.address
                FROM opd_entries o
                JOIN patients p ON o.patient_id = p.patient_id
                WHERE o.opd_id = $1
            `, [opd_id]);
            const opdData = opdDetailsRes.rows[0];
            if (!opdData) throw new AppError('OPD Entry not found', 404);
            const branch_id = opdData.branch_id;

            const user_id = req.user?.user_id || req.user?.userId || doctor_id; // Fallback to doctor_id if no user_id

            const safeInt = (val) => {
                if (val === undefined || val === null) return null;
                const converted = parseInt(val, 10);
                return isNaN(converted) ? null : converted;
            };

            const normalizeCategory = (category) => {
                const cat = (category || '').toLowerCase();
                if (cat.includes('lab') || cat === 'lab_test') return 'Lab';
                if (cat.includes('imag') || cat.includes('radio') || cat.includes('x-ray') || cat.includes('scan')) return 'Imaging';
                if (cat.includes('proc')) return 'Procedure';
                if (cat.includes('exam')) return 'Examination';
                return 'Other';
            };


            // --- 1. CLEANUP PREVIOUS DRAFTS ---
            // We'll delete related items to ensure a clean slate for the draft save
            // Note: We only delete items that are likely in a 'Pending'/'Draft' state associated with this OPD.
            // However, since this is "Save Draft" for a specific OPD interaction, we can assume ownership of these records for this opd_id.

            // Delete Consultation Outcome (Draft/Pending)
            await client.query(`DELETE FROM consultation_outcomes WHERE opd_id = $1 AND consultation_status IN ('Draft', 'Pending')`, [opd_id]);
            // Delete Prescriptions
            await client.query(`DELETE FROM prescriptions WHERE opd_id = $1`, [opd_id]);
            // Delete Lab Orders (only those created during draft/pending consultation)
            // We only delete 'Ordered' or 'Draft' status to avoid losing processed work
            await client.query(`DELETE FROM lab_orders WHERE opd_id = $1 AND status IN ('Ordered', 'Draft')`, [opd_id]);

            // Delete Billing (Only Draft bills for this OPD)
            const draftBills = await client.query(`
                SELECT bill_master_id 
                FROM billing_master 
                WHERE opd_id = $1 
                AND status = 'Pending' 
                AND (invoice_number = 'DRAFT' OR bill_number LIKE 'DRAFT-%')
            `, [opd_id]);
            for (const row of draftBills.rows) {
                await client.query(`DELETE FROM bill_details WHERE bill_master_id = $1`, [row.bill_master_id]);
            }
            await client.query(`
                DELETE FROM billing_master 
                WHERE opd_id = $1 
                AND status = 'Pending' 
                AND (invoice_number = 'DRAFT' OR bill_number LIKE 'DRAFT-%')
            `, [opd_id]);


            // --- 2. INSERT CONSULTATION OUTCOME (DRAFT) ---
            const outcomeResult = await client.query(`
                INSERT INTO consultation_outcomes (
                    opd_id, patient_id, doctor_id,
                    consultation_status, diagnosis, notes, labs, medications,
                    referral_doctor_id, referral_notes,
                    next_visit_date, next_visit_status,
                    procedures, diagnostic_center,
                    diagnosis_data, procedures_data
                ) VALUES ($1, $2, $3, 'Draft', $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
                RETURNING *
            `, [
                opd_id, patient_id, doctor_id,
                diagnosis, notes,
                JSON.stringify(labs || []),
                JSON.stringify(medications || []),
                referral_doctor_id || null,
                referral_notes || null,
                next_visit_date || null,
                next_visit_status,
                procedures || null,
                pathology_lab || null,
                JSON.stringify(diagnosis_list || []),
                JSON.stringify(procedures_list || [])
            ]);

            // --- 3. CREATE PRESCRIPTION (Active/Draft) ---
            let prescription_id = null;
            if ((medications && medications.length > 0) || (labs && labs.length > 0) || (procedures && procedures.length > 0)) {
                const presResult = await client.query(`
                    INSERT INTO prescriptions (
                        doctor_id, patient_id, branch_id, medications, notes, diagnosis, labs, procedures, status, opd_id
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'Pending', $9)
                    RETURNING prescription_id
                `, [doctor_id, patient_id, branch_id, JSON.stringify(medications || []), notes, diagnosis, JSON.stringify(labs || []), procedures || null, opd_id]);
                prescription_id = presResult.rows[0].prescription_id;

                // Update outcome with prescription_id
                await client.query(`UPDATE consultation_outcomes SET prescription_id = $1 WHERE outcome_id = $2`, [prescription_id, outcomeResult.rows[0].outcome_id]);
            }

            // --- 4. PROCESS BILLING ITEMS & LAB ORDERS ---
            let subtotal = 0;
            const billingItems = [];

            // 4a. Labs
            if (labs && labs.length > 0) {
                for (const lab of labs) {
                    const orderNumber = `LO-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
                    const normalizedCat = normalizeCategory(lab.category);
                    const isExternal = lab.source !== 'billing_setup_master';

                    await client.query(`
                        INSERT INTO lab_orders (
                            order_number, patient_id, doctor_id, branch_id, opd_id, prescription_id,
                            test_name, test_category, priority, status, ordered_at, notes, test_code, is_external
                        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'Routine', 'Ordered', NOW(), $9, $10, $11)
                    `, [
                        orderNumber, safeInt(patient_id), safeInt(doctor_id), safeInt(branch_id), safeInt(opd_id), safeInt(prescription_id),
                        lab.test_name || lab.service_name, normalizedCat, lab.notes || '', lab.code || null, isExternal
                    ]);

                    // Billing (Internal only)
                    const price = parseFloat(lab.price || 0);
                    if (price > 0) {
                        subtotal += price;
                        billingItems.push({
                            service_name: lab.test_name || lab.service_name,
                            service_type: 'lab_order',
                            service_category: lab.category || 'Laboratory',
                            quantity: 1, unit_price: price, subtotal: price, final_price: price,
                            description: lab.source === 'billing_setup_master' ? 'In House' : 'External'
                        });
                    }
                }
            }

            // 4b. Procedures
            if (procedures_list && procedures_list.length > 0) {
                for (const proc of procedures_list) {
                    // Create Lab Order (Procedure)
                    const orderNumber = `LO-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
                    const isExternal = proc.source !== 'billing_setup_master';
                    const normalizedCat = normalizeCategory(proc.category || 'Procedure');

                    await client.query(`
                        INSERT INTO lab_orders (
                            order_number, patient_id, doctor_id, branch_id, opd_id, prescription_id,
                            test_name, test_category, priority, status, ordered_at, notes, test_code, is_external
                        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'Routine', 'Ordered', NOW(), $9, $10, $11)
                    `, [
                        orderNumber, safeInt(patient_id), safeInt(doctor_id), safeInt(branch_id), safeInt(opd_id), safeInt(prescription_id),
                        proc.name || proc.service_name, normalizedCat, '', proc.code || null, isExternal
                    ]);

                    if (proc.price && parseFloat(proc.price) > 0) {
                        const price = parseFloat(proc.price);
                        subtotal += price;
                        billingItems.push({
                            service_name: proc.name || proc.service_name,
                            service_type: 'procedure',
                            service_category: normalizedCat,
                            quantity: 1, unit_price: price, subtotal: price, final_price: price,
                            description: proc.source === 'billing_setup_master' ? 'In House' : 'External'
                        });
                    }
                }
            }

            // 4c. Diagnosis
            if (diagnosis_list && diagnosis_list.length > 0) {
                for (const diag of diagnosis_list) {
                    // Create Lab Order (Diagnosis/Scan) - Only if it's a structured service object or has a name
                    if (diag.name || diag.service_name) {
                        const orderNumber = `LO-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
                        const isExternal = diag.source !== 'billing_setup_master';
                        const normalizedCat = normalizeCategory(diag.category || 'Diagnosis');

                        await client.query(`
                             INSERT INTO lab_orders (
                                 order_number, patient_id, doctor_id, branch_id, opd_id, prescription_id,
                                 test_name, test_category, priority, status, ordered_at, notes, test_code, is_external
                             ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'Routine', 'Ordered', NOW(), $9, $10, $11)
                         `, [
                            orderNumber, safeInt(patient_id), safeInt(doctor_id), safeInt(branch_id), safeInt(opd_id), safeInt(prescription_id),
                            diag.name || diag.service_name, normalizedCat, '', diag.code || null, isExternal
                        ]);
                    }

                    if (diag.price && parseFloat(diag.price) > 0) {
                        const price = parseFloat(diag.price);
                        subtotal += price;
                        billingItems.push({
                            service_name: diag.name || diag.service_name,
                            service_type: 'consultation',
                            service_category: normalizeCategory(diag.category || 'Diagnosis'),
                            quantity: 1, unit_price: price, subtotal: price, final_price: price,
                            description: diag.source === 'billing_setup_master' ? 'In House' : 'External'
                        });
                    }
                }
            }

            // --- 5. CREATE BILLING MASTER & DETAILS (DRAFT) ---
            if (billingItems.length > 0) {
                const billNumber = `DRAFT-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
                const patientName = `${opdData.first_name} ${opdData.last_name}`;
                const patientAddress = `${opdData.address || ''}, ${opdData.city || ''}`;

                const billRes = await client.query(`
                    INSERT INTO billing_master (
                        bill_number, invoice_number, opd_id, opd_number, branch_id, patient_id,
                        mrn_number, patient_name, patient_address, contact_number,
                        billing_date, subtotal_amount, total_amount, payment_mode, status, payment_status,
                        created_by
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), $11, $12, 'Cash', 'Pending', 'Unpaid', $13)
                    RETURNING bill_master_id
                `, [
                    billNumber, 'DRAFT', safeInt(opd_id), opdData.opd_number, safeInt(branch_id), safeInt(patient_id),
                    opdData.mrn_number, patientName, patientAddress, opdData.contact_number,
                    subtotal, subtotal, safeInt(user_id)
                ]);

                const billMasterId = billRes.rows[0].bill_master_id;

                for (const item of billingItems) {
                    await client.query(`
                        INSERT INTO bill_details (
                            bill_master_id, branch_id, department_id, opd_id, patient_id, mrn_number,
                            service_type, service_name, service_category, description,
                            quantity, unit_price, subtotal, final_price, status, created_by
                        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, 'Pending', $15)
                    `, [
                        safeInt(billMasterId), safeInt(branch_id), 1, safeInt(opd_id), safeInt(patient_id), opdData.mrn_number,
                        item.service_type, item.service_name, item.service_category, item.description,
                        item.quantity, item.unit_price, item.subtotal, item.final_price, safeInt(user_id)
                    ]);
                }
            }

            await client.query('COMMIT');
            res.status(200).json({
                status: 'success',
                message: 'Draft saved successfully',
                data: { draft: outcomeResult.rows[0] }
            });

        } catch (error) {
            await client.query('ROLLBACK');
            console.error('Save draft error:', error);
            next(new AppError('Failed to save draft', 500));
        } finally {
            client.release();
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
                WHERE opd_id = $1 AND consultation_status IN ('Draft', 'Pending')
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
                diagnosis_list,
                notes,
                next_visit_date,
                next_visit_status,
                medications,
                labs,
                referral_doctor_id,
                referral_notes,
                pathology_lab,
                procedures,
                procedures_list
            } = req.body;

            const doctor_id = req.user.doctor_id || req.body.doctor_id;

            if (!opd_id || !patient_id || !doctor_id) {
                throw new AppError('Missing required fields: opd_id, patient_id, doctor_id', 400);
            }

            // Delete any existing draft prescriptions
            // Delete any existing draft for this OPD
            await client.query(`
                DELETE FROM consultation_outcomes
                WHERE opd_id = $1 AND consultation_status IN ('Draft', 'Pending')
            `, [opd_id]);

            await client.query(`DELETE FROM prescriptions WHERE opd_id = $1`, [opd_id]);

            // Delete Draft Lab Orders for this OPD (created by Save Draft)
            await client.query(`DELETE FROM lab_orders WHERE opd_id = $1 AND status IN ('Ordered', 'Draft')`, [opd_id]);

            // Delete Pending Draft Bills for this OPD (created by Save Draft)
            const draftBills = await client.query(`
                SELECT bill_master_id 
                FROM billing_master 
                WHERE opd_id = $1 
                AND status = 'Pending' 
                AND (invoice_number = 'DRAFT' OR bill_number LIKE 'DRAFT-%')
            `, [opd_id]);
            for (const row of draftBills.rows) {
                await client.query(`DELETE FROM bill_details WHERE bill_master_id = $1`, [row.bill_master_id]);
            }
            await client.query(`
                DELETE FROM billing_master 
                WHERE opd_id = $1 
                AND status = 'Pending' 
                AND (invoice_number = 'DRAFT' OR bill_number LIKE 'DRAFT-%')
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

            const user_id = req.user?.user_id || req.user?.userId;
            if (!user_id) {
                throw new AppError('Critical Error: User ID not found in session', 401);
            }

            const patientName = `${opdData.first_name} ${opdData.last_name}`;
            const patientAddress = `${opdData.address || ''}, ${opdData.city || ''}, ${opdData.state || ''}`;

            const safeInt = (val) => {
                if (val === undefined || val === null) return null;
                const converted = parseInt(val, 10);
                return isNaN(converted) ? null : converted;
            };


            // 2. Create Prescription if medications or labs are provided
            // --- SAVE FINAL PRESCRIPTION ---
            let prescription_id = null;
            if ((medications && medications.length > 0) || (labs && labs.length > 0) || (procedures && procedures.length > 0)) {
                const presResult = await client.query(`
                    INSERT INTO prescriptions (
                        doctor_id, patient_id, branch_id, medications, notes, diagnosis, labs, procedures, status, opd_id
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'Active', $9)
                    RETURNING prescription_id
                `, [
                    doctor_id,
                    patient_id,
                    branch_id,
                    JSON.stringify(medications || []),
                    notes,
                    diagnosis,
                    JSON.stringify(labs || []),
                    procedures || null,
                    opd_id
                ]);

                prescription_id = presResult.rows[0].prescription_id;
            }

            const normalizeCategory = (category) => {
                const cat = (category || '').toLowerCase();
                if (cat.includes('lab') || cat === 'lab_test') return 'Lab';
                if (cat.includes('imag') || cat.includes('radio') || cat.includes('x-ray') || cat.includes('scan')) return 'Imaging';
                if (cat.includes('proc')) return 'Procedure';
                if (cat.includes('exam')) return 'Examination';
                return 'Other';
            };

            // 3. Process Billing Items (Labs, Procedures, Diagnosis)
            let subtotal = 0;
            const billingItems = [];

            // 3a. Labs: Create Lab Orders + Add to Billing
            if (labs && labs.length > 0) {
                for (const lab of labs) {
                    // Create Lab Order
                    const orderNumber = `LO-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
                    const normalizedCat = normalizeCategory(lab.category);

                    const isExternal = lab.source !== 'billing_setup_master';

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

                    // Add to billing only if price > 0
                    const price = parseFloat(lab.price || 0);
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
                            description: lab.source === 'billing_setup_master' ? 'In House' : 'External'
                        });
                    }
                }
            }

            // 3b. Procedures: Add to Billing & Lab Orders
            if (procedures_list && procedures_list.length > 0) {
                for (const proc of procedures_list) {
                    // Create Lab Order (Procedure)
                    const orderNumber = `LO-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
                    const isExternal = proc.source !== 'billing_setup_master';
                    const normalizedCat = normalizeCategory(proc.category || 'Procedure');

                    await client.query(`
                        INSERT INTO lab_orders (
                            order_number, patient_id, doctor_id, branch_id, opd_id, prescription_id,
                            test_name, test_category, priority, status, ordered_at, notes, test_code, is_external
                        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'Routine', 'Ordered', NOW(), $9, $10, $11)
                    `, [
                        orderNumber, safeInt(patient_id), safeInt(doctor_id), safeInt(branch_id), safeInt(opd_id), safeInt(prescription_id),
                        proc.name || proc.service_name, normalizedCat, '', proc.code || null, isExternal
                    ]);

                    if (proc.price && parseFloat(proc.price) > 0) {
                        const price = parseFloat(proc.price);
                        subtotal += price;
                        billingItems.push({
                            service_name: proc.name || proc.service_name,
                            service_type: 'procedure',
                            service_category: normalizedCat,
                            quantity: 1, unit_price: price, subtotal: price, final_price: price,
                            description: proc.source === 'billing_setup_master' ? 'In House' : 'External'
                        });
                    }
                }
            }

            // 3c. Diagnosis: Add to Billing & Lab Orders (if valid service)
            if (diagnosis_list && diagnosis_list.length > 0) {
                for (const diag of diagnosis_list) {
                    // Create Lab Order (Diagnosis/Scan)
                    if (diag.name || diag.service_name) {
                        const orderNumber = `LO-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
                        const isExternal = diag.source !== 'billing_setup_master';
                        const normalizedCat = normalizeCategory(diag.category || 'Diagnosis');

                        await client.query(`
                            INSERT INTO lab_orders (
                                order_number, patient_id, doctor_id, branch_id, opd_id, prescription_id,
                                test_name, test_category, priority, status, ordered_at, notes, test_code, is_external
                            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'Routine', 'Ordered', NOW(), $9, $10, $11)
                        `, [
                            orderNumber, safeInt(patient_id), safeInt(doctor_id), safeInt(branch_id), safeInt(opd_id), safeInt(prescription_id),
                            diag.name || diag.service_name, normalizedCat, '', diag.code || null, isExternal
                        ]);
                    }

                    if (diag.price && parseFloat(diag.price) > 0) {
                        const price = parseFloat(diag.price);
                        subtotal += price;
                        billingItems.push({
                            service_name: diag.name || diag.service_name,
                            service_type: 'consultation', // or diagnosis
                            service_category: normalizeCategory(diag.category || 'Diagnosis'),
                            quantity: 1,
                            unit_price: price,
                            subtotal: price,
                            final_price: price,
                            description: diag.source === 'billing_setup_master' ? 'In House' : 'External'
                        });
                    }
                }
            }


            // Create Billing Master if there are billable items
            if (billingItems.length > 0) {
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

                const billMasterId = billRes.rows[0].bill_master_id;

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
                        1, // Default department
                        safeInt(opd_id),
                        safeInt(patient_id),
                        opdData.mrn_number || 'UNKNOWN',
                        item.service_type,
                        item.service_name,
                        item.service_category,
                        item.description,
                        item.quantity,
                        item.unit_price,
                        item.subtotal,
                        item.final_price,
                        safeInt(user_id)
                    ]);
                }
            }

            // 4. Create Consultation Outcome
            let outcomeResult;
            try {
                outcomeResult = await client.query(`
                    INSERT INTO consultation_outcomes (
                        opd_id, patient_id, doctor_id, prescription_id,
                        consultation_status, diagnosis, notes,
                        next_visit_date, next_visit_status, labs,
                        referral_doctor_id, referral_notes,
                        diagnostic_center,
                        procedures,
                        diagnosis_data, procedures_data
                    ) VALUES ($1, $2, $3, $4, 'Completed', $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
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
                    pathology_lab || null,
                    procedures || null,
                    JSON.stringify(diagnosis_list || []),
                    JSON.stringify(procedures_list || [])
                ]);
            } catch (err) {
                console.error('Error inserting consultation outcome:', err);
                throw new AppError(`Failed to save consultation outcome: ${err.message}`, 500);
            }


            // 3. Update OPD Entry Status
            await client.query(`
                UPDATE opd_entries 
                SET visit_status = 'Completed' 
                WHERE opd_id = $1
            `, [opd_id]);

            // 4. Update Appointment Status to 'Completed'
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
