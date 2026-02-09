const BaseModel = require('./BaseModel');

class InsuranceClaim extends BaseModel {
    constructor() {
        super('insurance_claims', 'claim_id');
    }

    /**
     * Bulk create claims
     * @param {Array} claimsData 
     * @returns {Promise<Array>}
     */
    async createBulk(claimsData, branchId, hospitalId) {
        if (!claimsData || claimsData.length === 0) return [];

        const db = require('../config/db');
        const client = await db.getClient();

        try {
            await client.query('BEGIN');
            const results = [];

            // 1. Get existing approval numbers for this branch/hospital to prevent duplicates
            // We assume uniqueness is within the hospital or branch. Let's use hospital_id as scope if available, else branch.
            // Or better, check specific approval numbers in the batch.

            const incomingApprovals = claimsData
                .map(c => c.approval_no)
                .filter(Boolean); // Filter null/undefined

            let existingApprovals = new Set();

            if (incomingApprovals.length > 0) {
                // Fetch existing approvals from DB that match incoming ones
                const checkQuery = `
                    SELECT approval_no 
                    FROM insurance_claims 
                    WHERE approval_no = ANY($1) 
                    AND (hospital_id = $2 OR branch_id = $3)
                 `;
                const checkRes = await client.query(checkQuery, [incomingApprovals, hospitalId, branchId]);
                checkRes.rows.forEach(r => existingApprovals.add(r.approval_no));
            }

            const skipped = [];

            for (const claim of claimsData) {
                // SKIP if duplicate approval_no
                if (claim.approval_no && existingApprovals.has(claim.approval_no)) {
                    console.log(`Skipping duplicate claim with approval_no: ${claim.approval_no}`);
                    skipped.push(claim.approval_no);
                    continue;
                }

                // Add to set to prevent duplicates within the same batch
                if (claim.approval_no) {
                    existingApprovals.add(claim.approval_no);
                }

                const query = `
                    INSERT INTO insurance_claims (
                        s_no, ip_no, patient_name, doctor_name, approval_no, 
                        admission_date, discharge_date, department, insurance_name, 
                        bill_amount, advance_amount, co_pay, discount, 
                        approval_amount, amount_received, pending_amount, 
                        tds, bank_name, transaction_date, utr_no, remarks,
                        branch_id, hospital_id
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23)
                    RETURNING *
                `;

                const values = [
                    claim.s_no || null,
                    claim.ip_no || null,
                    claim.patient_name || null,
                    claim.doctor_name || null,
                    claim.approval_no || null,
                    claim.admission_date || null,
                    claim.discharge_date || null,
                    claim.department || null,
                    claim.insurance_name || null,
                    claim.bill_amount || 0,
                    claim.advance_amount || 0,
                    claim.co_pay || 0,
                    claim.discount || 0,
                    claim.approval_amount || 0,
                    claim.amount_received || 0,
                    claim.pending_amount || 0,
                    claim.tds || 0,
                    claim.bank_name || null,
                    claim.transaction_date || null,
                    claim.utr_no || null,
                    claim.remarks || null,
                    branchId || null,
                    hospitalId || null
                ];

                const res = await client.query(query, values);
                results.push(res.rows[0]);
            }

            await client.query('COMMIT');
            return { created: results, skipped: skipped };
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Get all claims
     * @returns {Promise<Array>}
     */
    async findAll() {
        return await super.findAll({}, { orderBy: 'claim_id DESC' });
    }
}

module.exports = new InsuranceClaim();
