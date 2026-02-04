const BaseModel = require('./BaseModel');
const { PasswordUtils } = require('../utils/authUtils');

class UserSession extends BaseModel {
    constructor() {
        super('user_sessions', 'session_id');
    }

    /**
     * Create new session
     * @param {Object} sessionData
     * @returns {Promise<Object>}
     */
    async createSession(sessionData) {
        const { userId, token, refreshToken, deviceInfo, ipAddress, userAgent, expiresAt, refreshExpiresAt } = sessionData;

        const tokenHash = PasswordUtils.hashToken(token);
        const refreshTokenHash = refreshToken ? PasswordUtils.hashToken(refreshToken) : null;

        return await this.create({
            user_id: userId,
            token_hash: tokenHash,
            refresh_token_hash: refreshTokenHash,
            device_info: deviceInfo,
            ip_address: ipAddress,
            user_agent: userAgent,
            expires_at: expiresAt,
            refresh_expires_at: refreshExpiresAt,
            is_active: true
        });
    }

    /**
     * Find session by token
     * @param {String} token
     * @returns {Promise<Object|null>}
     */
    async findByToken(token) {
        const tokenHash = PasswordUtils.hashToken(token);
        return await this.findOne({ token_hash: tokenHash, is_active: true });
    }

    /**
     * Find session by refresh token
     * @param {String} refreshToken
     * @returns {Promise<Object|null>}
     */
    async findByRefreshToken(refreshToken) {
        const tokenHash = PasswordUtils.hashToken(refreshToken);
        return await this.findOne({ refresh_token_hash: tokenHash, is_active: true });
    }

    /**
     * Get all active sessions for a user
     * @param {Number} userId
     * @returns {Promise<Array>}
     */
    async findActiveByUser(userId) {
        return await this.findAll(
            { user_id: userId, is_active: true },
            { orderBy: 'last_activity DESC' }
        );
    }

    /**
     * Invalidate session
     * @param {Number} sessionId
     * @returns {Promise<Object|null>}
     */
    async invalidateSession(sessionId) {
        return await this.update(sessionId, { is_active: false });
    }

    /**
     * Invalidate all sessions for a user
     * @param {Number} userId
     * @returns {Promise<Number>}
     */
    async invalidateAllUserSessions(userId) {
        const query = `
      UPDATE user_sessions
      SET is_active = false
      WHERE user_id = $1
      RETURNING session_id
    `;
        const result = await this.executeQuery(query, [userId]);
        return result.rowCount;
    }

    /**
     * Update session activity
     * @param {Number} sessionId
     * @returns {Promise<Object|null>}
     */
    async updateActivity(sessionId) {
        const query = `
      UPDATE user_sessions
      SET last_activity = CURRENT_TIMESTAMP
      WHERE session_id = $1
      RETURNING *
    `;
        const result = await this.executeQuery(query, [sessionId]);
        return result.rows[0] || null;
    }

    /**
     * Clean up expired sessions
     * @returns {Promise<Number>}
     */
    async cleanupExpired() {
        const query = `SELECT cleanup_expired_sessions()`;
        const result = await this.executeQuery(query);
        return result.rows[0].cleanup_expired_sessions;
    }

    /**
     * Check if session is valid
     * @param {String} token
     * @returns {Promise<Object|null>}
     */
    async validateSession(token) {
        const tokenHash = PasswordUtils.hashToken(token);
        const query = `
      SELECT * FROM user_sessions
      WHERE token_hash = $1
      AND is_active = true
      AND expires_at > CURRENT_TIMESTAMP
    `;
        const result = await this.executeQuery(query, [tokenHash]);
        return result.rows[0] || null;
    }
}

module.exports = new UserSession();
