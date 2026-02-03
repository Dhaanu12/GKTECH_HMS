const BaseModel = require('./BaseModel');

class Appointment extends BaseModel {
    constructor() {
        super('appointments', 'appointment_id');
    }

    /**
     * Find appointment by number
     * @param {String} appointmentNumber
     * @returns {Promise<Object|null>}
     */
    async findByNumber(appointmentNumber) {
        return await this.findOne({ appointment_number: appointmentNumber });
    }

    /**
     * Get appointments by patient
     * @param {Number} patientId
     * @returns {Promise<Array>}
     */
    async findByPatient(patientId) {
        return await this.findAll({ patient_id: patientId }, { orderBy: 'appointment_date DESC, appointment_time DESC' });
    }

    /**
     * Get appointments by doctor
     * @param {Number} doctorId
     * @param {String} date - Optional date filter (YYYY-MM-DD)
     * @returns {Promise<Array>}
     */
    async findByDoctor(doctorId, date = null) {
        if (date) {
            return await this.findAll({ doctor_id: doctorId, appointment_date: date }, { orderBy: 'appointment_time ASC' });
        }
        return await this.findAll({ doctor_id: doctorId }, { orderBy: 'appointment_date DESC, appointment_time DESC' });
    }

    /**
     * Get appointments by branch
     * @param {Number} branchId
     * @param {String} date - Optional date filter
     * @returns {Promise<Array>}
     */
    async findByBranch(branchId, date = null) {
        if (date) {
            return await this.findAll({ branch_id: branchId, appointment_date: date }, { orderBy: 'appointment_time ASC' });
        }
        return await this.findAll({ branch_id: branchId }, { orderBy: 'appointment_date DESC' });
    }

    /**
     * Get appointments by status
     * @param {String} status
     * @returns {Promise<Array>}
     */
    async findByStatus(status) {
        return await this.findAll({ appointment_status: status }, { orderBy: 'appointment_date ASC, appointment_time ASC' });
    }

    /**
     * Get today's appointments for a doctor
     * @param {Number} doctorId
     * @returns {Promise<Array>}
     */
    async findTodayByDoctor(doctorId) {
        const query = `
      SELECT a.*, p.first_name as patient_first_name, p.last_name as patient_last_name, p.mrn_number
      FROM appointments a
      LEFT JOIN patients p ON a.patient_id = p.patient_id
      WHERE a.doctor_id = $1 
      AND a.appointment_date = CURRENT_DATE
      ORDER BY a.appointment_time ASC
    `;
        const result = await this.executeQuery(query, [doctorId]);
        return result.rows;
    }

    /**
     * Get detailed appointment with related data
     * @param {Number} appointmentId
     * @returns {Promise<Object|null>}
     */
    async findWithDetails(appointmentId) {
        const query = `
      SELECT 
        a.*,
        p.first_name as patient_first_name, p.last_name as patient_last_name, p.mrn_number, p.age, p.gender as patient_gender,
        d.first_name as doctor_first_name, d.last_name as doctor_last_name, d.specialization,
        b.branch_name,
        dept.department_name
      FROM appointments a
      LEFT JOIN patients p ON a.patient_id = p.patient_id
      LEFT JOIN doctors d ON a.doctor_id = d.doctor_id
      LEFT JOIN branches b ON a.branch_id = b.branch_id
      LEFT JOIN departments dept ON a.department_id = dept.department_id
      WHERE a.appointment_id = $1
    `;
        const result = await this.executeQuery(query, [appointmentId]);
        return result.rows[0] || null;
    }
}

module.exports = new Appointment();
