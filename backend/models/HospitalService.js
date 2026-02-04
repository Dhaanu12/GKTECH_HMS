const BaseModel = require('./BaseModel');

class HospitalService extends BaseModel {
    constructor() {
        super('hospital_services', 'hosp_service_id');
    }

    /**
     * Search services by name
     * @param {String} searchTerm
     * @returns {Promise<Array>}
     */
    async searchByName(searchTerm) {
        // Simple fuzzy search using ILIKE
        const query = `
            SELECT *
            FROM hospital_services
            WHERE service_name ILIKE $1
            AND is_active = true
            ORDER BY service_name ASC
            LIMIT 20
        `;
        const result = await this.executeQuery(query, [`%${searchTerm}%`]);
        return result.rows;
    }

    /**
    * Search services by name and hospital (optional)
    * @param {String} searchTerm
    * @param {Number} hospitalId
    * @returns {Promise<Array>}
    */
    async searchByNameAndHospital(searchTerm, hospitalId) {
        let query = `
            SELECT *
            FROM hospital_services
            WHERE service_name ILIKE $1
            AND is_active = true
        `;
        const params = [`%${searchTerm}%`];

        if (hospitalId) {
            query += ` AND hospital_id = $2`;
            params.push(hospitalId);
        }

        query += ` ORDER BY service_name ASC LIMIT 20`;

        const result = await this.executeQuery(query, params);
        return result.rows;
    }
}

module.exports = new HospitalService();
