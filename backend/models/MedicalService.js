const BaseModel = require('./BaseModel');

class MedicalService extends BaseModel {
    constructor() {
        super('medical_services', 'service_id');
    }

    /**
     * Search services by name
     * @param {String} searchTerm
     * @returns {Promise<Array>}
     */
    async searchByName(searchTerm) {
        const query = `
      SELECT *
      FROM medical_services
      WHERE service_name ILIKE $1
      AND is_active = true
      ORDER BY service_name ASC
    `;
        const result = await this.executeQuery(query, [`%${searchTerm}%`]);
        return result.rows;
    }

    /**
     * Search services by name and category
     * @param {String} searchTerm
     * @param {String} category
     * @returns {Promise<Array>}
     */
    async searchByNameAndCategory(searchTerm, category) {
        // Map UI categories to DB categories if needed.
        // Assuming DB has 'Laboratory', 'Radiology', 'Procedure' etc.
        // Or if the user inputs are direct.
        // For 'Lab Test' -> maybe 'Laboratory'?
        // For now, simple direct search or ILIKE.

        const query = `
      SELECT *
      FROM medical_services
      WHERE service_name ILIKE $1
      ${category ? 'AND category ILIKE $2' : ''}
      AND is_active = true
      ORDER BY service_name ASC
    `;
        const params = [`%${searchTerm}%`];
        if (category) {
            params.push(`%${category}%`); // Broad match for category?
        }
        const result = await this.executeQuery(query, params);
        return result.rows;
    }
}

module.exports = new MedicalService();
