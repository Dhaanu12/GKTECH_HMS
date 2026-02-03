const BaseModel = require('./BaseModel');

class Prescription extends BaseModel {
    constructor() {
        super('prescriptions', 'prescription_id');
    }

    async findByDoctor(doctorId) {
        const query = `
            SELECT p.*, 
                   pat.first_name as patient_first_name, 
                   pat.last_name as patient_last_name,
                   pat.mrn_number,
                   pat.age as patient_age,
                   pat.gender as patient_gender,
                   pat.contact_number as patient_contact_number,
                   d.first_name as doctor_first_name,
                   d.last_name as doctor_last_name,
                   d.specialization as doctor_specialization,
                   d.registration_number as doctor_registration_number,
                   h.hospital_name
            FROM prescriptions p
            JOIN patients pat ON p.patient_id = pat.patient_id
            JOIN doctors d ON p.doctor_id = d.doctor_id
            LEFT JOIN branches b ON p.branch_id = b.branch_id
            LEFT JOIN hospitals h ON b.hospital_id = h.hospital_id
            WHERE p.doctor_id = $1
            ORDER BY p.created_at DESC
        `;
        const result = await this.executeQuery(query, [doctorId]);
        return result.rows;
    }

    async findByPatient(patientId) {
        return await this.findAll({ patient_id: patientId }, { orderBy: 'created_at DESC' });
    }
}

module.exports = new Prescription();
