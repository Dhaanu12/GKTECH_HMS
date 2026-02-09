const BaseModel = require('./BaseModel');

class BillDetails extends BaseModel {
    constructor() {
        super('bill_details', 'bill_detail_id');
    }

    /**
     * Find details by bill number
     * @param {String} billNumber
     * @returns {Promise<Array>}
     */
    async findByBillNumber(billNumber) {
        return await this.findAll({ bill_number: billNumber });
    }

    /**
     * Find details by invoice ID
     * @param {String} invoiceId
     * @returns {Promise<Array>}
     */
    async findByInvoice(invoiceId) {
        return await this.findAll({ invoice_id: invoiceId });
    }

    /**
     * Find details by service/UUID
     * @param {String} uuid
     * @returns {Promise<Object|null>}
     */
    async findByUUID(uuid) {
        return await this.findOne({ uuid: uuid });
    }
}

module.exports = new BillDetails();
