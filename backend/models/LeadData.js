const BaseModel = require('./BaseModel');

class LeadData extends BaseModel {
    constructor() {
        super('lead_data', 'id');
    }

    /**
     * Search lead data
     * @param {String} searchTerm
     * @returns {Promise<Array>}
     */
    /**
     * Get leads with filtering
     * @param {Object} filters
     * @returns {Promise<Array>}
     */
    async getLeads({ search, startDate, endDate }) {
        let query = `
            SELECT *
            FROM lead_data
            WHERE 1=1
        `;
        const values = [];
        let paramCount = 1;

        if (search) {
            query += ` AND (
                name ILIKE $${paramCount} OR
                hospital_name ILIKE $${paramCount} OR
                email ILIKE $${paramCount} OR
                mobile_number ILIKE $${paramCount}
            )`;
            values.push(`%${search}%`);
            paramCount++;
        }

        if (startDate) {
            query += ` AND created_at >= $${paramCount}`;
            values.push(startDate);
            paramCount++;
        }

        if (endDate) {
            // Add 1 day to end date to include the entire day
            const endDateTime = new Date(endDate);
            endDateTime.setDate(endDateTime.getDate() + 1);
            query += ` AND created_at < $${paramCount}`;
            values.push(endDateTime.toISOString().split('T')[0]);
            paramCount++;
        }

        query += ` ORDER BY created_at DESC`;

        const result = await this.executeQuery(query, values);
        return result.rows;
    }
}

module.exports = new LeadData();
