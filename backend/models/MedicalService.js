const BaseModel = require('./BaseModel');

class MedicalService extends BaseModel {
    constructor() {
        super('medical_services', 'service_id');
    }

    /**
     * Search lab tests by name
     * @param {String} searchTerm
     * @returns {Promise<Array>}
     */
    async searchLabs(searchTerm) {
        const query = `
            SELECT *
            FROM medical_services
            WHERE service_name ILIKE $1
            AND category = 'lab_test'
            AND is_active = true
            ORDER BY service_name ASC
            LIMIT 20
        `;
        const result = await this.executeQuery(query, [`%${searchTerm}%`]);
        return result.rows;
    }
}

module.exports = new MedicalService();
