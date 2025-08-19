const mongoose = require('mongoose');

// Simple database connection
const connectDB = async () => {
    try {
        const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/smart-note-app';

        await mongoose.connect(mongoUri);
        console.log('✅ Connected to MongoDB successfully');

        return mongoose.connection;
    } catch (error) {
        console.error('❌ MongoDB connection failed:', error.message);
        process.exit(1);
    }
};

module.exports = {
    connectDB
};
