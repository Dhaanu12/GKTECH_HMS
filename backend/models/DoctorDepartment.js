const BaseModel = require('./BaseModel');

class DoctorDepartment extends BaseModel {
    constructor() {
        super('doctor_departments', 'doc_dept_id');
    }

    /**
     * Get all departments for a doctor
     * @param {Number} doctorId
     * @returns {Promise<Array>}
     */
    async findByDoctor(doctorId) {
        const query = `
      SELECT dd.*, d.department_name, d.department_code
      FROM doctor_departments dd
      LEFT JOIN departments d ON dd.department_id = d.department_id
      WHERE dd.doctor_id = $1
      ORDER BY dd.is_primary_department DESC
    `;
        const result = await this.executeQuery(query, [doctorId]);
        return result.rows;
    }

    /**
     * Get all doctors in a department
     * @param {Number} departmentId
     * @returns {Promise<Array>}
     */
    async findByDepartment(departmentId) {
        const query = `
      SELECT dd.*, d.first_name, d.last_name, d.specialization, d.doctor_code
      FROM doctor_departments dd
      LEFT JOIN doctors d ON dd.doctor_id = d.doctor_id
      WHERE dd.department_id = $1
    `;
        const result = await this.executeQuery(query, [departmentId]);
        return result.rows;
    }

    /**
     * Get primary department for a doctor
     * @param {Number} doctorId
     * @returns {Promise<Object|null>}
     */
    async findPrimaryByDoctor(doctorId) {
        return await this.findOne({ doctor_id: doctorId, is_primary_department: true });
    }
}

module.exports = new DoctorDepartment();
