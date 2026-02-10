/**
 * AI-specific rate limiting middleware
 * Limits AI API requests per user to prevent abuse and control costs
 */

// In-memory store for rate limiting (could be extended to Redis for production)
const userRequestCounts = new Map();

// Configuration
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const MAX_REQUESTS_PER_WINDOW = parseInt(process.env.AI_RATE_LIMIT_PER_HOUR) || 50;

/**
 * Clean up expired entries periodically
 */
function cleanupExpiredEntries() {
    const now = Date.now();
    for (const [userId, data] of userRequestCounts.entries()) {
        if (now - data.windowStart > RATE_LIMIT_WINDOW_MS) {
            userRequestCounts.delete(userId);
        }
    }
}

// Run cleanup every 10 minutes
setInterval(cleanupExpiredEntries, 10 * 60 * 1000);

/**
 * Rate limiter middleware for AI endpoints
 */
function aiRateLimiter(req, res, next) {
    const userId = req.user?.userId || req.user?.user_id || 'anonymous';
    const now = Date.now();

    // Get or create user's rate limit data
    let userData = userRequestCounts.get(userId);

    if (!userData || now - userData.windowStart > RATE_LIMIT_WINDOW_MS) {
        // Start new window
        userData = {
            windowStart: now,
            requestCount: 0,
        };
        userRequestCounts.set(userId, userData);
    }

    // Check if user has exceeded rate limit
    if (userData.requestCount >= MAX_REQUESTS_PER_WINDOW) {
        const resetTime = new Date(userData.windowStart + RATE_LIMIT_WINDOW_MS);
        const minutesRemaining = Math.ceil((resetTime - now) / 60000);

        return res.status(429).json({
            status: 'error',
            message: `AI request limit reached. Please try again in ${minutesRemaining} minutes.`,
            retryAfter: Math.ceil((resetTime - now) / 1000),
            limit: MAX_REQUESTS_PER_WINDOW,
            remaining: 0,
            resetAt: resetTime.toISOString(),
        });
    }

    // Increment request count
    userData.requestCount += 1;

    // Add rate limit headers to response
    const remaining = MAX_REQUESTS_PER_WINDOW - userData.requestCount;
    res.setHeader('X-RateLimit-Limit', MAX_REQUESTS_PER_WINDOW);
    res.setHeader('X-RateLimit-Remaining', remaining);
    res.setHeader('X-RateLimit-Reset', new Date(userData.windowStart + RATE_LIMIT_WINDOW_MS).toISOString());

    next();
}

/**
 * Get rate limit status for a user
 */
function getRateLimitStatus(userId) {
    const userData = userRequestCounts.get(userId);
    const now = Date.now();

    if (!userData || now - userData.windowStart > RATE_LIMIT_WINDOW_MS) {
        return {
            limit: MAX_REQUESTS_PER_WINDOW,
            remaining: MAX_REQUESTS_PER_WINDOW,
            resetAt: new Date(now + RATE_LIMIT_WINDOW_MS).toISOString(),
        };
    }

    return {
        limit: MAX_REQUESTS_PER_WINDOW,
        remaining: MAX_REQUESTS_PER_WINDOW - userData.requestCount,
        resetAt: new Date(userData.windowStart + RATE_LIMIT_WINDOW_MS).toISOString(),
    };
}

/**
 * Reset rate limit for a user (admin function)
 */
function resetUserRateLimit(userId) {
    userRequestCounts.delete(userId);
}

module.exports = {
    aiRateLimiter,
    getRateLimitStatus,
    resetUserRateLimit,
};
