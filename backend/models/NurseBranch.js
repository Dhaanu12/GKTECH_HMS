const BaseModel = require('./BaseModel');

class NurseBranch extends BaseModel {
    constructor() {
        super('nurse_branches', 'nurse_hospital_id');
    }

    /**
     * Get all branches for a nurse
     * @param {Number} nurseId
     * @returns {Promise<Array>}
     */
    async findByNurse(nurseId) {
        const query = `
      SELECT nb.*, b.branch_name, b.branch_code, b.city, d.department_name
      FROM nurse_branches nb
      LEFT JOIN branches b ON nb.branch_id = b.branch_id
      LEFT JOIN departments d ON nb.department_id = d.department_id
      WHERE nb.nurse_id = $1 AND nb.is_active = true
    `;
        const result = await this.executeQuery(query, [nurseId]);
        return result.rows;
    }

    /**
     * Get all nurses in a branch
     * @param {Number} branchId
     * @returns {Promise<Array>}
     */
    async findByBranch(branchId) {
        const query = `
      SELECT nb.*, n.first_name, n.last_name, n.specialization, n.nurse_code, d.department_name
      FROM nurse_branches nb
      LEFT JOIN nurses n ON nb.nurse_id = n.nurse_id
      LEFT JOIN departments d ON nb.department_id = d.department_id
      WHERE nb.branch_id = $1 AND nb.is_active = true
    `;
        const result = await this.executeQuery(query, [branchId]);
        return result.rows;
    }

    /**
     * Get nurses by branch and department
     * @param {Number} branchId
     * @param {Number} departmentId
     * @returns {Promise<Array>}
     */
    async findByBranchAndDepartment(branchId, departmentId) {
        const query = `
      SELECT nb.*, n.first_name, n.last_name, n.nurse_code
      FROM nurse_branches nb
      LEFT JOIN nurses n ON nb.nurse_id = n.nurse_id
      WHERE nb.branch_id = $1 AND nb.department_id = $2 AND nb.is_active = true
    `;
        const result = await this.executeQuery(query, [branchId, departmentId]);
        return result.rows;
    }
}

module.exports = new NurseBranch();
