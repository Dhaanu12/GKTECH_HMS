const BaseModel = require('./BaseModel');

class MLCCaseType extends BaseModel {
    constructor() {
        super('mlc_case_types', 'mlc_case_type_id');
    }

    /**
     * Find by category
     * @param {String} category
     * @returns {Promise<Array>}
     */
    async findByCategory(category) {
        return await this.findAll({ category }, { orderBy: 'case_name ASC' });
    }
}

module.exports = new MLCCaseType();
