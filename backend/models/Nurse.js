const BaseModel = require('./BaseModel');

class Nurse extends BaseModel {
    constructor() {
        super('nurses', 'nurse_id');
    }

    async findByCode(nurseCode) {
        return await this.findOne({ nurse_code: nurseCode });
    }

    async findByRegistration(regNumber) {
        return await this.findOne({ registration_number: regNumber });
    }

    async findWithUser(userId) {
        return await this.findOne({ user_id: userId });
    }

    async findAllWithDetails() {
        const query = `
            SELECT n.*, u.email, u.phone_number
            FROM nurses n
            JOIN users u ON n.user_id = u.user_id
            WHERE n.is_active = true
        `;
        const result = await this.executeQuery(query);
        return result.rows;
    }

    async search(searchTerm) {
        const query = `
            SELECT DISTINCT n.*, u.email, u.phone_number
            FROM nurses n
            JOIN users u ON n.user_id = u.user_id
            WHERE (
                n.first_name ILIKE $1 OR 
                n.last_name ILIKE $1 OR 
                n.nurse_code ILIKE $1 OR 
                n.registration_number ILIKE $1 OR
                u.email ILIKE $1 OR
                u.phone_number ILIKE $1
            ) AND n.is_active = true
        `;
        const result = await this.executeQuery(query, [`%${searchTerm}%`]);
        return result.rows;
    }

    async searchByName(name) {
        return this.search(name);
    }

    // NEW: Find by Hospital
    async findByHospital(hospitalId) {
        const query = `
      SELECT DISTINCT n.*, u.email, u.phone_number
      FROM nurses n
      JOIN users u ON n.user_id = u.user_id
      JOIN nurse_branches nb ON n.nurse_id = nb.nurse_id
      JOIN branches b ON nb.branch_id = b.branch_id
      WHERE b.hospital_id = $1 AND n.is_active = true
    `;
        const result = await this.executeQuery(query, [hospitalId]);
        return result.rows;
    }

    // NEW: Find by Branch
    async findByBranch(branchId) {
        const query = `
      SELECT n.*, u.email, u.phone_number
      FROM nurses n
      JOIN users u ON n.user_id = u.user_id
      JOIN nurse_branches nb ON n.nurse_id = nb.nurse_id
      WHERE nb.branch_id = $1 AND n.is_active = true
    `;
        const result = await this.executeQuery(query, [branchId]);
        return result.rows;
    }

    // NEW: Find by Department (via nurse_branches which has department_id)
    async findByDepartment(departmentId) {
        const query = `
      SELECT DISTINCT n.*, u.email, u.phone_number
      FROM nurses n
      JOIN users u ON n.user_id = u.user_id
      JOIN nurse_branches nb ON n.nurse_id = nb.nurse_id
      WHERE nb.department_id = $1 AND n.is_active = true
    `;
        const result = await this.executeQuery(query, [departmentId]);
        return result.rows;
    }

    // NEW: Find by Hospital AND Department
    async findByHospitalAndDepartment(hospitalId, departmentId) {
        const query = `
      SELECT DISTINCT n.*, u.email, u.phone_number
      FROM nurses n
      JOIN users u ON n.user_id = u.user_id
      JOIN nurse_branches nb ON n.nurse_id = nb.nurse_id
      JOIN branches b ON nb.branch_id = b.branch_id
      WHERE b.hospital_id = $1 AND nb.department_id = $2 AND n.is_active = true
    `;
        const result = await this.executeQuery(query, [hospitalId, departmentId]);
        return result.rows;
    }
}

module.exports = new Nurse();
