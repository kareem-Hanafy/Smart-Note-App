/**
 * Constants for API response messages and error messages
 * Centralized location for all user-facing messages
 */

const SUCCESS_MESSAGES = {
    // Authentication
    REGISTER_SUCCESS: 'User registered successfully',
    LOGIN_SUCCESS: 'Login successful',
    LOGOUT_SUCCESS: 'Logout successful',
    PROFILE_UPDATED: 'Profile picture updated successfully',
    PASSWORD_RESET_OTP_SENT: 'OTP sent to your email address',
    PASSWORD_RESET_SUCCESS: 'Password reset successfully',

    // Notes
    NOTE_CREATED: 'Note created successfully',
    NOTE_UPDATED: 'Note updated successfully',
    NOTE_DELETED: 'Note deleted successfully',
    NOTES_RETRIEVED: 'Notes retrieved successfully',

    // General
    OPERATION_SUCCESS: 'Operation completed successfully'
};

const ERROR_MESSAGES = {
    // Authentication Errors
    INVALID_CREDENTIALS: 'Invalid email or password',
    USER_ALREADY_EXISTS: 'User with this email already exists',
    USER_NOT_FOUND: 'User not found',
    INVALID_TOKEN: 'Invalid or expired token',
    TOKEN_REVOKED: 'Token has been revoked',
    ACCESS_DENIED: 'Access denied',
    UNAUTHORIZED: 'Authentication required',

    // Password Reset Errors
    INVALID_OTP: 'Invalid or expired OTP',
    OTP_ALREADY_USED: 'OTP has already been used',
    OTP_EXPIRED: 'OTP has expired',

    // File Upload Errors
    FILE_NOT_FOUND: 'File not found',
    INVALID_FILE_TYPE: 'Invalid file type',
    FILE_SIZE_EXCEEDED: 'File size exceeds maximum allowed limit',
    UPLOAD_FAILED: 'File upload failed',

    // Notes Errors
    NOTE_NOT_FOUND: 'Note not found',
    NOTE_ACCESS_DENIED: 'You do not have permission to access this note',
    INVALID_NOTE_DATA: 'Invalid note data provided',

    // Validation Errors
    VALIDATION_FAILED: 'Validation failed',
    REQUIRED_FIELD_MISSING: 'Required field missing',
    INVALID_FORMAT: 'Invalid format',
    INVALID_ID_FORMAT: 'Invalid ID format',

    // Server Errors
    INTERNAL_SERVER_ERROR: 'Internal server error',
    DATABASE_ERROR: 'Database operation failed',
    SERVICE_UNAVAILABLE: 'Service temporarily unavailable',

    // Rate Limiting
    TOO_MANY_REQUESTS: 'Too many requests. Please try again later',
    AUTH_RATE_LIMIT: 'Too many authentication attempts. Please try again after 15 minutes',

    // General
    BAD_REQUEST: 'Bad request',
    FORBIDDEN: 'Forbidden',
    NOT_FOUND: 'Resource not found',
    ROUTER_NOT_FOUND: 'This router does not exist',
    METHOD_NOT_ALLOWED: 'Method not allowed'
};

const HTTP_STATUS = {
    // Success
    OK: 200,
    CREATED: 201,
    ACCEPTED: 202,
    NO_CONTENT: 204,

    // Client Errors
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    METHOD_NOT_ALLOWED: 405,
    CONFLICT: 409,
    UNPROCESSABLE_ENTITY: 422,
    TOO_MANY_REQUESTS: 429,

    // Server Errors
    INTERNAL_SERVER_ERROR: 500,
    BAD_GATEWAY: 502,
    SERVICE_UNAVAILABLE: 503,
    GATEWAY_TIMEOUT: 504
};

const VALIDATION_PATTERNS = {
    EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    STRONG_PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
    MODERATE_PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
    OBJECT_ID: /^[0-9a-fA-F]{24}$/,
    OTP: /^\d{6}$/,
    PHONE: /^\+?[1-9]\d{1,14}$/,
    USERNAME: /^[a-zA-Z0-9_]{3,30}$/
};

const FILE_UPLOAD = {
    MAX_SIZE: 5 * 1024 * 1024, // 5MB
    ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'],
    ALLOWED_EXTENSIONS: ['.jpg', '.jpeg', '.png', '.webp', '.gif'],
    UPLOAD_DIRECTORIES: {
        PROFILES: 'uploads/profiles',
        ATTACHMENTS: 'uploads/attachments'
    }
};

const PAGINATION = {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 10,
    MAX_LIMIT: 100
};

const SECURITY = {
    BCRYPT_SALT_ROUNDS: 12,
    JWT_EXPIRY: '24h',
    OTP_EXPIRY_MINUTES: 10,
    OTP_LENGTH: 6,
    MAX_LOGIN_ATTEMPTS: 5,
    LOCKOUT_TIME: 15 * 60 * 1000 // 15 minutes
};

const RATE_LIMITS = {
    GENERAL: {
        WINDOW_MS: 15 * 60 * 1000, // 15 minutes
        MAX_REQUESTS: 100
    },
    AUTH: {
        WINDOW_MS: 15 * 60 * 1000, // 15 minutes  
        MAX_REQUESTS: 5
    },
    PASSWORD_RESET: {
        WINDOW_MS: 60 * 60 * 1000, // 1 hour
        MAX_REQUESTS: 3
    }
};

module.exports = {
    SUCCESS_MESSAGES,
    ERROR_MESSAGES,
    HTTP_STATUS,
    VALIDATION_PATTERNS,
    FILE_UPLOAD,
    PAGINATION,
    SECURITY,
    RATE_LIMITS
};
