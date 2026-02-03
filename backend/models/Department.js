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

    /**
     * Find departments by Hospital ID (via Branches)
     * @param {Number} hospitalId
     * @returns {Promise<Array>}
     */
    async findByHospitalId(hospitalId) {
        const query = `
            SELECT DISTINCT d.* 
            FROM departments d
            JOIN branch_departments bd ON d.department_id = bd.department_id
            JOIN branches b ON bd.branch_id = b.branch_id
            WHERE b.hospital_id = $1 AND d.is_active = true AND b.is_active = true
            ORDER BY d.department_name ASC
        `;
        const result = await this.executeQuery(query, [hospitalId]);
        return result.rows;
    }
}

module.exports = new Department();
