const User = require('../models/User');
const UserSession = require('../models/UserSession');
const PasswordResetToken = require('../models/PasswordResetToken');
const { PasswordUtils, JWTUtils } = require('../utils/authUtils');
const { AppError } = require('../middleware/errorHandler');

/**
 * Authentication Controller
 */
class AuthController {
    /**
     * Register new user
     * POST /api/auth/register
     */
    static async register(req, res, next) {
        try {
            const { username, email, phone_number, password, role_id } = req.body;

            // Validate required fields
            if (!username || !email || !password || !role_id) {
                return next(new AppError('Please provide username, email, password, and role', 400));
            }

            // Validate password strength
            const passwordValidation = PasswordUtils.validatePasswordStrength(password);
            if (!passwordValidation.valid) {
                return next(new AppError(passwordValidation.errors.join(', '), 400));
            }

            // Check if user already exists
            const existingUser = await User.findByEmail(email);
            if (existingUser) {
                return next(new AppError('User with this email already exists', 409));
            }

            const existingUsername = await User.findByUsername(username);
            if (existingUsername) {
                return next(new AppError('Username is already taken', 409));
            }

            // Hash password
            const password_hash = await PasswordUtils.hashPassword(password);

            // Create user
            const user = await User.create({
                username,
                email,
                phone_number,
                password_hash,
                role_id,
                is_active: true,
                is_email_verified: false,
                is_phone_verified: false
            });

            // Remove password from response
            delete user.password_hash;

            res.status(201).json({
                status: 'success',
                message: 'User registered successfully',
                data: { user }
            });
        } catch (error) {
            console.error('Register error:', error);
            next(new AppError('Registration failed. Please try again.', 500));
        }
    }

    /**
     * Login user
     * POST /api/auth/login
     */
    static async login(req, res, next) {
        try {
            const { email, password, deviceInfo } = req.body;

            // Validate input
            if (!email || !password) {
                return next(new AppError('Please provide email and password', 400));
            }

            // Find user
            const user = await User.findByEmail(email);
            if (!user) {
                return next(new AppError('Invalid email or password', 401));
            }

            // Check if account is locked
            if (user.locked_until && new Date(user.locked_until) > new Date()) {
                const lockTime = Math.ceil((new Date(user.locked_until) - new Date()) / 60000);
                return next(new AppError(`Account is locked. Try again in ${lockTime} minutes`, 403));
            }

            // Verify password
            const isPasswordValid = await PasswordUtils.comparePassword(password, user.password_hash);
            if (!isPasswordValid) {
                // Increment login attempts
                await User.incrementLoginAttempts(user.user_id);

                // Lock account after 5 failed attempts
                if (user.login_attempts >= 4) {
                    await User.lockAccount(user.user_id, 30);
                    return next(new AppError('Too many failed login attempts. Account locked for 30 minutes', 403));
                }

                return next(new AppError('Invalid email or password', 401));
            }

            // Check if user is active
            if (!user.is_active) {
                return next(new AppError('Your account has been deactivated', 403));
            }

            // Get user with role
            const userWithRole = await User.findWithRole(user.user_id);

            // Check module access
            const ROLE_MODULE_MAP = {
                'DOCTOR': 'doc',
                'NURSE': 'nurse',
                'LAB_TECH': 'lab',
                'PHARMACIST': 'pharma',
                'MARKETING_EXECUTIVE': 'market',
                'ACCOUNTANT': 'acc',
                'RECEPTIONIST': 'reception'
            };

            if (userWithRole.role_code !== 'SUPER_ADMIN' && userWithRole.role_code !== 'CLIENT_ADMIN') {
                const requiredModule = ROLE_MODULE_MAP[userWithRole.role_code];
                if (requiredModule) {
                    let enabledModules = userWithRole.enabled_modules;

                    // Ensure enabledModules is an array
                    if (typeof enabledModules === 'string') {
                        try { enabledModules = JSON.parse(enabledModules); } catch (e) { enabledModules = []; }
                    }
                    if (!Array.isArray(enabledModules)) enabledModules = [];

                    // Check if module is assigned and active
                    // Structure: [{ id: 'doc', is_active: true }, ...]
                    // Fallback to string check for backward compatibility if needed, but migration should have covered it.

                    const moduleConfig = enabledModules.find(m => {
                        if (typeof m === 'string') return m === requiredModule;
                        return m.id === requiredModule;
                    });

                    let hasAccess = false;
                    if (moduleConfig) {
                        if (typeof moduleConfig === 'string') hasAccess = true; // Old format
                        else hasAccess = moduleConfig.is_active; // New format
                    }

                    if (!hasAccess) {
                        return next(new AppError('Access to this module is disabled for your hospital', 403));
                    }

                    // Check Branch Level Access
                    // If branch_enabled_modules is present (not null), it restricts further.
                    // If null, it assumes "Inherit Hospital Permissions" (so no extra check needed).
                    let branchModules = userWithRole.branch_enabled_modules;
                    if (branchModules) {
                        if (typeof branchModules === 'string') {
                            try { branchModules = JSON.parse(branchModules); } catch (e) { branchModules = []; }
                        }
                        if (Array.isArray(branchModules)) {
                            const branchConfig = branchModules.find(m => {
                                if (typeof m === 'string') return m === requiredModule;
                                return m.id === requiredModule;
                            });

                            let branchHasAccess = false;
                            if (branchConfig) {
                                if (typeof branchConfig === 'string') branchHasAccess = true;
                                else branchHasAccess = branchConfig.is_active;
                            }

                            if (!branchHasAccess) {
                                // Even if Hospital allows it, if Branch explicitly forbids (by not including it or setting inactive), fail.
                                // NOTE: Logic assumption: If Branch config exists, it is an AllowList.
                                return next(new AppError('Access to this module is disabled for your branch', 403));
                            }
                        }
                    }
                }
            }

            // Generate tokens
            const tokenPayload = {
                userId: user.user_id,
                user_id: user.user_id, // Add for consistency 
                email: user.email,
                username: user.username,
                roleId: user.role_id,
                role: userWithRole.role_code, // Add role code
                branch_id: userWithRole.branch_id, // Add branch_id for branch-specific operations
                doctor_id: userWithRole.doctor_id, // Add doctor_id for doctor-specific operations
                nurse_id: userWithRole.nurse_id, // Add nurse_id for nurse-specific operations
                hospital_id: userWithRole.hospital_id, // Add hospital_id
                hospital_logo: userWithRole.hospital_logo // Add hospital_logo
            };

            const accessToken = JWTUtils.generateAccessToken(tokenPayload);
            const refreshToken = JWTUtils.generateRefreshToken(tokenPayload);

            // Get token expiration
            const expiresAt = JWTUtils.getTokenExpiration(accessToken);
            const refreshExpiresAt = JWTUtils.getTokenExpiration(refreshToken);

            // Invalidate all existing sessions for this user before creating a new one
            // This prevents duplicate session_id errors and ensures clean session management
            try {
                await UserSession.invalidateAllUserSessions(user.user_id);
            } catch (sessionCleanupError) {
                console.warn('Warning: Failed to cleanup old sessions:', sessionCleanupError.message);
                // Continue anyway - this is not critical
            }

            // Create session
            await UserSession.createSession({
                userId: user.user_id,
                token: accessToken,
                refreshToken: refreshToken,
                deviceInfo: deviceInfo || req.headers['user-agent'],
                ipAddress: req.ip,
                userAgent: req.headers['user-agent'],
                expiresAt,
                refreshExpiresAt
            });

            // Update last login
            await User.updateLastLogin(user.user_id);

            // Remove sensitive data
            delete userWithRole.password_hash;

            res.status(200).json({
                status: 'success',
                message: 'Login successful',
                data: {
                    user: userWithRole,
                    accessToken,
                    refreshToken,
                    expiresAt
                }
            });
        } catch (error) {
            console.error('Login error:', error);
            next(new AppError('Login failed. Please try again.', 500));
        }
    }

    /**
     * Logout user
     * POST /api/auth/logout
     */
    static async logout(req, res, next) {
        try {
            const { session } = req;

            if (session) {
                await UserSession.invalidateSession(session.session_id);
            }

            res.status(200).json({
                status: 'success',
                message: 'Logged out successfully'
            });
        } catch (error) {
            console.error('Logout error:', error);
            next(new AppError('Logout failed', 500));
        }
    }

    /**
     * Logout from all devices
     * POST /api/auth/logout-all
     */
    static async logoutAll(req, res, next) {
        try {
            const { userId } = req;

            const count = await UserSession.invalidateAllUserSessions(userId);

            res.status(200).json({
                status: 'success',
                message: `Logged out from ${count} device(s) successfully`
            });
        } catch (error) {
            console.error('Logout all error:', error);
            next(new AppError('Logout failed', 500));
        }
    }

    /**
     * Refresh access token
     * POST /api/auth/refresh
     */
    static async refresh(req, res, next) {
        try {
            const { refreshToken } = req.body;

            if (!refreshToken) {
                return next(new AppError('Refresh token is required', 400));
            }

            // Verify refresh token
            const decoded = JWTUtils.verifyRefreshToken(refreshToken);
            if (!decoded) {
                return next(new AppError('Invalid or expired refresh token', 401));
            }

            // Find session
            const session = await UserSession.findByRefreshToken(refreshToken);
            if (!session || !session.is_active) {
                return next(new AppError('Invalid session', 401));
            }

            // Check if refresh token is expired
            if (new Date(session.refresh_expires_at) < new Date()) {
                await UserSession.invalidateSession(session.session_id);
                return next(new AppError('Refresh token has expired. Please login again', 401));
            }

            // Generate new access token
            const tokenPayload = {
                userId: decoded.userId,
                email: decoded.email,
                username: decoded.username,
                roleId: decoded.roleId
            };

            const newAccessToken = JWTUtils.generateAccessToken(tokenPayload);
            const expiresAt = JWTUtils.getTokenExpiration(newAccessToken);

            // Update session with new token
            const tokenHash = PasswordUtils.hashToken(newAccessToken);
            await UserSession.update(session.session_id, {
                token_hash: tokenHash,
                expires_at: expiresAt
            });

            res.status(200).json({
                status: 'success',
                message: 'Token refreshed successfully',
                data: {
                    accessToken: newAccessToken,
                    expiresAt
                }
            });
        } catch (error) {
            console.error('Refresh token error:', error);
            next(new AppError('Token refresh failed', 500));
        }
    }

    /**
     * Get current user
     * GET /api/auth/me
     */
    static async getCurrentUser(req, res, next) {
        try {
            const userWithRole = await User.findWithRole(req.userId);

            if (!userWithRole) {
                return next(new AppError('User not found', 404));
            }

            delete userWithRole.password_hash;

            res.status(200).json({
                status: 'success',
                data: { user: userWithRole }
            });
        } catch (error) {
            console.error('Get current user error:', error);
            next(new AppError('Failed to get user information', 500));
        }
    }

    /**
     * Change password
     * POST /api/auth/change-password
     */
    static async changePassword(req, res, next) {
        try {
            const { currentPassword, newPassword } = req.body;
            const { userId } = req;

            // Validate input
            if (!currentPassword || !newPassword) {
                return next(new AppError('Please provide current and new password', 400));
            }

            // Validate new password strength
            const passwordValidation = PasswordUtils.validatePasswordStrength(newPassword);
            if (!passwordValidation.valid) {
                return next(new AppError(passwordValidation.errors.join(', '), 400));
            }

            // Get user
            const user = await User.findById(userId);
            if (!user) {
                return next(new AppError('User not found', 404));
            }

            // Verify current password
            const isPasswordValid = await PasswordUtils.comparePassword(currentPassword, user.password_hash);
            if (!isPasswordValid) {
                return next(new AppError('Current password is incorrect', 401));
            }

            // Hash new password
            const password_hash = await PasswordUtils.hashPassword(newPassword);

            // Update password
            await User.update(userId, {
                password_hash,
                password_changed_at: new Date(),
                must_change_password: false
            });

            // Invalidate all sessions except current
            await UserSession.invalidateAllUserSessions(userId);

            res.status(200).json({
                status: 'success',
                message: 'Password changed successfully. Please login again with your new password.'
            });
        } catch (error) {
            console.error('Change password error:', error);
            next(new AppError('Password change failed', 500));
        }
    }

    /**
     * Get active sessions
     * GET /api/auth/sessions
     */
    static async getSessions(req, res, next) {
        try {
            const { userId } = req;
            const sessions = await UserSession.findActiveByUser(userId);

            res.status(200).json({
                status: 'success',
                data: { sessions }
            });
        } catch (error) {
            console.error('Get sessions error:', error);
            next(new AppError('Failed to get sessions', 500));
        }
    }
}

module.exports = AuthController;
