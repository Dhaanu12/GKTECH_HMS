const BaseModel = require('./BaseModel');

class Role extends BaseModel {
    constructor() {
        super('roles', 'role_id');
    }

    /**
     * Find role by code
     * @param {String} roleCode
     * @returns {Promise<Object|null>}
     */
    async findByCode(roleCode) {
        return await this.findOne({ role_code: roleCode });
    }

    /**
     * Get all active roles
     * @returns {Promise<Array>}
     */
    async findActive() {
        return await this.findAll({ is_active: true }, { orderBy: 'role_name ASC' });
    }
}

module.exports = new Role();
