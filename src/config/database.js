const mongoose = require('mongoose');

/**
 * Database configuration options
 */
const dbOptions = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    maxPoolSize: 10, // Maintain up to 10 socket connections
    serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
    socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
    bufferMaxEntries: 0 // Disable mongoose buffering
};

/**
 * Handle MongoDB connection events for monitoring
 */
const handleConnectionEvents = () => {
    mongoose.connection.on('error', (error) => {
        console.error('❌ MongoDB connection error:', error);
    });

    mongoose.connection.on('disconnected', () => {
        console.log('⚠️ MongoDB disconnected');
    });

    mongoose.connection.on('reconnected', () => {
        console.log('✅ MongoDB reconnected');
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
        await mongoose.connection.close();
        console.log('🔄 MongoDB connection closed through app termination');
        process.exit(0);
    });
};

/**
 * Connect to MongoDB database
 * @returns {Promise} MongoDB connection promise
 */
const connectDB = async () => {
    try {
        const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/smart-note-app';

        await mongoose.connect(mongoUri, dbOptions);
        console.log('✅ Connected to MongoDB successfully');

        // Handle connection events
        handleConnectionEvents();

        return mongoose.connection;
    } catch (error) {
        console.error('❌ MongoDB connection failed:', error.message);
        process.exit(1);
    }
};

/**
 * Get current connection status
 * @returns {string} Connection status
 */
const getConnectionStatus = () => {
    const states = {
        0: 'disconnected',
        1: 'connected',
        2: 'connecting',
        3: 'disconnecting'
    };
    return states[mongoose.connection.readyState];
};

module.exports = {
    connectDB,
    getConnectionStatus,
    connection: mongoose.connection
};
