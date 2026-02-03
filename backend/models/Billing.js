const BaseModel = require('./BaseModel');

class Billing extends BaseModel {
    constructor() {
        super('billings', 'bill_id');
    }

    /**
     * Find billing by bill number
     * @param {String} billNumber
     * @returns {Promise<Object|null>}
     */
    async findByNumber(billNumber) {
        return await this.findOne({ bill_number: billNumber });
    }

    /**
     * Get billings by patient
     * @param {Number} patientId
     * @returns {Promise<Array>}
     */
    async findByPatient(patientId) {
        return await this.findAll({ patient_id: patientId }, { orderBy: 'bill_date DESC, created_at DESC' });
    }

    /**
     * Get billings by branch
     * @param {Number} branchId
     * @param {String} fromDate - Optional from date
     * @param {String} toDate - Optional to date
     * @returns {Promise<Array>}
     */
    async findByBranch(branchId, fromDate = null, toDate = null) {
        if (fromDate && toDate) {
            const query = `
        SELECT * FROM billings
        WHERE branch_id = $1 AND bill_date BETWEEN $2 AND $3
        ORDER BY bill_date DESC
      `;
            const result = await this.executeQuery(query, [branchId, fromDate, toDate]);
            return result.rows;
        }
        return await this.findAll({ branch_id: branchId }, { orderBy: 'bill_date DESC' });
    }

    /**
     * Get billings by status
     * @param {String} status
     * @returns {Promise<Array>}
     */
    async findByStatus(status) {
        return await this.findAll({ bill_status: status }, { orderBy: 'bill_date DESC' });
    }

    /**
     * Get billing with items
     * @param {Number} billId
     * @returns {Promise<Object|null>}
     */
    async findWithItems(billId) {
        const query = `
      SELECT 
        b.*,
        p.first_name as patient_first_name, p.last_name as patient_last_name, p.mrn_number,
        br.branch_name,
        json_agg(
          json_build_object(
            'bill_item_id', bi.bill_item_id,
            'item_code', bi.item_code,
            'quantity', bi.quantity,
            'unit_price', bi.unit_price,
            'item_total', bi.item_total,
            'service_name', s.service_name,
            'service_category', s.service_category
          )
        ) as items
      FROM billings b
      LEFT JOIN patients p ON b.patient_id = p.patient_id
      LEFT JOIN branches br ON b.branch_id = br.branch_id
      LEFT JOIN billing_items bi ON b.bill_id = bi.bill_id
      LEFT JOIN services s ON bi.service_id = s.service_id
      WHERE b.bill_id = $1
      GROUP BY b.bill_id, p.patient_id, br.branch_id
    `;
        const result = await this.executeQuery(query, [billId]);
        return result.rows[0] || null;
    }

    /**
     * Get pending payments
     * @param {Number} branchId - Optional branch filter
     * @returns {Promise<Array>}
     */
    async findPending(branchId = null) {
        if (branchId) {
            return await this.findAll({ branch_id: branchId, bill_status: 'Pending' }, { orderBy: 'bill_date ASC' });
        }
        return await this.findAll({ bill_status: 'Pending' }, { orderBy: 'bill_date ASC' });
    }

    /**
     * Get revenue summary for a branch
     * @param {Number} branchId
     * @param {String} fromDate
     * @param {String} toDate
     * @returns {Promise<Object>}
     */
    async getRevenueSummary(branchId, fromDate, toDate) {
        const query = `
      SELECT 
        COUNT(*) as total_bills,
        SUM(total_amount) as total_amount,
        SUM(discount_amount) as total_discount,
        SUM(tax_amount) as total_tax,
        SUM(net_payable) as total_payable,
        SUM(paid_amount) as total_paid,
        SUM(CASE WHEN bill_status = 'Paid' THEN 1 ELSE 0 END) as paid_bills,
        SUM(CASE WHEN bill_status = 'Pending' THEN 1 ELSE 0 END) as pending_bills
      FROM billings
      WHERE branch_id = $1 AND bill_date BETWEEN $2 AND $3
    `;
        const result = await this.executeQuery(query, [branchId, fromDate, toDate]);
        return result.rows[0] || null;
    }
}

module.exports = new Billing();
