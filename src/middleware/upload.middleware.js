const multer = require('multer');
const path = require('path');
const fs = require('fs');
const createError = require('http-errors');

// Simple upload configuration
const uploadDir = path.join(__dirname, '../../uploads');

// Ensure upload directory exists
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Simple storage configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
        cb(null, uniqueName);
    }
});

// Basic file filter
const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];

    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(createError(400, 'Only image files are allowed'), false);
    }
};

// Simple upload middleware
const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
});

// Single file upload
const uploadSingle = upload.single('file');

// Upload middleware with error handling
const handleUpload = (req, res, next) => {
    uploadSingle(req, res, (err) => {
        if (err) {
            if (err instanceof multer.MulterError) {
                if (err.code === 'LIMIT_FILE_SIZE') {
                    return next(createError(400, 'File too large. Maximum size is 5MB'));
                }
            }
            return next(err);
        }

        if (!req.file) {
            return next(createError(400, 'No file uploaded'));
        }

        next();
    });
};

module.exports = {
    handleUpload
};
