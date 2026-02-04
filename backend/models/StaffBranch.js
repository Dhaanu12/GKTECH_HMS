const BaseModel = require('./BaseModel');

class StaffBranch extends BaseModel {
    constructor() {
        super('staff_branches', 'staff_hospital_id');
    }

    /**
     * Get all branches for a staff member
     * @param {Number} staffId
     * @returns {Promise<Array>}
     */
    async findByStaff(staffId) {
        const query = `
      SELECT sb.*, b.branch_name, b.branch_code, b.city, d.department_name
      FROM staff_branches sb
      LEFT JOIN branches b ON sb.branch_id = b.branch_id
      LEFT JOIN departments d ON sb.department_id = d.department_id
      WHERE sb.staff_id = $1 AND sb.is_active = true
    `;
        const result = await this.executeQuery(query, [staffId]);
        return result.rows;
    }

    /**
     * Get all staff in a branch
     * @param {Number} branchId
     * @returns {Promise<Array>}
     */
    async findByBranch(branchId) {
        const query = `
      SELECT sb.*, s.first_name, s.last_name, s.staff_code, s.staff_type, d.department_name
      FROM staff_branches sb
      LEFT JOIN staff s ON sb.staff_id = s.staff_id
      LEFT JOIN departments d ON sb.department_id = d.department_id
      WHERE sb.branch_id = $1 AND sb.is_active = true
    `;
        const result = await this.executeQuery(query, [branchId]);
        return result.rows;
    }
}

module.exports = new StaffBranch();
