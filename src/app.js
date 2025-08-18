const express = require('express');
const cors = require('cors');
const createError = require('http-errors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const dotenv = require('dotenv');
const morgan = require('morgan');

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();

// Connect to database
const { connectDB } = require('./config/database');
connectDB();

// CORS configuration
const corsOptions = {
    origin: process.env.CORS_ORIGIN || '*',
    credentials: process.env.CORS_CREDENTIALS === 'true',
    optionSuccessStatus: 200,
};

// Rate limiting configuration
const limiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
    message: {
        error: 'Too many requests from this IP',
        message: 'Please try again later',
        retryAfter: Math.ceil((parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000) / 1000)
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// Middleware
app.use(cors(corsOptions));
app.use(helmet());
app.use(limiter);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware (only in development)
if (process.env.NODE_ENV !== 'production') {
    app.use(morgan('dev'));
}

// Serve static files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// API Routes
// TODO: Add your route modules here
// app.use('/api/auth', require('./modules/auth/auth.routes'));
// app.use('/api/notes', require('./modules/notes/notes.routes'));

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Smart Note App is running',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
    });
});

// Handle undefined routes (404)
app.use((req, res, next) => {
    next(createError(404, 'This router does not exist'));
});

// Global error handler
app.use((err, req, res, next) => {
    // Set default error values
    let statusCode = err.statusCode || err.status || 500;
    let message = err.message || 'Internal Server Error';
    let errors = null;

    // Handle specific error types
    if (err.name === 'ValidationError') {
        // Mongoose validation errors
        statusCode = 400;
        message = 'Validation failed';
        errors = Object.keys(err.errors).map(field => ({
            field,
            message: err.errors[field].message,
            rejectedValue: err.errors[field].value
        }));
    } else if (err.name === 'MongoError' || err.name === 'MongooseError') {
        // MongoDB errors
        if (err.code === 11000) {
            statusCode = 409;
            message = 'Resource already exists';
            const field = Object.keys(err.keyValue)[0];
            const value = err.keyValue[field];
            errors = [{
                field,
                message: `${field} '${value}' already exists`,
                rejectedValue: value
            }];
        }
    } else if (err.name === 'CastError') {
        // MongoDB ObjectId cast errors
        statusCode = 400;
        message = 'Invalid ID format';
        errors = [{
            field: err.path,
            message: `Invalid ${err.path} format`
        }];
    } else if (err.name === 'JsonWebTokenError') {
        // JWT errors
        statusCode = 401;
        message = 'Invalid authentication token';
    } else if (err.name === 'TokenExpiredError') {
        // JWT expiration errors
        statusCode = 401;
        message = 'Authentication token expired';
    } else if (err.name === 'MulterError') {
        // File upload errors
        statusCode = 400;
        switch (err.code) {
            case 'LIMIT_FILE_SIZE':
                message = `File size too large. Maximum size: ${process.env.MAX_FILE_SIZE || '5MB'}`;
                break;
            case 'LIMIT_FILE_COUNT':
                message = 'Too many files uploaded';
                break;
            case 'LIMIT_UNEXPECTED_FILE':
                message = 'Unexpected file field';
                break;
            default:
                message = err.message || 'File upload failed';
        }
    }

    // Log errors (only in development)
    if (process.env.NODE_ENV !== 'production') {
        console.error('🔥 Error occurred:', {
            message: err.message,
            stack: err.stack,
            url: req.url,
            method: req.method,
            ip: req.ip,
            timestamp: new Date().toISOString()
        });
    } else {
        // Log critical errors in production without sensitive data
        if (statusCode >= 500) {
            console.error('🔥 Server Error:', {
                message: err.message,
                url: req.url,
                method: req.method,
                timestamp: new Date().toISOString()
            });
        }
    }

    // Sanitize error message for production
    if (process.env.NODE_ENV === 'production' && statusCode >= 500) {
        message = 'Internal Server Error';
        errors = null;
    }

    // Send error response
    const errorResponse = {
        success: false,
        error: {
            status: statusCode,
            message,
            ...(errors && { errors }),
            ...(process.env.NODE_ENV !== 'production' && err.stack && { stack: err.stack }),
            timestamp: new Date().toISOString(),
            path: req.path,
            method: req.method
        }
    };

    res.status(statusCode).json(errorResponse);
});

// Handle uncaught exceptions and unhandled rejections
process.on('uncaughtException', (err) => {
    console.error('🔥 Uncaught Exception:', err);
    console.error('Shutting down application...');
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('🔥 Unhandled Rejection at:', promise, 'reason:', reason);
    console.error('Shutting down application...');
    process.exit(1);
});

module.exports = app;


