const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const createError = require('http-errors');

/**
 * Parse file size string to bytes
 * @param {string} sizeStr - Size string like '5MB', '1GB'
 * @returns {number} Size in bytes
 */
function parseFileSize(sizeStr) {
    const units = {
        'B': 1,
        'KB': 1024,
        'MB': 1024 * 1024,
        'GB': 1024 * 1024 * 1024
    };

    const match = sizeStr.match(/^(\d+(?:\.\d+)?)\s*(B|KB|MB|GB)$/i);
    if (!match) {
        return 5 * 1024 * 1024; // Default 5MB
    }

    const [, size, unit] = match;
    return parseFloat(size) * units[unit.toUpperCase()];
}

/**
 * Upload configuration
 */
const uploadConfig = {
    uploadDir: process.env.UPLOAD_PATH || path.join(__dirname, '../../uploads'),
    maxFileSize: parseFileSize(process.env.MAX_FILE_SIZE || '5MB'),
    allowedMimeTypes: [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/webp',
        'image/gif'
    ],
    allowedExtensions: ['.jpg', '.jpeg', '.png', '.webp', '.gif']
};

/**
 * Ensure upload directories exist
 */
function ensureDirectories() {
    const profileDir = path.join(uploadConfig.uploadDir, 'profiles');
    [uploadConfig.uploadDir, profileDir].forEach(dir => {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
            console.log(`✅ Created upload directory: ${dir}`);
        }
    });
}

// Ensure upload directories exist
const profileDir = path.join(uploadConfig.uploadDir, 'profiles');
ensureDirectories();

/**
 * Generate unique filename to prevent collisions
 * @param {string} originalName - Original filename
 * @param {string} userId - User ID for namespacing
 * @returns {string} Unique filename
 */
const generateUniqueFilename = (originalName, userId) => {
    const ext = path.extname(originalName).toLowerCase();
    const nameWithoutExt = path.basename(originalName, ext);
    const timestamp = Date.now();
    const randomBytes = crypto.randomBytes(6).toString('hex');

    // Create filename: userId_originalName_timestamp_random.ext
    const cleanName = nameWithoutExt.replace(/[^a-zA-Z0-9]/g, '_');
    return `${userId}_${cleanName}_${timestamp}_${randomBytes}${ext}`;
};

/**
 * Configure multer storage for profile pictures
 */
const getProfileStorage = () => {
    return multer.diskStorage({
        destination: (req, file, cb) => {
            cb(null, profileDir);
        },
        filename: (req, file, cb) => {
            try {
                const userId = req.user._id.toString();
                const uniqueFilename = generateUniqueFilename(file.originalname, userId);

                // Store the generated filename in request for later use
                req.uploadedFilename = uniqueFilename;

                cb(null, uniqueFilename);
            } catch (error) {
                cb(error, null);
            }
        }
    });
};

/**
 * File filter for validating uploaded files
 * @param {Object} req - Express request object
 * @param {Object} file - Multer file object
 * @param {Function} cb - Callback function
 */
const fileFilter = (req, file, cb) => {
    try {
        // Check MIME type
        if (!uploadConfig.allowedMimeTypes.includes(file.mimetype)) {
            const error = createError(400, `Invalid file type. Allowed types: ${uploadConfig.allowedMimeTypes.join(', ')}`);
            return cb(error, false);
        }

        // Check file extension
        const ext = path.extname(file.originalname).toLowerCase();
        if (!uploadConfig.allowedExtensions.includes(ext)) {
            const error = createError(400, `Invalid file extension. Allowed extensions: ${uploadConfig.allowedExtensions.join(', ')}`);
            return cb(error, false);
        }

        // Additional security checks
        if (file.originalname.length > 255) {
            const error = createError(400, 'Filename too long');
            return cb(error, false);
        }

        // Check for suspicious filenames
        if (file.originalname.includes('..') || file.originalname.includes('/') || file.originalname.includes('\\')) {
            const error = createError(400, 'Invalid filename');
            return cb(error, false);
        }

        cb(null, true);
    } catch (error) {
        cb(error, false);
    }
};

/**
 * Get multer configuration for profile picture upload
 * @returns {Object} Multer middleware
 */
const getProfileUpload = () => {
    return multer({
        storage: getProfileStorage(),
        fileFilter,
        limits: {
            fileSize: uploadConfig.maxFileSize,
            files: 1, // Only allow one file at a time
            fields: 5, // Limit number of form fields
            fieldNameSize: 100, // Limit field name size
            fieldSize: 1024 * 1024 // Limit field value size to 1MB
        }
    }).single('profilePicture'); // Expect single file with field name 'profilePicture'
};

/**
 * Middleware to handle profile picture upload
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const uploadProfile = (req, res, next) => {
    const upload = getProfileUpload();

    upload(req, res, (err) => {
        if (err) {
            // Handle multer-specific errors
            if (err instanceof multer.MulterError) {
                switch (err.code) {
                    case 'LIMIT_FILE_SIZE':
                        return next(createError(400, `File size too large. Maximum size: ${process.env.MAX_FILE_SIZE || '5MB'}`));
                    case 'LIMIT_FILE_COUNT':
                        return next(createError(400, 'Too many files. Only one file allowed.'));
                    case 'LIMIT_UNEXPECTED_FILE':
                        return next(createError(400, 'Unexpected file field. Use "profilePicture" field name.'));
                    default:
                        return next(createError(400, err.message));
                }
            }
            return next(err);
        }

        // Validate that a file was uploaded
        if (!req.file) {
            return next(createError(400, 'No file uploaded. Please select a profile picture.'));
        }

        // Add file metadata to request
        req.fileMetadata = {
            originalName: req.file.originalname,
            filename: req.file.filename,
            path: req.file.path,
            size: req.file.size,
            mimetype: req.file.mimetype,
            uploadedAt: new Date()
        };

        next();
    });
};

/**
 * Delete old profile picture when user uploads a new one
 * @param {string} oldFilePath - Path to old file
 */
const deleteOldProfilePicture = async (oldFilePath) => {
    if (!oldFilePath) return;

    try {
        const fullPath = path.resolve(oldFilePath);

        // Security check: ensure file is in uploads directory
        const uploadsPath = path.resolve(process.env.UPLOAD_PATH || path.join(__dirname, '../../uploads'));
        if (!fullPath.startsWith(uploadsPath)) {
            console.warn('⚠️ Attempted to delete file outside uploads directory:', fullPath);
            return;
        }

        if (fs.existsSync(fullPath)) {
            fs.unlinkSync(fullPath);
            console.log(`✅ Deleted old profile picture: ${oldFilePath}`);
        }
    } catch (error) {
        console.error('❌ Failed to delete old profile picture:', error.message);
    }
};

/**
 * Get file URL for client access
 * @param {string} filename - Filename
 * @returns {string} File URL
 */
const getFileUrl = (filename) => {
    if (!filename) return null;
    const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
    return `${baseUrl}/uploads/profiles/${filename}`;
};

/**
 * Validate file exists and is accessible
 * @param {string} filePath - File path to validate
 * @returns {boolean} Whether file exists and is valid
 */
const validateFile = (filePath) => {
    try {
        if (!filePath) return false;

        const fullPath = path.resolve(filePath);
        const uploadsPath = path.resolve(process.env.UPLOAD_PATH || path.join(__dirname, '../../uploads'));

        // Security check: ensure file is in uploads directory
        if (!fullPath.startsWith(uploadsPath)) {
            return false;
        }

        return fs.existsSync(fullPath);
    } catch (error) {
        return false;
    }
};

module.exports = {
    uploadProfile,
    deleteOldProfilePicture,
    getFileUrl,
    validateFile,
    uploadConfig
};
