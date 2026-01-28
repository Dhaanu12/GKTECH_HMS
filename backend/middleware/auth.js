const { JWTUtils } = require('../utils/authUtils');
const UserSession = require('../models/UserSession');
const User = require('../models/User');
const { AppError } = require('./errorHandler');

/**
 * Authentication middleware to protect routes
 */
const authenticate = async (req, res, next) => {
    try {
        // Extract token from header
        const authHeader = req.headers.authorization;
        const token = JWTUtils.extractTokenFromHeader(authHeader);

        if (!token) {
            return next(new AppError('Authentication required. Please provide a valid token.', 401));
        }

        // Verify JWT token
        const decoded = JWTUtils.verifyAccessToken(token);
        if (!decoded) {
            return next(new AppError('Invalid or expired token. Please login again.', 401));
        }

        // TEMPORARILY DISABLED: Session validation
        // TODO: Fix session creation on login
        // const session = await UserSession.validateSession(token);
        // if (!session) {
        //     return next(new AppError('Session has expired or is invalid. Please login again.', 401));
        // }

        // Get user details
        const user = await User.findById(decoded.userId);
        if (!user) {
            return next(new AppError('User not found.', 401));
        }

        // Check if user is active
        if (!user.is_active) {
            return next(new AppError('Your account has been deactivated. Please contact support.', 403));
        }

        // Check if account is locked
        if (user.locked_until && new Date(user.locked_until) > new Date()) {
            return next(new AppError('Your account is temporarily locked. Please try again later.', 403));
        }

        // TEMPORARILY DISABLED: Update session activity
        // if (session) {
        //     await UserSession.updateActivity(session.session_id);
        // }

        // Attach user to request - use decoded token data + database user data
        req.user = {
            ...decoded, // Includes user_id, branch_id, doctor_id, role, etc from JWT
            ...user,    // Adds is_active, locked_until, etc from database
            user_id: decoded.userId || decoded.user_id // Ensure user_id is set
        };
        req.session = null; // Temporary - session validation disabled
        req.userId = user.user_id;

        next();
    } catch (error) {
        console.error('Authentication error:', error);
        next(new AppError('Authentication failed. Please try again.', 401));
    }
};

/**
 * Authorization middleware to check user roles
 * @param  {...String} allowedRoles - Array of allowed role codes
 */
const authorize = (...allowedRoles) => {
    return async (req, res, next) => {
        try {
            if (!req.user) {
                return next(new AppError('Authentication required.', 401));
            }

            // Get user with role information
            const userWithRole = await User.findWithRole(req.user.user_id);

            if (!userWithRole) {
                return next(new AppError('User role not found.', 403));
            }

            // Debug log for authorization issues
            console.log('🔐 Authorization check:', {
                userId: req.user.user_id,
                allowedRoles: allowedRoles,
                userRoleCode: userWithRole.role_code,
                match: allowedRoles.map(r => r.toUpperCase()).includes((userWithRole.role_code || '').toUpperCase())
            });

            // Check if user's role is in allowed roles (case-insensitive)
            const normalizedAllowedRoles = allowedRoles.map(r => r.toUpperCase());
            const userRoleNormalized = (userWithRole.role_code || '').toUpperCase();

            if (!normalizedAllowedRoles.includes(userRoleNormalized)) {
                return next(new AppError('You do not have permission to access this resource.', 403));
            }

            // Attach role to request
            req.userRole = userWithRole.role_code;

            // Merge full user details (including hospital_id, branch_id) into req.user
            req.user = { ...req.user, ...userWithRole };

            next();
        } catch (error) {
            console.error('Authorization error:', error);
            next(new AppError('Authorization failed.', 403));
        }
    };
};

/**
 * Optional authentication - doesn't fail if no token
 * Useful for routes that work for both authenticated and non-authenticated users
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
        // Don't fail, just continue without user
        next();
    }
};

module.exports = {
    authenticate,
    authorize,
    optionalAuth
};
