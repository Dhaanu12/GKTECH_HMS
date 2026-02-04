const BaseModel = require('./BaseModel');

class NurseShift extends BaseModel {
    constructor() {
        super('nurse_shifts', 'nurse_shift_id');
    }

    /**
     * Get shifts for a nurse on a specific date
     * @param {Number} nurseId
     * @param {String} date - YYYY-MM-DD
     * @returns {Promise<Array>}
     */
    async findByNurseAndDate(nurseId, date) {
        const query = `
      SELECT ns.*, s.shift_name, s.start_time, s.end_time, b.branch_name, d.department_name
      FROM nurse_shifts ns
      LEFT JOIN shifts s ON ns.shift_id = s.shift_id
      LEFT JOIN branches b ON ns.branch_id = b.branch_id
      LEFT JOIN departments d ON ns.department_id = d.department_id
      WHERE ns.nurse_id = $1 AND ns.shift_date = $2
    `;
        const result = await this.executeQuery(query, [nurseId, date]);
        return result.rows;
    }

    /**
     * Get today's shifts for a nurse
     * @param {Number} nurseId
     * @returns {Promise<Array>}
     */
    async findTodayByNurse(nurseId) {
        const query = `
      SELECT ns.*, s.shift_name, s.start_time, s.end_time, b.branch_name
      FROM nurse_shifts ns
      LEFT JOIN shifts s ON ns.shift_id = s.shift_id
      LEFT JOIN branches b ON ns.branch_id = b.branch_id
      WHERE ns.nurse_id = $1 AND ns.shift_date = CURRENT_DATE
    `;
        const result = await this.executeQuery(query, [nurseId]);
        return result.rows;
    }

    /**
     * Get all nurses on duty for a shift
     * @param {Number} branchId
     * @param {Number} shiftId
     * @param {String} date
     * @returns {Promise<Array>}
     */
    async findByShiftAndDate(branchId, shiftId, date) {
        const query = `
      SELECT ns.*, n.first_name, n.last_name, dept.department_name
      FROM nurse_shifts ns
      LEFT JOIN nurses n ON ns.nurse_id = n.nurse_id
      LEFT JOIN departments dept ON ns.department_id = dept.department_id
      WHERE ns.branch_id = $1 AND ns.shift_id = $2 AND ns.shift_date = $3
      AND ns.attendance_status = 'Present'
    `;
        const result = await this.executeQuery(query, [branchId, shiftId, date]);
        return result.rows;
    }
}

module.exports = new NurseShift();
