const BaseModel = require('./BaseModel');
const db = require('../config/db');

class User extends BaseModel {
    constructor() {
        super('users', 'user_id');
    }

    /**
     * Find user by username
     * @param {String} username
     * @returns {Promise<Object|null>}
     */
    async findByUsername(username) {
        return await this.findOne({ username: username });
    }

    /**
     * Find user by email
     * @param {String} email
     * @returns {Promise<Object|null>}
     */
    async findByEmail(email) {
        return await this.findOne({ email: email });
    }

    /**
     * Find user by phone number
     * @param {String} phoneNumber
     * @returns {Promise<Object|null>}
     */
    async findByPhone(phoneNumber) {
        return await this.findOne({ phone_number: phoneNumber });
    }

    /**
     * Get user with role information
     * @param {Number} userId
     * @returns {Promise<Object|null>}
     */
    async findWithRole(userId) {
        const query = `
      SELECT u.*, r.role_name, r.role_code, r.description as role_description,
             s.staff_id, sb.branch_id as staff_branch_id, 
             d.doctor_id, d.specialization, d.registration_number, d.doctor_code,
             db.branch_id as doctor_branch_id,
             n.nurse_id, nb.branch_id as nurse_branch_id,
             COALESCE(sb.branch_id, db.branch_id, nb.branch_id) as branch_id,
             b.hospital_id, h.hospital_name, h.logo_url as hospital_logo, h.is_active as hospital_is_active, h.enabled_modules, b.branch_name, b.enabled_modules as branch_enabled_modules
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.role_id
      LEFT JOIN staff s ON u.user_id = s.user_id
      LEFT JOIN staff_branches sb ON s.staff_id = sb.staff_id
      LEFT JOIN doctors d ON u.user_id = d.user_id
      LEFT JOIN doctor_branches db ON d.doctor_id = db.doctor_id
      LEFT JOIN nurses n ON u.user_id = n.user_id
      LEFT JOIN nurse_branches nb ON n.nurse_id = nb.nurse_id
      LEFT JOIN branches b ON (
          sb.branch_id = b.branch_id OR 
          db.branch_id = b.branch_id OR 
          nb.branch_id = b.branch_id
      )
      LEFT JOIN hospitals h ON b.hospital_id = h.hospital_id
      WHERE u.user_id = $1
    `;
        const result = await this.executeQuery(query, [userId]);
        return result.rows[0] || null;
    }

    /**
     * Get all active users
     * @returns {Promise<Array>}
     */
    async findActive() {
        return await this.findAll({ is_active: true }, { orderBy: 'username ASC' });
    }

    /**
     * Get users by role
     * @param {Number} roleId
     * @returns {Promise<Array>}
     */
    async findByRole(roleId) {
        return await this.findAll({ role_id: roleId, is_active: true });
    }

    /**
     * Update last login time
     * @param {Number} userId
     * @returns {Promise<Object|null>}
     */
    async updateLastLogin(userId) {
        const query = `
      UPDATE users
      SET last_login = CURRENT_TIMESTAMP, login_attempts = 0
      WHERE user_id = $1
      RETURNING *
    `;
        const result = await this.executeQuery(query, [userId]);
        return result.rows[0] || null;
    }

    /**
     * Increment login attempts
     * @param {Number} userId
     * @returns {Promise<Object|null>}
     */
    async incrementLoginAttempts(userId) {
        const query = `
      UPDATE users
      SET login_attempts = login_attempts + 1
      WHERE user_id = $1
      RETURNING *
    `;
        const result = await this.executeQuery(query, [userId]);
        return result.rows[0] || null;
    }

    /**
     * Lock user account
     * @param {Number} userId
     * @param {Number} minutes - Lock duration in minutes
     * @returns {Promise<Object|null>}
     */
    async lockAccount(userId, minutes = 30) {
        const query = `
      UPDATE users
      SET locked_until = CURRENT_TIMESTAMP + INTERVAL '${minutes} minutes'
      WHERE user_id = $1
      RETURNING *
    `;
        const result = await this.executeQuery(query, [userId]);
        return result.rows[0] || null;
    }
}

module.exports = new User();
