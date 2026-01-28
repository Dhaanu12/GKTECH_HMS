const BaseModel = require('./BaseModel');

class DoctorShift extends BaseModel {
    constructor() {
        super('doctor_shifts', 'doctor_shift_id');
    }

    /**
     * Get shifts for a doctor on a specific date
     * @param {Number} doctorId
     * @param {String} date - YYYY-MM-DD
     * @returns {Promise<Array>}
     */
    async findByDoctorAndDate(doctorId, date) {
        const query = `
      SELECT ds.*, s.shift_name, s.start_time, s.end_time, b.branch_name, d.department_name
      FROM doctor_shifts ds
      LEFT JOIN shifts s ON ds.shift_id = s.shift_id
      LEFT JOIN branches b ON ds.branch_id = b.branch_id
      LEFT JOIN departments d ON ds.department_id = d.department_id
      WHERE ds.doctor_id = $1 AND ds.shift_date = $2
    `;
        const result = await this.executeQuery(query, [doctorId, date]);
        return result.rows;
    }

    /**
     * Get today's shifts for a doctor
     * @param {Number} doctorId
     * @returns {Promise<Array>}
     */
    async findTodayByDoctor(doctorId) {
        const query = `
      SELECT ds.*, s.shift_name, s.start_time, s.end_time, b.branch_name
      FROM doctor_shifts ds
      LEFT JOIN shifts s ON ds.shift_id = s.shift_id
      LEFT JOIN branches b ON ds.branch_id = b.branch_id
      WHERE ds.doctor_id = $1 AND ds.shift_date = CURRENT_DATE
    `;
        const result = await this.executeQuery(query, [doctorId]);
        return result.rows;
    }

    /**
     * Get all doctors on duty for a shift
     * @param {Number} branchId
     * @param {Number} shiftId
     * @param {String} date
     * @returns {Promise<Array>}
     */
    async findByShiftAndDate(branchId, shiftId, date) {
        const query = `
      SELECT ds.*, d.first_name, d.last_name, d.specialization, dept.department_name
      FROM doctor_shifts ds
      LEFT JOIN doctors d ON ds.doctor_id = d.doctor_id
      LEFT JOIN departments dept ON ds.department_id = dept.department_id
      WHERE ds.branch_id = $1 AND ds.shift_id = $2 AND ds.shift_date = $3
      AND ds.attendance_status = 'Present'
    `;
        const result = await this.executeQuery(query, [branchId, shiftId, date]);
        return result.rows;
    }
}

module.exports = new DoctorShift();
