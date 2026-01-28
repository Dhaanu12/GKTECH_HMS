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
        
        // This is a simplified bulk insert. For large datasets, a transaction and prepared statement would be better.
        // For now, we'll iterate and create (or use a helper if BaseModel supports it, but standard BaseModel usually does single inserts).
        // Let's implement a transaction-based bulk insert manually here for efficiency.
        
        const db = require('../config/db');
        const client = await db.getClient();
        
        try {
            await client.query('BEGIN');
            const results = [];
            
            for (const claim of claimsData) {
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
            return results;
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
