const BaseModel = require('./BaseModel');

class OPDEntry extends BaseModel {
    constructor() {
        super('opd_entries', 'opd_id');
    }

    /**
     * Find OPD entry by number
     * @param {String} opdNumber
     * @returns {Promise<Object|null>}
     */
    async findByNumber(opdNumber) {
        return await this.findOne({ opd_number: opdNumber });
    }

    /**
     * Get OPD entries by patient
     * @param {Number} patientId
     * @returns {Promise<Array>}
     */
    async findByPatient(patientId) {
        return await this.findAll({ patient_id: patientId }, { orderBy: 'visit_date DESC, created_at DESC' });
    }

    /**
     * Get OPD entries by doctor
     * @param {Number} doctorId
     * @param {String} date - Optional date filter
     * @returns {Promise<Array>}
     */
    async findByDoctor(doctorId, date = null) {
        if (date) {
            return await this.findAll({ doctor_id: doctorId, visit_date: date }, { orderBy: 'visit_time ASC' });
        }
        return await this.findAll({ doctor_id: doctorId }, { orderBy: 'visit_date DESC' });
    }

    /**
     * Get OPD entries by branch
     * @param {Number} branchId
     * @param {String} date - Optional date filter
     * @returns {Promise<Array>}
     */
    async findByBranch(branchId, date = null) {
        if (date) {
            return await this.findAll({ branch_id: branchId, visit_date: date });
        }
        return await this.findAll({ branch_id: branchId }, { orderBy: 'visit_date DESC' });
    }

    /**
     * Get today's OPD entries for a doctor
     * @param {Number} doctorId
     * @returns {Promise<Array>}
     */
    async findTodayByDoctor(doctorId) {
        const query = `
      SELECT o.*, p.first_name, p.last_name, p.mrn_number, p.age, p.gender
      FROM opd_entries o
      LEFT JOIN patients p ON o.patient_id = p.patient_id
      WHERE o.doctor_id = $1 
      AND o.visit_date = CURRENT_DATE
      ORDER BY o.token_number ASC, o.visit_time ASC
    `;
        const result = await this.executeQuery(query, [doctorId]);
        return result.rows;
    }

    /**
     * Get OPD entry with full details
     * @param {Number} opdId
     * @returns {Promise<Object|null>}
     */
    async findWithDetails(opdId) {
        const query = `
      SELECT 
        o.*,
        p.first_name as patient_first_name, p.last_name as patient_last_name, p.mrn_number, 
        p.age, p.gender, p.blood_group, p.contact_number, p.medical_history, p.allergies,
        p.address, p.address_line2, p.city, p.state, p.pincode,
        d.first_name as doctor_first_name, d.last_name as doctor_last_name, d.specialization,
        b.branch_name, b.mlc_fee,
        dept.department_name
      FROM opd_entries o
      LEFT JOIN patients p ON o.patient_id = p.patient_id
      LEFT JOIN doctors d ON o.doctor_id = d.doctor_id
      LEFT JOIN branches b ON o.branch_id = b.branch_id
      LEFT JOIN departments dept ON o.department_id = dept.department_id
      WHERE o.opd_id = $1
    `;
        const result = await this.executeQuery(query, [opdId]);
        return result.rows[0] || null;
    }

    /**
     * Get patient medical history (all OPD visits)
     * @param {Number} patientId
     * @returns {Promise<Array>}
     */
    async getPatientHistory(patientId) {
        const query = `
      SELECT 
        o.*,
        d.first_name as doctor_first_name, d.last_name as doctor_last_name,
        b.branch_name,
        dept.department_name
      FROM opd_entries o
      LEFT JOIN doctors d ON o.doctor_id = d.doctor_id
      LEFT JOIN branches b ON o.branch_id = b.branch_id
      LEFT JOIN departments dept ON o.department_id = dept.department_id
      WHERE o.patient_id = $1
      ORDER BY o.visit_date DESC, o.created_at DESC
    `;
        const result = await this.executeQuery(query, [patientId]);
        return result.rows;
    }
}

module.exports = new OPDEntry();
