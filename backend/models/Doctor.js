const BaseModel = require('./BaseModel');

class Doctor extends BaseModel {
    constructor() {
        super('doctors', 'doctor_id');
    }

    async findByCode(doctorCode) {
        return await this.findOne({ doctor_code: doctorCode });
    }

    async findByRegistration(regNumber) {
        return await this.findOne({ registration_number: regNumber });
    }

    async findWithUser(userId) {
        return await this.findOne({ user_id: userId });
    }

    async findBySpecialization(specialization) {
        return await this.findAll({ specialization });
    }

    async findAllWithDetails() {
        const query = `
            SELECT d.*, u.email, u.phone_number, dept.department_id, dept.department_name,
                   h.hospital_name, b.branch_name,
                   STRING_AGG(DISTINCT h.hospital_name, ', ') as all_hospitals,
                   STRING_AGG(DISTINCT b.branch_name, ', ') as all_branches
            FROM doctors d
            JOIN users u ON d.user_id = u.user_id
            LEFT JOIN doctor_departments dd ON d.doctor_id = dd.doctor_id AND dd.is_primary_department = true
            LEFT JOIN departments dept ON dd.department_id = dept.department_id
            LEFT JOIN doctor_branches db ON d.doctor_id = db.doctor_id
            LEFT JOIN branches b ON db.branch_id = b.branch_id
            LEFT JOIN hospitals h ON b.hospital_id = h.hospital_id
            WHERE d.is_active = true
            GROUP BY d.doctor_id, u.user_id, dept.department_id, h.hospital_name, b.branch_name
        `;
        const result = await this.executeQuery(query);
        return result.rows;
    }

    async search(searchTerm) {
        const query = `
            SELECT DISTINCT d.*, u.email, u.phone_number, dept.department_id, dept.department_name,
                   h.hospital_name
            FROM doctors d
            JOIN users u ON d.user_id = u.user_id
            LEFT JOIN doctor_departments dd ON d.doctor_id = dd.doctor_id AND dd.is_primary_department = true
            LEFT JOIN departments dept ON dd.department_id = dept.department_id
            LEFT JOIN doctor_branches db ON d.doctor_id = db.doctor_id
            LEFT JOIN branches b ON db.branch_id = b.branch_id
            LEFT JOIN hospitals h ON b.hospital_id = h.hospital_id
            WHERE (
                d.first_name ILIKE $1 OR 
                d.last_name ILIKE $1 OR 
                d.doctor_code ILIKE $1 OR 
                d.registration_number ILIKE $1 OR
                u.email ILIKE $1 OR
                u.phone_number ILIKE $1 OR
                h.hospital_name ILIKE $1
            ) AND d.is_active = true
        `;
        const result = await this.executeQuery(query, [`%${searchTerm}%`]);
        return result.rows;
    }

    async searchByName(name) {
        return this.search(name);
    }

    // NEW: Find doctors by Hospital ID
    async findByHospital(hospitalId) {
        const query = `
      SELECT DISTINCT d.*, u.email, u.phone_number, dept.department_id, dept.department_name
      FROM doctors d
      JOIN users u ON d.user_id = u.user_id
      JOIN doctor_branches db ON d.doctor_id = db.doctor_id
      JOIN branches b ON db.branch_id = b.branch_id
      LEFT JOIN doctor_departments dd ON d.doctor_id = dd.doctor_id AND dd.is_primary_department = true
      LEFT JOIN departments dept ON dd.department_id = dept.department_id
      WHERE b.hospital_id = $1 AND d.is_active = true
    `;
        const result = await this.executeQuery(query, [hospitalId]);
        return result.rows;
    }

    // NEW: Find doctors by Branch ID
    async findByBranch(branchId) {
        const query = `
      SELECT d.*, u.email, u.phone_number, dept.department_id, dept.department_name
      FROM doctors d
      JOIN users u ON d.user_id = u.user_id
      JOIN doctor_branches db ON d.doctor_id = db.doctor_id
      LEFT JOIN doctor_departments dd ON d.doctor_id = dd.doctor_id AND dd.is_primary_department = true
      LEFT JOIN departments dept ON dd.department_id = dept.department_id
      WHERE db.branch_id = $1 AND d.is_active = true
    `;
        const result = await this.executeQuery(query, [branchId]);
        return result.rows;
    }

    // NEW: Find doctors by Department ID (via doctor_departments or doctor_branch_departments)
    // Assuming doctor_departments is the primary link for specialization
    async findByDepartment(departmentId) {
        const query = `
      SELECT d.*, u.email, u.phone_number, dept.department_id, dept.department_name
      FROM doctors d
      JOIN users u ON d.user_id = u.user_id
      JOIN doctor_departments dd ON d.doctor_id = dd.doctor_id
      LEFT JOIN departments dept ON dd.department_id = dept.department_id
      WHERE dd.department_id = $1 AND d.is_active = true
    `;
        const result = await this.executeQuery(query, [departmentId]);
        return result.rows;
    }

    // NEW: Find by Hospital AND Department
    async findByHospitalAndDepartment(hospitalId, departmentId) {
        const query = `
      SELECT DISTINCT d.*, u.email, u.phone_number, dept.department_id, dept.department_name
      FROM doctors d
      JOIN users u ON d.user_id = u.user_id
      JOIN doctor_branches db ON d.doctor_id = db.doctor_id
      JOIN branches b ON db.branch_id = b.branch_id
      JOIN doctor_departments dd ON d.doctor_id = dd.doctor_id
      LEFT JOIN departments dept ON dd.department_id = dept.department_id
      WHERE b.hospital_id = $1 AND dd.department_id = $2 AND d.is_active = true
    `;
        const result = await this.executeQuery(query, [hospitalId, departmentId]);
        return result.rows;
    }

    async getBranches(doctorId) {
        const query = `
            SELECT b.*
            FROM branches b
            JOIN doctor_branches db ON b.branch_id = db.branch_id
            WHERE db.doctor_id = $1
        `;
        const result = await this.executeQuery(query, [doctorId]);
        return result.rows;
    }
}

module.exports = new Doctor();
