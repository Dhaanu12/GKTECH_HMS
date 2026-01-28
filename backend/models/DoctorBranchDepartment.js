const BaseModel = require('./BaseModel');

class DoctorBranchDepartment extends BaseModel {
    constructor() {
        super('doctor_branch_departments', 'doc_hosp_dept_id');
    }

    /**
     * Get doctor assignments for a branch
     * @param {Number} doctorId
     * @param {Number} branchId
     * @returns {Promise<Array>}
     */
    async findByDoctorAndBranch(doctorId, branchId) {
        const query = `
      SELECT dbd.*, d.department_name, d.department_code
      FROM doctor_branch_departments dbd
      LEFT JOIN departments d ON dbd.department_id = d.department_id
      WHERE dbd.doctor_id = $1 AND dbd.branch_id = $2
      ORDER BY dbd.is_primary DESC
    `;
        const result = await this.executeQuery(query, [doctorId, branchId]);
        return result.rows;
    }

    /**
     * Get all doctors in a branch-department
     * @param {Number} branchId
     * @param {Number} departmentId
     * @returns {Promise<Array>}
     */
    async findByBranchAndDepartment(branchId, departmentId) {
        const query = `
      SELECT dbd.*, d.first_name, d.last_name, d.specialization, d.consultation_fee
      FROM doctor_branch_departments dbd
      LEFT JOIN doctors d ON dbd.doctor_id = d.doctor_id
      WHERE dbd.branch_id = $1 AND dbd.department_id = $2
    `;
        const result = await this.executeQuery(query, [branchId, departmentId]);
        return result.rows;
    }
}

module.exports = new DoctorBranchDepartment();
