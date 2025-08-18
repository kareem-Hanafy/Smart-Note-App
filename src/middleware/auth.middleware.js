const jwt = require('jsonwebtoken');
const jwtConfig = require('../config/jwt.config');
const Token = require('../models/Token.model');
const User = require('../models/User.model');
const createError = require('http-errors');
const rateLimit = require('express-rate-limit');

/**
 * Verify JWT token and authenticate user
 * Checks token validity, expiration, and revocation status
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object  
 * @param {Function} next - Express next function
 */
const authenticate = async (req, res, next) => {
    try {
        // Extract token from Authorization header
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw createError(401, 'Access token required');
        }

        const token = authHeader.substring(7); // Remove 'Bearer ' prefix

        if (!token) {
            throw createError(401, 'Access token required');
        }

        // Verify token signature and decode
        let decoded;
        try {
            const result = jwt.verify(token, jwtConfig.publicKey, jwtConfig.getVerifyOptions());
            decoded = result.payload;
        } catch (jwtError) {
            if (jwtError.name === 'TokenExpiredError') {
                throw createError(401, 'Token expired');
            } else if (jwtError.name === 'JsonWebTokenError') {
                throw createError(401, 'Invalid token');
            } else {
                throw createError(401, 'Token verification failed');
            }
        }

        // Check if token is revoked
        const revokedToken = await Token.findOne({
            jti: decoded.jti,
            isRevoked: true
        });

        if (revokedToken) {
            throw createError(401, 'Token has been revoked');
        }

        // Verify user still exists
        const user = await User.findById(decoded.sub).select('-password');
        if (!user) {
            throw createError(401, 'User not found');
        }

        // Attach user and token info to request
        req.user = user;
        req.tokenJti = decoded.jti;
        req.tokenExp = decoded.exp;

        next();
    } catch (error) {
        next(error);
    }
};

/**
 * Optional authentication middleware
 * Continues without error if no token provided, but validates if token exists
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const optionalAuthenticate = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        // If no authorization header, continue without authentication
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return next();
        }

        // If header exists, validate the token
        await authenticate(req, res, next);
    } catch (error) {
        // For optional auth, continue even if token is invalid
        next();
    }
};

/**
 * Check if user has admin privileges
 * Must be used after authenticate middleware
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const requireAdmin = (req, res, next) => {
    if (!req.user) {
        return next(createError(401, 'Authentication required'));
    }

    if (req.user.role !== 'admin') {
        return next(createError(403, 'Admin privileges required'));
    }

    next();
};

/**
 * Check if authenticated user owns the resource
 * Compares req.user.id with req.params.userId or req.body.userId
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const checkOwnership = (req, res, next) => {
    if (!req.user) {
        return next(createError(401, 'Authentication required'));
    }

    const resourceUserId = req.params.userId || req.body.userId || req.body.ownerId;

    if (!resourceUserId) {
        return next(createError(400, 'Resource owner ID not provided'));
    }

    if (req.user._id.toString() !== resourceUserId.toString()) {
        return next(createError(403, 'Access denied. You can only access your own resources.'));
    }

    next();
};

/**
 * Rate limiting for authentication attempts
 * Prevents brute force attacks on login/register endpoints
 */
const getAuthRateLimit = () => {
    return rateLimit({
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 5, // limit each IP to 5 requests per windowMs
        message: {
            error: 'Too many authentication attempts',
            message: 'Please try again after 15 minutes',
            retryAfter: 15 * 60 * 1000
        },
        standardHeaders: true,
        legacyHeaders: false,
        // Only apply to failed attempts
        skipSuccessfulRequests: true
    });
};

/**
 * Extract user ID from JWT token without full authentication
 * Used for logging and analytics
 * 
 * @param {Object} req - Express request object
 * @returns {string|null} User ID or null if no valid token
 */
const extractUserIdFromToken = (req) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return null;
        }

        const token = authHeader.substring(7);
        const result = jwt.verify(token, jwtConfig.publicKey, jwtConfig.getVerifyOptions());
        return result.payload.sub;
    } catch (error) {
        return null;
    }
};

module.exports = {
    authenticate,
    optionalAuthenticate,
    requireAdmin,
    checkOwnership,
    getAuthRateLimit,
    extractUserIdFromToken
};
