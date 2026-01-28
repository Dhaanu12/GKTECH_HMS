const BaseModel = require('./BaseModel');

class PasswordResetToken extends BaseModel {
    constructor() {
        super('password_reset_tokens', 'reset_id');
    }

    /**
     * Create password reset token
     * @param {Number} userId
     * @param {String} tokenHash
     * @param {Date} expiresAt
     * @returns {Promise<Object>}
     */
    async createResetToken(userId, tokenHash, expiresAt) {
        return await this.create({
            user_id: userId,
            token_hash: tokenHash,
            expires_at: expiresAt,
            used: false
        });
    }

    /**
     * Find valid reset token
     * @param {String} tokenHash
     * @returns {Promise<Object|null>}
     */
    async findValidToken(tokenHash) {
        const query = `
      SELECT * FROM password_reset_tokens
      WHERE token_hash = $1
      AND used = false
      AND expires_at > CURRENT_TIMESTAMP
    `;
        const result = await this.executeQuery(query, [tokenHash]);
        return result.rows[0] || null;
    }

    /**
     * Mark token as used
     * @param {Number} resetId
     * @returns {Promise<Object|null>}
     */
    async markAsUsed(resetId) {
        const query = `
      UPDATE password_reset_tokens
      SET used = true, used_at = CURRENT_TIMESTAMP
      WHERE reset_id = $1
      RETURNING *
    `;
        const result = await this.executeQuery(query, [resetId]);
        return result.rows[0] || null;
    }

    /**
     * Invalidate all tokens for a user
     * @param {Number} userId
     * @returns {Promise<Number>}
     */
    async invalidateUserTokens(userId) {
        const query = `
      UPDATE password_reset_tokens
      SET used = true
      WHERE user_id = $1 AND used = false
    `;
        const result = await this.executeQuery(query, [userId]);
        return result.rowCount;
    }
}

module.exports = new PasswordResetToken();
