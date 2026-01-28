const BaseModel = require('./BaseModel');

class Patient extends BaseModel {
    constructor() {
        super('patients', 'patient_id');
    }

    /**
     * Find patient by MRN number
     * @param {String} mrnNumber
     * @returns {Promise<Object|null>}
     */
    async findByMRN(mrnNumber) {
        return await this.findOne({ mrn_number: mrnNumber });
    }

    /**
     * Find patient by code
     * @param {String} patientCode
     * @returns {Promise<Object|null>}
     */
    async findByCode(patientCode) {
        return await this.findOne({ patient_code: patientCode });
    }

    /**
     * Find patient by contact number
     * @param {String} contactNumber
     * @returns {Promise<Array>}
     */
    async findByContact(contactNumber) {
        return await this.findAll({ contact_number: contactNumber });
    }

    /**
     * Find patient by email
     * @param {String} email
     * @returns {Promise<Object|null>}
     */
    async findByEmail(email) {
        return await this.findOne({ email: email });
    }

    /**
     * Get all active patients
     * @returns {Promise<Array>}
     */
    async findActive() {
        return await this.findAll({ is_active: true }, { orderBy: 'registration_date DESC' });
    }

    /**
     * Search patients by name
     * @param {String} searchTerm
     * @returns {Promise<Array>}
     */
    async searchByName(searchTerm) {
        const query = `
      SELECT *
      FROM patients
      WHERE (first_name ILIKE $1 OR last_name ILIKE $1)
      AND is_active = true
      ORDER BY first_name ASC
    `;
        const result = await this.executeQuery(query, [`%${searchTerm}%`]);
        return result.rows;
    }

    /**
     * Get recently registered patients
     * @param {Number} limit
     * @returns {Promise<Array>}
     */
    async findRecent(limit = 10) {
        return await this.findAll({ is_active: true }, {
            orderBy: 'registration_date DESC, created_at DESC',
            limit: limit
        });
    }
}

module.exports = new Patient();
