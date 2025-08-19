const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    content: {
        type: String,
        required: true
    },
    ownerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, {
    timestamps: true
});

// Index for querying notes by owner
noteSchema.index({ ownerId: 1 });

// Text index for searching notes by title
noteSchema.index({ title: 'text' });

// Compound index for efficient filtering by owner and creation date
noteSchema.index({ ownerId: 1, createdAt: -1 });

// Index for date range queries
noteSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Note', noteSchema);