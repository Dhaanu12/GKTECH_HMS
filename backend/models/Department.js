const BaseModel = require('./BaseModel');

class Department extends BaseModel {
    constructor() {
        super('departments', 'department_id');
    }

    /**
     * Find department by code
     * @param {String} departmentCode
     * @returns {Promise<Object|null>}
     */
    async findByCode(departmentCode) {
        return await this.findOne({ department_code: departmentCode });
    }

    /**
     * Get all active departments
     * @returns {Promise<Array>}
     */
    async findActive() {
        return await this.findAll({ is_active: true }, { orderBy: 'department_name ASC' });
    }
}

module.exports = new Department();
