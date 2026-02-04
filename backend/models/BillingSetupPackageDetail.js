const BaseModel = require('./BaseModel');

class BillingSetupPackageDetail extends BaseModel {
    constructor() {
        super('billing_setup_package_details', 'detail_id');
    }

    /**
     * Find details for a specific package UUID
     * @param {String} packageUuid
     * @returns {Promise<Array>}
     */
    async findByPackageUuid(packageUuid) {
        return await this.findAll({ package_uuid: packageUuid, is_active: true });
    }
}

module.exports = new BillingSetupPackageDetail();
