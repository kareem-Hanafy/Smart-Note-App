const express = require('express');
const cors = require('cors');
const createError = require('http-errors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const { createHandler } = require('graphql-http/lib/use/express');
const notesSchema = require('./modules/notes/notes.graphql');
require('dotenv').config();

const app = express();

// Connect to database
const { connectDB } = require('./config/database');
connectDB();

// Verify email configuration
const { verifyEmailConfig } = require('./config/email.config');
verifyEmailConfig().then(isConfigured => {
    if (isConfigured) {
        console.log('📧 Email service is configured and ready');
    } else {
        console.log('⚠️  Email service is not configured - password reset will not work');
    }
});

// Basic security and rate limiting
app.use(helmet());
app.use(rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
}));

// Basic middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// API Routes

app.use('/api/auth', require('./modules/auth/auth.routes'));
app.use('/api/notes', require('./modules/notes/notes.routes'));

// GraphQL endpoint
const { authenticate } = require('./middleware/auth.middleware');

// Test endpoint to verify authentication
app.get('/test-auth', authenticate, (req, res) => {
    res.json({
        message: 'Authentication working',
        user: req.user ? { id: req.user._id, email: req.user.email } : null
    });
});

// GraphQL endpoint with authentication
app.all('/graphql', authenticate, (req, res) => {
    const handler = createHandler({
        schema: notesSchema,
        context: () => {
            return { user: req.user };
        }
    });

    handler(req, res);
});

// Health check
app.get('/health', (req, res) => {
    res.json({ message: 'Smart Note App is running' });
});

// Handle 404
app.use((req, res, next) => {
    next(createError(404, 'Route not found'));
});

// Simple error handler
app.use((err, req, res, next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || 'Internal Server Error';

    res.status(status).json({
        success: false,
        message
    });
});

module.exports = app;
