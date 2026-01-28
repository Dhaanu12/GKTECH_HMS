const BaseModel = require('./BaseModel');

class Shift extends BaseModel {
    constructor() {
        super('shifts', 'shift_id');
    }

    /**
     * Find shift by code
     * @param {String} shiftCode
     * @returns {Promise<Object|null>}
     */
    async findByCode(shiftCode) {
        return await this.findOne({ shift_code: shiftCode });
    }

    /**
     * Get all active shifts
     * @returns {Promise<Array>}
     */
    async findActive() {
        return await this.findAll({ is_active: true }, { orderBy: 'start_time ASC' });
    }

    /**
     * Get shifts by type
     * @param {String} type - Morning, Evening, Night, General
     * @returns {Promise<Array>}
     */
    async findByType(type) {
        return await this.findAll({ shift_type: type, is_active: true });
    }
}

module.exports = new Shift();
