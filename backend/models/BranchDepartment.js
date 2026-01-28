const BaseModel = require('./BaseModel');

class BranchDepartment extends BaseModel {
    constructor() {
        super('branch_departments', 'hospital_dept_id');
    }

    /**
     * Get all departments in a branch
     * @param {Number} branchId
     * @returns {Promise<Array>}
     */
    async findByBranch(branchId) {
        const query = `
      SELECT bd.*, d.department_name, d.department_code
      FROM branch_departments bd
      LEFT JOIN departments d ON bd.department_id = d.department_id
      WHERE bd.branch_id = $1 AND bd.is_operational = true
      ORDER BY d.department_name ASC
    `;
        const result = await this.executeQuery(query, [branchId]);
        return result.rows;
    }

    /**
     * Get all branches offering a department
     * @param {Number} departmentId
     * @returns {Promise<Array>}
     */
    async findByDepartment(departmentId) {
        const query = `
      SELECT bd.*, b.branch_name, b.branch_code
      FROM branch_departments bd
      LEFT JOIN branches b ON bd.branch_id = b.branch_id
      WHERE bd.department_id = $1 AND bd.is_operational = true
      ORDER BY b.branch_name ASC
    `;
        const result = await this.executeQuery(query, [departmentId]);
        return result.rows;
    }

    /**
     * Get operational departments in a branch
     * @param {Number} branchId
     * @returns {Promise<Array>}
     */
    async findOperational(branchId) {
        return await this.findAll({ branch_id: branchId, is_operational: true });
    }
}

module.exports = new BranchDepartment();
