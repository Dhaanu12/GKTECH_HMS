const BaseModel = require('./BaseModel');

class Receptionist extends BaseModel {
    constructor() {
        super('staff', 'staff_id');
    }

    async findAllWithDetails() {
        const query = `
            SELECT DISTINCT s.*, u.email, u.phone_number, u.username, 
                   b.branch_id, b.branch_name, h.hospital_id, h.hospital_name
            FROM staff s
            JOIN users u ON s.user_id = u.user_id
            LEFT JOIN staff_branches sb ON s.staff_id = sb.staff_id
            LEFT JOIN branches b ON sb.branch_id = b.branch_id
            LEFT JOIN hospitals h ON b.hospital_id = h.hospital_id
            WHERE s.staff_type = 'RECEPTIONIST' AND s.is_active = true
        `;
        const result = await this.executeQuery(query);
        return result.rows;
    }

    async search(searchTerm) {
        const query = `
            SELECT DISTINCT s.*, u.email, u.phone_number, u.username,
                   b.branch_id, b.branch_name, h.hospital_id, h.hospital_name
            FROM staff s
            JOIN users u ON s.user_id = u.user_id
            LEFT JOIN staff_branches sb ON s.staff_id = sb.staff_id
            LEFT JOIN branches b ON sb.branch_id = b.branch_id
            LEFT JOIN hospitals h ON b.hospital_id = h.hospital_id
            WHERE s.staff_type = 'RECEPTIONIST' AND s.is_active = true
            AND (
                s.first_name ILIKE $1 OR 
                s.last_name ILIKE $1 OR 
                s.staff_code ILIKE $1 OR 
                u.email ILIKE $1 OR
                u.phone_number ILIKE $1 OR
                u.username ILIKE $1 OR
                h.hospital_name ILIKE $1
            )
        `;
        const result = await this.executeQuery(query, [`%${searchTerm}%`]);
        return result.rows;
    }

    async findByHospital(hospitalId) {
        const query = `
            SELECT DISTINCT s.*, u.email, u.phone_number, u.username,
                   b.branch_id, b.branch_name
            FROM staff s
            JOIN users u ON s.user_id = u.user_id
            JOIN staff_branches sb ON s.staff_id = sb.staff_id
            JOIN branches b ON sb.branch_id = b.branch_id
            WHERE s.staff_type = 'RECEPTIONIST' AND s.is_active = true
            AND b.hospital_id = $1
        `;
        const result = await this.executeQuery(query, [hospitalId]);
        return result.rows;
    }

    async findByBranch(branchId) {
        const query = `
            SELECT DISTINCT s.*, u.email, u.phone_number, u.username,
                   b.branch_id, b.branch_name
            FROM staff s
            JOIN users u ON s.user_id = u.user_id
            JOIN staff_branches sb ON s.staff_id = sb.staff_id
            JOIN branches b ON sb.branch_id = b.branch_id
            WHERE s.staff_type = 'RECEPTIONIST' AND s.is_active = true
            AND b.branch_id = $1
        `;
        const result = await this.executeQuery(query, [branchId]);
        return result.rows;
    }

    async findByIdWithDetails(id) {
        const query = `
            SELECT s.*, u.email, u.phone_number, u.username,
                   b.branch_id, b.branch_name, h.hospital_id, h.hospital_name
            FROM staff s
            JOIN users u ON s.user_id = u.user_id
            LEFT JOIN staff_branches sb ON s.staff_id = sb.staff_id
            LEFT JOIN branches b ON sb.branch_id = b.branch_id
            LEFT JOIN hospitals h ON b.hospital_id = h.hospital_id
            WHERE s.staff_id = $1
        `;
        const result = await this.executeQuery(query, [id]);
        return result.rows[0];
    }
}

module.exports = new Receptionist();
