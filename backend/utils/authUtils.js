const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

/**
 * Password Utilities
 */
class PasswordUtils {
    /**
     * Hash a password
     * @param {String} password - Plain text password
     * @returns {Promise<String>} - Hashed password
     */
    static async hashPassword(password) {
        const salt = await bcrypt.genSalt(10);
        return await bcrypt.hash(password, salt);
    }

    /**
     * Compare password with hash
     * @param {String} password - Plain text password
     * @param {String} hash - Hashed password
     * @returns {Promise<Boolean>}
     */
    static async comparePassword(password, hash) {
        return await bcrypt.compare(password, hash);
    }

    /**
     * Generate random token
     * @param {Number} length - Token length
     * @returns {String}
     */
    static generateToken(length = 32) {
        return crypto.randomBytes(length).toString('hex');
    }

    /**
     * Hash token for storage
     * @param {String} token
     * @returns {String}
     */
    static hashToken(token) {
        return crypto.createHash('sha256').update(token).digest('hex');
    }

    /**
     * Validate password strength
     * @param {String} password
     * @returns {Object} { valid: Boolean, errors: Array }
     */
    static validatePasswordStrength(password) {
        const errors = [];

        if (password.length < 8) {
            errors.push('Password must be at least 8 characters long');
        }

        if (!/[A-Z]/.test(password)) {
            errors.push('Password must contain at least one uppercase letter');
        }

        if (!/[a-z]/.test(password)) {
            errors.push('Password must contain at least one lowercase letter');
        }

        if (!/[0-9]/.test(password)) {
            errors.push('Password must contain at least one number');
        }

        if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
            errors.push('Password must contain at least one special character');
        }

        return {
            valid: errors.length === 0,
            errors
        };
    }
}

/**
 * JWT Utilities
 */
class JWTUtils {
    /**
     * Generate access token
     * @param {Object} payload - User data
     * @returns {String}
     */
    static generateAccessToken(payload) {
        return jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRE || '7d' }
        );
    }

    /**
     * Generate refresh token
     * @param {Object} payload - User data
     * @returns {String}
     */
    static generateRefreshToken(payload) {
        return jwt.sign(
            payload,
            process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
            { expiresIn: '30d' }
        );
    }

    /**
     * Verify access token
     * @param {String} token
     * @returns {Object|null}
     */
    static verifyAccessToken(token) {
        try {
            return jwt.verify(token, process.env.JWT_SECRET);
        } catch (error) {
            return null;
        }
    }

    /**
     * Verify refresh token
     * @param {String} token
     * @returns {Object|null}
     */
    static verifyRefreshToken(token) {
        try {
            return jwt.verify(
                token,
                process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET
            );
        } catch (error) {
            return null;
        }
    }

    /**
     * Get token expiration date
     * @param {String} token
     * @returns {Date|null}
     */
    static getTokenExpiration(token) {
        try {
            const decoded = jwt.decode(token);
            return decoded ? new Date(decoded.exp * 1000) : null;
        } catch (error) {
            return null;
        }
    }

    /**
     * Extract token from Authorization header
     * @param {String} authHeader - Authorization header value
     * @returns {String|null}
     */
    static extractTokenFromHeader(authHeader) {
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return null;
        }
        return authHeader.substring(7);
    }
}

module.exports = {
    PasswordUtils,
    JWTUtils
};
