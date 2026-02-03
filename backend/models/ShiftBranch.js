const BaseModel = require('./BaseModel');

class ShiftBranch extends BaseModel {
    constructor() {
        super('shift_branches', 'shift_hospital_id');
    }

    /**
     * Get all branches for a shift
     * @param {Number} shiftId
     * @returns {Promise<Array>}
     */
    async findByShift(shiftId) {
        const query = `
      SELECT sb.*, b.branch_name, b.branch_code
      FROM shift_branches sb
      LEFT JOIN branches b ON sb.branch_id = b.branch_id
      WHERE sb.shift_id = $1 AND sb.is_active = true
    `;
        const result = await this.executeQuery(query, [shiftId]);
        return result.rows;
    }

    /**
     * Get all shifts for a branch
     * @param {Number} branchId
     * @returns {Promise<Array>}
     */
    async findByBranch(branchId) {
        const query = `
      SELECT sb.*, s.shift_name, s.shift_code, s.start_time, s.end_time, s.shift_type
      FROM shift_branches sb
      LEFT JOIN shifts s ON sb.shift_id = s.shift_id
      WHERE sb.branch_id = $1 AND sb.is_active = true
      ORDER BY s.start_time ASC
    `;
        const result = await this.executeQuery(query, [branchId]);
        return result.rows;
    }
}

module.exports = new ShiftBranch();
