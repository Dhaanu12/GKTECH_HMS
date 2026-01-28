const BaseModel = require('./BaseModel');

class DoctorBranch extends BaseModel {
    constructor() {
        super('doctor_branches', 'doc_hospital_id');
    }

    /**
     * Get all branches for a doctor
     * @param {Number} doctorId
     * @returns {Promise<Array>}
     */
    async findByDoctor(doctorId) {
        const query = `
      SELECT db.*, b.branch_name, b.branch_code, b.city, b.address_line1
      FROM doctor_branches db
      LEFT JOIN branches b ON db.branch_id = b.branch_id
      WHERE db.doctor_id = $1 AND db.is_active = true
    `;
        const result = await this.executeQuery(query, [doctorId]);
        return result.rows;
    }

    /**
     * Get all doctors in a branch
     * @param {Number} branchId
     * @returns {Promise<Array>}
     */
    async findByBranch(branchId) {
        const query = `
      SELECT db.*, d.first_name, d.last_name, d.specialization, d.doctor_code
      FROM doctor_branches db
      LEFT JOIN doctors d ON db.doctor_id = d.doctor_id
      WHERE db.branch_id = $1 AND db.is_active = true
    `;
        const result = await this.executeQuery(query, [branchId]);
        return result.rows;
    }
}

module.exports = new DoctorBranch();
