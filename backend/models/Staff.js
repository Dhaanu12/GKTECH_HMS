const BaseModel = require('./BaseModel');

class Staff extends BaseModel {
    constructor() {
        super('staff', 'staff_id');
    }

    /**
     * Find staff by code
     * @param {String} staffCode
     * @returns {Promise<Object|null>}
     */
    async findByCode(staffCode) {
        return await this.findOne({ staff_code: staffCode });
    }

    /**
     * Get staff with user details
     * @param {Number} staffId
     * @returns {Promise<Object|null>}
     */
    async findWithUser(staffId) {
        const query = `
      SELECT s.*, u.username, u.email as user_email, u.phone_number as user_phone
      FROM staff s
      LEFT JOIN users u ON s.user_id = u.user_id
      WHERE s.staff_id = $1
    `;
        const result = await this.executeQuery(query, [staffId]);
        return result.rows[0] || null;
    }

    /**
     * Get all active staff
     * @returns {Promise<Array>}
     */
    async findActive() {
        return await this.findAll({ is_active: true }, { orderBy: 'first_name ASC' });
    }

    /**
     * Get staff by type
     * @param {String} staffType
     * @returns {Promise<Array>}
     */
    async findByType(staffType) {
        return await this.findAll({ staff_type: staffType, is_active: true });
    }

    /**
     * Search staff by name
     * @param {String} searchTerm
     * @returns {Promise<Array>}
     */
    async searchByName(searchTerm) {
        const query = `
      SELECT *
      FROM staff
      WHERE (first_name ILIKE $1 OR last_name ILIKE $1)
      AND is_active = true
      ORDER BY first_name ASC
    `;
        const result = await this.executeQuery(query, [`%${searchTerm}%`]);
        return result.rows;
    }
}

module.exports = new Staff();
