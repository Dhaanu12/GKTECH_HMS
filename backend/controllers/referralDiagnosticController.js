const { query } = require('../config/db');
const { AppError } = require('../middleware/errorHandler');

class ReferralDiagnosticController {
    /**
     * Create referral diagnostic
     * POST /api/referrals/diagnostics
     */
    static async createReferralDiagnostic(req, res, next) {
        try {
            const {
                diagnostic_name, diagnostic_address, city, state,
                phone_number, email, diagnostic_type, services
            } = req.body;

            console.log('🏥 Creating referral diagnostic:', diagnostic_name);

            const diagnosticSql = `
                INSERT INTO referral_diagnostics (
                    diagnostic_name, diagnostic_address, city, state,
                    phone_number, email, diagnostic_type, services, created_by
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                RETURNING *
            `;

            const diagnosticResult = await query(diagnosticSql, [
                diagnostic_name, diagnostic_address, city, state,
                phone_number, email, diagnostic_type, services, req.user.user_id
            ]);

            const newDiagnostic = diagnosticResult.rows[0];
            console.log('✅ Diagnostic created with ID:', newDiagnostic.referral_diagnostic_id);

            // Get branch_id for mapping
            let branch_id = null;
            try {
                const staffQuery = `
                    SELECT sb.branch_id 
                    FROM staff s
                    JOIN staff_branches sb ON s.staff_id = sb.staff_id
                    WHERE s.user_id = $1 
                    LIMIT 1
                `;
                const staffResult = await query(staffQuery, [req.user.user_id]);
                branch_id = staffResult.rows[0]?.branch_id;
            } catch (staffError) {
                console.error('❌ Staff query error:', staffError.message);
                try {
                    const altQuery = `SELECT branch_id FROM staff WHERE user_id = $1 LIMIT 1`;
                    const altResult = await query(altQuery, [req.user.user_id]);
                    branch_id = altResult.rows[0]?.branch_id;
                } catch (altError) {
                    console.error('❌ Alternative query also failed:', altError.message);
                }
            }

            if (branch_id) {
                const mappingSql = `
                    INSERT INTO referral_diagnostic_mapping (
                        branch_id, referral_diagnostic_id, created_by
                    ) VALUES ($1, $2, $3)
                    ON CONFLICT (branch_id, referral_diagnostic_id) DO NOTHING
                    RETURNING *
                `;
                await query(mappingSql, [branch_id, newDiagnostic.referral_diagnostic_id, req.user.user_id]);
            }

            res.status(201).json({
                status: 'success',
                message: 'Referral diagnostic created and mapped to your branch',
                data: { referralDiagnostic: newDiagnostic }
            });
        } catch (error) {
            console.error('❌ Create referral diagnostic error:', error);
            next(new AppError('Failed to create referral diagnostic', 500));
        }
    }

    /**
     * Get all referral diagnostics
     * GET /api/referrals/diagnostics
     */
    static async getReferralDiagnostics(req, res, next) {
        try {
            const diagnosticsSql = `
                SELECT * FROM referral_diagnostics
                WHERE is_active = TRUE
                ORDER BY diagnostic_name ASC
            `;

            const result = await query(diagnosticsSql);

            res.status(200).json({
                status: 'success',
                data: { referralDiagnostics: result.rows }
            });
        } catch (error) {
            console.error('Get referral diagnostics error:', error);
            next(new AppError('Failed to get referral diagnostics', 500));
        }
    }

    /**
     * Update referral diagnostic
     * PATCH /api/referrals/diagnostics/:id
     */
    static async updateReferralDiagnostic(req, res, next) {
        try {
            const { id } = req.params;
            const {
                diagnostic_name, diagnostic_address, city, state,
                phone_number, email, diagnostic_type, services
            } = req.body;

            const sql = `
                UPDATE referral_diagnostics SET
                    diagnostic_name = COALESCE($1, diagnostic_name),
                    diagnostic_address = COALESCE($2, diagnostic_address),
                    city = COALESCE($3, city),
                    state = COALESCE($4, state),
                    phone_number = COALESCE($5, phone_number),
                    email = COALESCE($6, email),
                    diagnostic_type = COALESCE($7, diagnostic_type),
                    services = COALESCE($8, services),
                    updated_at = CURRENT_TIMESTAMP
                WHERE referral_diagnostic_id = $9
                RETURNING *
            `;

            const result = await query(sql, [
                diagnostic_name, diagnostic_address, city, state,
                phone_number, email, diagnostic_type, services, id
            ]);

            if (result.rows.length === 0) {
                return next(new AppError('Referral diagnostic not found', 404));
            }

            res.status(200).json({
                status: 'success',
                message: 'Referral diagnostic updated successfully',
                data: { referralDiagnostic: result.rows[0] }
            });
        } catch (error) {
            console.error('Update referral diagnostic error:', error);
            next(new AppError('Failed to update referral diagnostic', 500));
        }
    }

    /**
     * Delete referral diagnostic
     * DELETE /api/referrals/diagnostics/:id
     */
    static async deleteReferralDiagnostic(req, res, next) {
        try {
            const { id } = req.params;

            const sql = `
                UPDATE referral_diagnostics 
                SET is_active = FALSE
                WHERE referral_diagnostic_id = $1
                RETURNING *
            `;

            const result = await query(sql, [id]);

            if (result.rows.length === 0) {
                return next(new AppError('Referral diagnostic not found', 404));
            }

            res.status(200).json({
                status: 'success',
                message: 'Referral diagnostic deleted successfully'
            });
        } catch (error) {
            console.error('Delete referral diagnostic error:', error);
            next(new AppError('Failed to delete referral diagnostic', 500));
        }
    }
}

module.exports = ReferralDiagnosticController;
