const BaseModel = require('./BaseModel');

class BillingMaster extends BaseModel {
    constructor() {
        super('billing_master', 'bill_master_id');
    }

    /**
     * Find bill by bill number
     * @param {String} billNumber
     * @returns {Promise<Object|null>}
     */
    async findByBillNumber(billNumber) {
        return await this.findOne({ bill_number: billNumber });
    }

    /**
     * Find bills by MRN
     * @param {String} mrnNumber
     * @returns {Promise<Array>}
     */
    async findByMRN(mrnNumber) {
        return await this.findAll({ mrn_number: mrnNumber }, { orderBy: 'created_at DESC' });
    }

    /**
     * Find bills by branch
     * @param {Number} branchId
     * @returns {Promise<Array>}
     */
    async findByBranch(branchId) {
        return await this.findAll({ branch_id: branchId }, { orderBy: 'created_at DESC' });
    }
}

module.exports = new BillingMaster();
