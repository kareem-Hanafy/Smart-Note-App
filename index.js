/**
 * Entry point for Smart Note App
 * Sets up the server and handles graceful shutdown
 */
const app = require('./src/app');

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
    console.log(`🚀 Smart Note App running on port ${PORT}`);
    console.log(`📋 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🌐 Health check: http://localhost:${PORT}/health`);
});

// Graceful shutdown handlers
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down gracefully');
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});