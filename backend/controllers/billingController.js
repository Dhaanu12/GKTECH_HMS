const { query, getClient } = require('../config/db');
const { AppError } = require('../middleware/errorHandler');

class BillingController {
    /**
     * Create a new Bill (Pay Now flow)
     * Creates billing_master and updates/creates billing_details
     */
    static async createBill(req, res, next) {
        const client = await getClient();
        try {
            await client.query('BEGIN');

            const {
                opd_id,
                opd_number,
                patient_id,
                mrn_number,
                patient_name,
                patient_address,
                contact_number,
                billing_date,
                payment_mode,
                items, // Array of bill items
                discount_type,
                discount_value,
                total_amount,
                paid_amount
            } = req.body;

            const branch_id = req.body.branch_id || req.user.branch_id;

            // Fetch Staff Code for created_by/updated_by
            const staffRes = await client.query(`SELECT staff_code FROM staff WHERE user_id = $1`, [req.user.user_id]);
            const staffCode = staffRes.rows[0]?.staff_code || req.user.username || 'SYSTEM';

            let bill_master_id;
            let invoice_number;
            let payment_status; // To return

            // Check if Billing Master already exists for this OPD (created during Registration)
            const existingBillQuery = await client.query(
                `SELECT bill_master_id, invoice_number, paid_amount FROM billing_master WHERE opd_id = $1`,
                [opd_id]
            );

            // Calculate pending amount
            const pending_amount = parseFloat(total_amount) - parseFloat(paid_amount || total_amount);
            payment_status = pending_amount <= 0 ? 'Paid' : (parseFloat(paid_amount) > 0 ? 'Partial' : 'Unpaid');

            if (existingBillQuery.rows.length > 0) {
                // UPDATE Existing Bill
                const existingBill = existingBillQuery.rows[0];
                bill_master_id = existingBill.bill_master_id;
                invoice_number = existingBill.invoice_number;

                // Update Master
                await client.query(`
                    UPDATE billing_master
                    SET 
                        total_amount = $1,
                        paid_amount = $2,
                        pending_amount = $3,
                        payment_mode = $4,
                        payment_status = $5,
                        status = 'Paid',
                        discount_type = $6,
                        discount_value = $7,
                        updated_by = $8,
                        updated_at = CURRENT_TIMESTAMP
                    WHERE bill_master_id = $9
                `, [
                    total_amount, paid_amount || total_amount, pending_amount,
                    payment_mode, payment_status,
                    discount_type || 'none', discount_value || 0,
                    staffCode, // updated_by
                    bill_master_id
                ]);

            } else {
                // CREATE New Bill (Fallback for old entries or direct billing)

                // 1. Generate Bill Number & Invoice Number
                const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
                const randomSuffix = Math.floor(1000 + Math.random() * 9000);
                const bill_number = `BILL-${dateStr}-${randomSuffix}`;

                // Generate Sequential Invoice Number
                const lastInvQuery = await client.query(
                    `SELECT invoice_number FROM billing_master WHERE invoice_number LIKE $1 ORDER BY bill_master_id DESC LIMIT 1`,
                    [`INV-${dateStr}-%`]
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
                invoice_number = `INV-${dateStr}-${nextInvSuffix.toString().padStart(4, '0')}`;

                const masterQuery = `
                    INSERT INTO billing_master (
                        bill_number, invoice_number, opd_id, opd_number, branch_id,
                        patient_id, mrn_number, patient_name, patient_address, contact_number,
                        billing_date, total_amount, paid_amount, pending_amount,
                        payment_mode, payment_status, status,
                        discount_type, discount_value, created_by
                    ) VALUES (
                        $1, $2, $3, $4, $5,
                        $6, $7, $8, $9, $10,
                        $11, $12, $13, $14,
                        $15, $16, 'Paid',
                        $17, $18, $19
                    ) RETURNING bill_master_id
                `;

                const masterValues = [
                    bill_number, invoice_number, opd_id, opd_number, branch_id,
                    patient_id, mrn_number, patient_name, patient_address, contact_number,
                    billing_date || new Date(), total_amount, paid_amount || total_amount, pending_amount,
                    payment_mode, payment_status,
                    discount_type || 'none', discount_value || 0, staffCode // created_by
                ];

                const masterResult = await client.query(masterQuery, masterValues);
                bill_master_id = masterResult.rows[0].bill_master_id;
            }

            // 3. Process Bill Items (Billing Details)
            if (items && items.length > 0) {
                for (const item of items) {
                    // Check if item already exists (e.g. created during Registration or Pay Later flow)
                    // If it has bill_detail_id, update it. Else insert new.
                    if (item.bill_detail_id) {
                        await client.query(`
                            UPDATE bill_details 
                            SET bill_master_id = $1, status = 'Paid', updated_by = $3, updated_at = CURRENT_TIMESTAMP
                            WHERE bill_detail_id = $2
                        `, [bill_master_id, item.bill_detail_id, staffCode]);
                    } else {
                        // Check if an item exists for this OPD with same service to avoid duplicates if ID was missing
                        const distinctCheck = await client.query(`
                            SELECT bill_detail_id FROM bill_details 
                            WHERE opd_id = $1 AND service_type = $2 AND status = 'Pending'
                         `, [opd_id, item.service_type || 'consultation']);

                        if (distinctCheck.rows.length > 0) {
                            // Update the first matching pending item
                            await client.query(`
                                UPDATE bill_details 
                                SET bill_master_id = $1, status = 'Paid', updated_by = $3, updated_at = CURRENT_TIMESTAMP
                                WHERE bill_detail_id = $2
                            `, [bill_master_id, distinctCheck.rows[0].bill_detail_id, staffCode]);
                        } else {
                            await client.query(`
                                INSERT INTO bill_details (
                                    bill_master_id, branch_id, department_id, patient_id, mrn_number, opd_id,
                                    service_type, service_name, quantity, unit_price, subtotal, final_price, status,
                                    created_by
                                ) VALUES (
                                    $1, $2, $3, $4, $5, $6,
                                    $7, $8, $9, $10, $11, $12, 'Paid',
                                    $13
                                )
                            `, [
                                bill_master_id, branch_id, item.department_id || 0, patient_id, mrn_number, opd_id,
                                item.service_type || 'consultation', item.service_name, item.quantity || 1,
                                item.unit_price, item.subtotal, item.final_price,
                                staffCode // created_by
                            ]);
                        }
                    }
                }
            }

            // 4. Update OPD Payment Status
            if (payment_status === 'Paid') {
                await client.query(`
                    UPDATE opd_entries SET payment_status = 'Paid' WHERE opd_id = $1
                `, [opd_id]);
            }

            await client.query('COMMIT');

            res.status(201).json({
                status: 'success',
                message: 'Bill processed successfully',
                data: {
                    bill_master_id,
                    invoice_number,
                    status: payment_status
                }
            });

        } catch (error) {
            await client.query('ROLLBACK');
            console.error('Create Bill Error:', error);
            next(new AppError('Failed to create bill', 500));
        } finally {
            client.release();
        }
    }

    /**
     * Get Bills (List View)
     */
    static async getBills(req, res, next) {
        try {
            const branch_id = req.user.branch_id;
            const { search, startDate, endDate, status } = req.query;

            let queryText = `
                SELECT 
                    bm.*,
                    d.first_name || ' ' || d.last_name as doctor_name,
                    dep.department_name
                FROM billing_master bm
                LEFT JOIN opd_entries oe ON bm.opd_id = oe.opd_id
                LEFT JOIN doctors d ON oe.doctor_id = d.doctor_id
                LEFT JOIN departments dep ON oe.department_id = dep.department_id
                WHERE bm.branch_id = $1
            `;
            const params = [branch_id];

            if (startDate) {
                params.push(startDate);
                queryText += ` AND bm.billing_date >= $${params.length}`;
            }
            if (endDate) {
                params.push(endDate);
                queryText += ` AND bm.billing_date <= $${params.length}`;
            }
            if (status) {
                params.push(status);
                queryText += ` AND bm.status = $${params.length}`;
            }
            if (search) {
                const searchLower = `%${search.toLowerCase()}%`;
                params.push(searchLower);
                queryText += ` AND (
                    LOWER(bm.patient_name) LIKE $${params.length} OR
                    LOWER(bm.invoice_number) LIKE $${params.length} OR
                    LOWER(bm.mrn_number) LIKE $${params.length} OR
                    bm.contact_number LIKE $${params.length}
                )`;
            }

            queryText += ` ORDER BY bm.created_at DESC LIMIT 100`;

            const result = await query(queryText, params);

            res.status(200).json({
                status: 'success',
                data: { bills: result.rows }
            });

        } catch (error) {
            console.error('Get Bills Error:', error);
            next(new AppError('Failed to fetch bills', 500));
        }
    }

    /**
     * Get Pending Clearances (Pending Bills)
     */
    static async getPendingClearances(req, res, next) {
        try {
            const branch_id = req.user.branch_id;

            // Fetch Pending Bills from Billing Master
            // We also want to include relevant patient and doctor details
            const result = await query(`
                SELECT 
                    bm.bill_master_id,
                    bm.bill_number,
                    bm.invoice_number,
                    bm.opd_id,
                    bm.opd_number,
                    bm.patient_id,
                    bm.mrn_number,
                    bm.patient_name,
                    bm.contact_number,
                    bm.total_amount as total_pending_amount,
                    bm.billing_date,
                    bm.created_at,
                    oe.token_number,
                    oe.visit_date,
                    p.age,
                    p.gender,
                    d.first_name || ' ' || d.last_name as doctor_name,
                    dep.department_name,
                    (SELECT COUNT(*) FROM bill_details bd WHERE bd.bill_master_id = bm.bill_master_id) as pending_items_count
                FROM billing_master bm
                JOIN opd_entries oe ON bm.opd_id = oe.opd_id
                JOIN patients p ON bm.patient_id = p.patient_id
                LEFT JOIN doctors d ON oe.doctor_id = d.doctor_id
                LEFT JOIN departments dep ON oe.department_id = dep.department_id
                WHERE 
                    bm.branch_id = $1 
                    AND bm.status = 'Pending'
                ORDER BY bm.created_at DESC
            `, [branch_id]);

            res.status(200).json({
                status: 'success',
                data: { pending: result.rows }
            });

        } catch (error) {
            console.error('Get Pending Clearances Error:', error);
            next(new AppError('Failed to fetch pending clearances', 500));
        }
    }

    /**
     * Get Single Bill by ID (for Invoice)
     */
    static async getBillById(req, res, next) {
        try {
            const { id } = req.params;

            // Master
            const masterResult = await query(`
                SELECT bm.*, oe.token_number
                FROM billing_master bm
                LEFT JOIN opd_entries oe ON bm.opd_id = oe.opd_id
                WHERE bm.bill_master_id = $1
            `, [id]);

            if (masterResult.rows.length === 0) {
                return next(new AppError('Bill not found', 404));
            }

            const billMaster = masterResult.rows[0];

            // Details
            const detailsResult = await query(`
                SELECT * FROM bill_details WHERE bill_master_id = $1
            `, [id]);

            res.status(200).json({
                status: 'success',
                data: {
                    bill: billMaster,
                    items: detailsResult.rows
                }
            });

        } catch (error) {
            console.error('Get Bill By ID Error:', error);
            next(new AppError('Failed to fetch bill details', 500));
        }
    }

    /**
     * Get Pending Bill Items for OPD (Pay Later items)
     */
    static async getPendingBillItems(req, res, next) {
        try {
            const { opd_id } = req.params;

            const result = await query(`
                SELECT * FROM bill_details 
                WHERE opd_id = $1 AND status = 'Pending' AND bill_master_id IS NULL
            `, [opd_id]);

            res.status(200).json({
                status: 'success',
                data: { items: result.rows }
            });

        } catch (error) {
            console.error('Get Pending Items Error:', error);
            next(new AppError('Failed to fetch pending items', 500));
        }
    }
}

module.exports = BillingController;
