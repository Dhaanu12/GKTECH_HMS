const BaseModel = require('./BaseModel');

class BillingItem extends BaseModel {
    constructor() {
        super('billing_items', 'bill_item_id');
    }

    /**
     * Get all items for a bill
     * @param {Number} billId
     * @returns {Promise<Array>}
     */
    async findByBill(billId) {
        const query = `
      SELECT 
        bi.*,
        s.service_name,
        s.service_category,
        d.first_name as doctor_first_name,
        d.last_name as doctor_last_name,
        dept.department_name
      FROM billing_items bi
      LEFT JOIN services s ON bi.service_id = s.service_id
      LEFT JOIN doctors d ON bi.doctor_id = d.doctor_id
      LEFT JOIN departments dept ON bi.department_id = dept.department_id
      WHERE bi.bill_id = $1
    `;
        const result = await this.executeQuery(query, [billId]);
        return result.rows;
    }

    /**
     * Create multiple billing items
     * @param {Array} items - Array of item objects
     * @returns {Promise<Array>}
     */
    async createMultiple(items) {
        const client = await this.executeQuery('BEGIN');
        try {
            const results = [];
            for (const item of items) {
                const created = await this.create(item);
                results.push(created);
            }
            await this.executeQuery('COMMIT');
            return results;
        } catch (error) {
            await this.executeQuery('ROLLBACK');
            throw error;
        }
    }
}

module.exports = new BillingItem();
