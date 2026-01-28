const BaseModel = require('./BaseModel');

class Service extends BaseModel {
    constructor() {
        super('services', 'service_id');
    }

    /**
     * Find service by code
     * @param {String} serviceCode
     * @returns {Promise<Object|null>}
     */
    async findByCode(serviceCode) {
        return await this.findOne({ service_code: serviceCode });
    }

    /**
     * Get all active services
     * @returns {Promise<Array>}
     */
    async findActive() {
        return await this.findAll({ is_active: true }, { orderBy: 'service_name ASC' });
    }

    /**
     * Get services by category
     * @param {String} category
     * @returns {Promise<Array>}
     */
    async findByCategory(category) {
        return await this.findAll({ service_category: category, is_active: true });
    }

    /**
     * Search services by name
     * @param {String} searchTerm
     * @returns {Promise<Array>}
     */
    async searchByName(searchTerm) {
        const query = `
      SELECT *
      FROM services
      WHERE service_name ILIKE $1
      AND is_active = true
      ORDER BY service_name ASC
    `;
        const result = await this.executeQuery(query, [`%${searchTerm}%`]);
        return result.rows;
    }

    /**
     * Get all service categories
     * @returns {Promise<Array>}
     */
    async getCategories() {
        const query = `
      SELECT DISTINCT service_category
      FROM services
      WHERE is_active = true AND service_category IS NOT NULL
      ORDER BY service_category ASC
    `;
        const result = await this.executeQuery(query);
        return result.rows.map(row => row.service_category);
    }
}

module.exports = new Service();
