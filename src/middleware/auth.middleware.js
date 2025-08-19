const jwt = require('jsonwebtoken');
const jwtConfig = require('../config/jwt.config');
const User = require('../models/User.model');
const createError = require('http-errors');

/**
 * Verify JWT token and authenticate user
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

        // Verify user still exists
        const user = await User.findById(decoded.sub).select('-password');
        if (!user) {
            throw createError(401, 'User not found');
        }

        // Attach user info to request
        req.user = user;

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
 * Simple ownership check for notes
 * Ensures users can only access their own notes
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const requireOwnership = (req, res, next) => {
    if (!req.user) {
        return next(createError(401, 'Authentication required'));
    }

    // This will be used in note routes to verify ownership
    next();
};



module.exports = {
    authenticate,
    optionalAuthenticate,
    requireOwnership
};
