const BaseModel = require('./BaseModel');

class Hospital extends BaseModel {
    constructor() {
        super('hospitals', 'hospital_id');
    }

    /**
     * Find hospital by code
     * @param {String} hospitalCode
     * @returns {Promise<Object|null>}
     */
    async findByCode(hospitalCode) {
        return await this.findOne({ hospital_code: hospitalCode });
    }

    /**
     * Get all active hospitals
     * @returns {Promise<Array>}
     */
    async findActive() {
        return await this.findAll({ is_active: true }, { orderBy: 'hospital_name ASC' });
    }

    /**
     * Get hospitals by type
     * @param {String} type - Government, Private, Trust, Corporate
     * @returns {Promise<Array>}
     */
    async findByType(type) {
        return await this.findAll({ hospital_type: type, is_active: true });
    }
}

module.exports = new Hospital();
