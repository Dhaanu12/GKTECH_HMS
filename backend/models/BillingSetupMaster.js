const BaseModel = require('./BaseModel');

class BillingSetupMaster extends BaseModel {
    constructor() {
        super('billing_setup_master', 'billing_setup_id');
    }

    /**
     * Find by UUID
     * @param {String} uuid
     * @returns {Promise<Object|null>}
     */
    async findByUuid(uuid) {
        return await this.findOne({ uuid: uuid });
    }

    /**
     * Find by type (service or package)
     * @param {String} type
     * @returns {Promise<Array>}
     */
    async findByType(type) {
        return await this.findAll({ type_of_service: type, is_active: true });
    }

    /**
     * Find all services for a specific branch
     * @param {Number} branchId
     * @returns {Promise<Array>}
     */
    async findByBranch(branchId) {
        return await this.findAll({ branch_id: branchId, is_active: true });
    }
}

module.exports = new BillingSetupMaster();
