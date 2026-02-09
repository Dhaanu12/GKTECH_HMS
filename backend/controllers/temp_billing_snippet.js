
    /**
     * Get Pending Bill Items for OPD (to populate Process Bill)
     * GET /api/billing/pending/:opd_id
     */
    static async getPendingBillItems(req, res, next) {
    try {
        const { opd_id } = req.params;
        const branch_id = req.user.branch_id;

        // Fetch patient & caretaker details first
        const patientRes = await query(`
                SELECT p.contact_number, p.emergency_contact_number, p.emergency_contact_name
                FROM opd_entries oe
                JOIN patients p ON oe.patient_id = p.patient_id
                WHERE oe.opd_id = $1
            `, [opd_id]);

        const patientInfo = patientRes.rows[0];

        // Fetch Pending Items
        const result = await query(`
                SELECT 
                    bd.*,
                    d.department_name
                FROM bill_details bd
                LEFT JOIN departments d ON bd.department_id = d.department_id
                WHERE bd.opd_id = $1 AND bd.status = 'Pending' AND bd.is_cancelled = false
                ORDER BY bd.created_at ASC
            `, [opd_id]);

        res.status(200).json({
            status: 'success',
            data: {
                items: result.rows,
                caretaker_phone: patientInfo?.emergency_contact_number,
                patient_phone: patientInfo?.contact_number
            }
        });

    } catch (error) {
        console.error('Get Pending Items Error:', error);
        next(new AppError('Failed to fetch pending items', 500));
    }
}

    /**
     * Cancel Bill Item
     * POST /api/billing/cancel-item
     */
    static async cancelBillItem(req, res, next) {
    const client = await getClient();
    try {
        await client.query('BEGIN');
        const { bill_detail_id, cancellation_reason } = req.body;
        const user_id = req.user.user_id;

        // 1. Verify Item Exists & is Cancellable
        const itemQuery = await client.query(`
                SELECT * FROM bill_details WHERE bill_detail_id = $1
            `, [bill_detail_id]);

        if (itemQuery.rows.length === 0) {
            throw new AppError('Item not found', 404);
        }

        const item = itemQuery.rows[0];

        if (!item.is_cancellable) {
            throw new AppError('This item cannot be cancelled', 400);
        }

        if (item.status === 'Paid') {
            throw new AppError('Cannot cancel paid items', 400);
        }

        // 2. Mark as Cancelled
        await client.query(`
                UPDATE bill_details
                SET 
                    is_cancelled = true,
                    status = 'Cancelled',
                    cancelled_by = $2,
                    cancellation_reason = $3,
                    cancelled_at = CURRENT_TIMESTAMP,
                    final_price = 0,
                    subtotal = 0,
                    updated_at = CURRENT_TIMESTAMP
                WHERE bill_detail_id = $1
            `, [bill_detail_id, user_id, cancellation_reason]);

        await client.query('COMMIT');

        res.status(200).json({
            status: 'success',
            message: 'Item cancelled successfully'
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Cancel Item Error:', error);
        next(error instanceof AppError ? error : new AppError('Failed to cancel item', 500));
    } finally {
        client.release();
    }
}
