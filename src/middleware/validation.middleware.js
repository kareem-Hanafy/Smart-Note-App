const Joi = require('joi');
const createError = require('http-errors');

/**
 * Generic validation middleware factory
 * @param {Object} schema - Joi schema object with body, params, query properties
 * @returns {Function} Express middleware function
 */
const validate = (schema) => {
    return (req, res, next) => {
        const validationErrors = [];

        // Validate request body
        if (schema.body) {
            const { error } = schema.body.validate(req.body, { abortEarly: false });
            if (error) {
                validationErrors.push(...formatJoiError(error, 'body'));
            }
        }

        // Validate request parameters
        if (schema.params) {
            const { error } = schema.params.validate(req.params, { abortEarly: false });
            if (error) {
                validationErrors.push(...formatJoiError(error, 'params'));
            }
        }

        // Validate query parameters
        if (schema.query) {
            const { error } = schema.query.validate(req.query, { abortEarly: false });
            if (error) {
                validationErrors.push(...formatJoiError(error, 'query'));
            }
        }

        // If validation errors exist, return them
        if (validationErrors.length > 0) {
            const error = createError(400, validationErrors[0].message);
            error.errors = validationErrors;
            return next(error);
        }

        next();
    };
};

/**
 * Format Joi validation errors into consistent structure
 * @param {Object} joiError - Joi validation error
 * @param {string} location - Location of error (body, params, query)
 * @returns {Array} Formatted error array
 */
const formatJoiError = (joiError, location) => {
    return joiError.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message.replace(/['"]/g, ''),
        rejectedValue: detail.context.value,
        location
    }));
};

// Validation Schemas

/**
 * Validation schema for user registration
 */
const registerSchema = {
    body: Joi.object({
        email: Joi.string()
            .email()
            .required()
            .messages({
                'string.email': 'Please provide a valid email address',
                'any.required': 'Email is required'
            }),
        password: Joi.string()
            .min(6)
            .required()
            .messages({
                'string.min': 'Password must be at least 6 characters long',
                'any.required': 'Password is required'
            })
    })
};

/**
 * Validation schema for user login
 */
const loginSchema = {
    body: Joi.object({
        email: Joi.string()
            .email()
            .required()
            .messages({
                'string.email': 'Please provide a valid email address',
                'any.required': 'Email is required'
            }),
        password: Joi.string()
            .required()
            .messages({
                'any.required': 'Password is required'
            })
    })
};

/**
 * Validation schema for forget password
 */
const forgetPasswordSchema = {
    body: Joi.object({
        email: Joi.string()
            .email()
            .required()
            .messages({
                'string.email': 'Please provide a valid email address',
                'any.required': 'Email is required'
            })
    })
};

/**
 * Validation schema for reset password
 */
const resetPasswordSchema = {
    body: Joi.object({
        email: Joi.string()
            .email()
            .required()
            .messages({
                'string.email': 'Please provide a valid email address',
                'any.required': 'Email is required'
            }),
        otp: Joi.string()
            .length(6)
            .pattern(/^\d{6}$/)
            .required()
            .messages({
                'string.length': 'OTP must be exactly 6 digits',
                'string.pattern.base': 'OTP must contain only numbers',
                'any.required': 'OTP is required'
            }),
        newPassword: Joi.string()
            .min(6)
            .required()
            .messages({
                'string.min': 'Password must be at least 6 characters long', 'any.required': 'New password is required'
            })
    })
};

/**
 * Validation schema for creating notes
 */
const createNoteSchema = {
    body: Joi.object({
        title: Joi.string()
            .min(1)
            .max(200)
            .trim()
            .required()
            .messages({
                'string.min': 'Title cannot be empty',
                'string.max': 'Title cannot exceed 200 characters',
                'any.required': 'Title is required'
            }),
        content: Joi.string()
            .required()
            .messages({
                'any.required': 'Content is required'
            })
    })
};

/**
 * Validation schema for updating notes
 */
const updateNoteSchema = {
    body: Joi.object({
        title: Joi.string()
            .min(1)
            .max(200)
            .trim()
            .optional()
            .messages({
                'string.min': 'Title cannot be empty',
                'string.max': 'Title cannot exceed 200 characters'
            }),
        content: Joi.string()
            .optional()
    }).min(1), // At least one field must be provided
    params: Joi.object({
        id: Joi.string()
            .pattern(/^[0-9a-fA-F]{24}$/)
            .required()
            .messages({
                'string.pattern.base': 'Invalid note ID format',
                'any.required': 'Note ID is required'
            })
    })
};

/**
 * Validation schema for getting notes with GraphQL filters
 */
const searchNotesSchema = {
    query: Joi.object({
        userId: Joi.string()
            .pattern(/^[0-9a-fA-F]{24}$/)
            .optional()
            .messages({
                'string.pattern.base': 'Invalid user ID format'
            }),
        title: Joi.string()
            .optional(),
        createdFrom: Joi.date()
            .iso()
            .optional()
            .messages({
                'date.format': 'Created from date must be in ISO format'
            }),
        createdTo: Joi.date()
            .iso()
            .optional()
            .messages({
                'date.format': 'Created to date must be in ISO format'
            }),
        page: Joi.number()
            .integer()
            .min(1)
            .optional()
            .messages({
                'number.min': 'Page must be at least 1'
            }),
        limit: Joi.number()
            .integer()
            .min(1)
            .max(100)
            .optional()
            .messages({
                'number.min': 'Limit must be at least 1',
                'number.max': 'Limit cannot exceed 100'
            }),
        search: Joi.string()
            .optional()
    })
};

/**
 * Validation schema for MongoDB ObjectId parameters
 */
const objectIdParamSchema = {
    params: Joi.object({
        id: Joi.string()
            .pattern(/^[0-9a-fA-F]{24}$/)
            .required()
            .messages({
                'string.pattern.base': 'Invalid ID format',
                'any.required': 'ID is required'
            })
    })
};

/**
 * Sanitize input to prevent XSS attacks
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const sanitizeInput = (req, res, next) => {
    // Basic XSS prevention - remove script tags and javascript: URLs
    const sanitize = (obj) => {
        if (typeof obj === 'string') {
            return obj
                .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
                .replace(/javascript:/gi, '')
                .replace(/on\w+="[^"]*"/gi, '')
                .replace(/on\w+='[^']*'/gi, '');
        } else if (typeof obj === 'object' && obj !== null) {
            for (const key in obj) {
                obj[key] = sanitize(obj[key]);
            }
        }
        return obj;
    };

    if (req.body) req.body = sanitize(req.body);
    if (req.query) req.query = sanitize(req.query);
    if (req.params) req.params = sanitize(req.params);

    next();
};

module.exports = {
    validate,
    sanitizeInput,
    // Schema exports
    registerSchema,
    loginSchema,
    forgetPasswordSchema,
    resetPasswordSchema,
    createNoteSchema,
    updateNoteSchema,
    searchNotesSchema,
    objectIdParamSchema
};