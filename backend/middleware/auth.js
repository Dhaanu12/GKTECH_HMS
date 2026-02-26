const { JWTUtils } = require('../utils/authUtils');
const UserSession = require('../models/UserSession');
const User = require('../models/User');
const { AppError } = require('./errorHandler');

/**
 * Authentication middleware to protect routes
 */
const authenticate = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        const token = JWTUtils.extractTokenFromHeader(authHeader);

        if (!token) {
            return next(new AppError('Authentication required. Please provide a valid token.', 401));
        }

        const decoded = JWTUtils.verifyAccessToken(token);
        if (!decoded) {
            return next(new AppError('Invalid or expired token. Please login again.', 401));
        }

        const user = await User.findById(decoded.userId);
        if (!user) {
            return next(new AppError('User not found.', 401));
        }

        if (!user.is_active) {
            return next(new AppError('Your account has been deactivated. Please contact support.', 403));
        }

        if (user.locked_until && new Date(user.locked_until) > new Date()) {
            return next(new AppError('Your account is temporarily locked. Please try again later.', 403));
        }

        req.user = {
            ...decoded,
            ...user,
            user_id: decoded.userId || decoded.user_id
        };
        req.session = null;
        req.userId = user.user_id;

        next();
    } catch (error) {
        console.error('Authentication error:', error);
        next(new AppError('Authentication failed. Please try again.', 401));
    }
};

/**
 * Authorization middleware to check user roles.
 * Also enforces hospital-inactive check on every protected API call.
 * @param  {...String} allowedRoles - Array of allowed role codes
 */
const authorize = (...allowedRoles) => {
    return async (req, res, next) => {
        try {
            if (!req.user) {
                return next(new AppError('Authentication required.', 401));
            }

            const userWithRole = await User.findWithRole(req.user.user_id);

            if (!userWithRole) {
                return next(new AppError('User role not found.', 403));
            }

            console.log('🔐 Authorization check:', {
                userId: req.user.user_id,
                allowedRoles: allowedRoles,
                userRoleCode: userWithRole.role_code,
                hospital_id: userWithRole.hospital_id,
                enabled_modules: userWithRole.enabled_modules,
                match: allowedRoles.map(r => r.toUpperCase()).includes((userWithRole.role_code || '').toUpperCase())
            });

            const normalizedAllowedRoles = allowedRoles.map(r => r.toUpperCase());
            const userRoleNormalized = (userWithRole.role_code || '').toUpperCase();

            if (!normalizedAllowedRoles.includes(userRoleNormalized)) {
                return next(new AppError('You do not have permission to access this resource.', 403));
            }

            // Set role on request BEFORE requireModule runs
            req.userRole = userWithRole.role_code;

            // Merge full user details (including hospital_id, branch_id, enabled_modules) into req.user
            req.user = { ...req.user, ...userWithRole };

            // ── Hospital Inactive Check ────────────────────────────────────────────
            if (
                userWithRole.role_code !== 'SUPER_ADMIN' &&
                userWithRole.hospital_id &&
                userWithRole.hospital_is_active === false
            ) {
                return next(new AppError('Your hospital has been deactivated. Please contact the administrator.', 403));
            }

            next();
        } catch (error) {
            console.error('Authorization error:', error);
            next(new AppError('Authorization failed.', 403));
        }
    };
};

/**
 * Module access guard for user-creation endpoints.
 * Blocks CLIENT_ADMIN from creating a user type whose module is disabled for their hospital.
 * SUPER_ADMIN is always allowed.
 *
 * @param {string} moduleId - The module identifier (matches enabled_modules[].id)
 *   'doc'       → Doctor
 *   'nurse'     → Nurse
 *   'reception' → Receptionist
 *   'acc'       → Accountant / Account Manager
 *   'market'    → Marketing Executive
 *   'lab'       → Lab Technician
 *   'pharma'    → Pharmacist
 */
const requireModule = (moduleId) => {
    return (req, res, next) => {
        console.log(`[requireModule:${moduleId}] userRole=${req.userRole} | enabled_modules=`, JSON.stringify(req.user && req.user.enabled_modules));

        // SUPER_ADMIN bypasses all module checks
        if (req.userRole === 'SUPER_ADMIN') return next();

        // Only enforce for CLIENT_ADMIN (others like DOCTOR etc. won't create users)
        if (req.userRole !== 'CLIENT_ADMIN') return next();

        let enabledModules = req.user && req.user.enabled_modules;

        if (typeof enabledModules === 'string') {
            try { enabledModules = JSON.parse(enabledModules); } catch (e) { enabledModules = []; }
        }
        if (!Array.isArray(enabledModules)) enabledModules = [];

        const moduleConfig = enabledModules.find(m => {
            if (typeof m === 'string') return m === moduleId;
            return m.id === moduleId;
        });

        let hasAccess = false;
        if (moduleConfig) {
            if (typeof moduleConfig === 'string') hasAccess = true;   // Legacy string format
            else hasAccess = moduleConfig.is_active === true;          // Current object format
        }

        console.log(`[requireModule:${moduleId}] hasAccess=${hasAccess} | enabledModules count=${enabledModules.length}`);

        if (!hasAccess) {
            return next(new AppError(
                'This module is not enabled for your hospital. Please contact the Super Admin to enable it.',
                403
            ));
        }

        next();
    };
};

/**
 * Optional authentication - doesn't fail if no token
 */
const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        const token = JWTUtils.extractTokenFromHeader(authHeader);

        if (token) {
            const decoded = JWTUtils.verifyAccessToken(token);
            if (decoded) {
                const session = await UserSession.validateSession(token);
                if (session) {
                    const user = await User.findById(decoded.userId);
                    if (user && user.is_active) {
                        req.user = user;
                        req.session = session;
                        req.userId = user.user_id;
                        await UserSession.updateActivity(session.session_id);
                    }
                }
            }
        }

        next();
    } catch (error) {
        next();
    }
};

module.exports = {
    authenticate,
    authorize,
    requireModule,
    optionalAuth
};
