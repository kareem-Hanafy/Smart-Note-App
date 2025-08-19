const createError = require('http-errors');
const { graphql } = require('graphql');
const Note = require('../../models/Note.model');
const notesSchema = require('./notes.graphql');

/**
 * Create a new note
 */
const createNote = async (req, res, next) => {
    try {
        const { title, content } = req.body;
        const ownerId = req.user._id;

        const note = new Note({
            title,
            content,
            ownerId
        });

        await note.save();

        res.status(201).json({
            success: true,
            message: 'Note created successfully',
            data: note
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get all notes for authenticated user using GraphQL
 */
const getNotes = async (req, res, next) => {
    try {
        const { userId, title, createdFrom, createdTo, page, limit } = req.query;

        // Build GraphQL query
        const query = `
            query GetNotes($userId: ID, $title: String, $createdFrom: String, $createdTo: String, $page: Int, $limit: Int) {
                notes(userId: $userId, title: $title, createdFrom: $createdFrom, createdTo: $createdTo, page: $page, limit: $limit) {
                    notes {
                        id
                        title
                        content
                        owner {
                            id
                            email
                            isVerified
                        }
                        createdAt
                        updatedAt
                    }
                    totalCount
                    currentPage
                    totalPages
                    hasNextPage
                    hasPrevPage
                }
            }
        `;

        const variables = {
            userId,
            title,
            createdFrom,
            createdTo,
            page: page ? parseInt(page) : 1,
            limit: limit ? parseInt(limit) : 10
        };

        const result = await graphql({
            schema: notesSchema,
            source: query,
            variableValues: variables,
            contextValue: { user: req.user }
        });

        if (result.errors) {
            return next(createError(400, result.errors[0].message));
        }

        res.json({
            success: true,
            message: 'Notes retrieved successfully',
            data: result.data.notes
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get note by ID with owner info
 */
const getNoteById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const ownerId = req.user._id;

        const note = await Note.findOne({ _id: id, ownerId })
            .populate('ownerId', 'email isVerified')
            .lean();

        if (!note) {
            return next(createError(404, 'Note not found'));
        }

        res.json({
            success: true,
            message: 'Note retrieved successfully',
            data: {
                id: note._id,
                title: note.title,
                content: note.content,
                owner: {
                    id: note.ownerId._id,
                    email: note.ownerId.email,
                    isVerified: note.ownerId.isVerified
                },
                createdAt: note.createdAt,
                updatedAt: note.updatedAt
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Update note by ID
 */
const updateNote = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { title, content } = req.body;
        const ownerId = req.user._id;

        const note = await Note.findOneAndUpdate(
            { _id: id, ownerId },
            { title, content },
            { new: true, runValidators: true }
        );

        if (!note) {
            return next(createError(404, 'Note not found'));
        }

        res.json({
            success: true,
            message: 'Note updated successfully',
            data: note
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Delete note by ID
 */
const deleteNote = async (req, res, next) => {
    try {
        const { id } = req.params;
        const ownerId = req.user._id;

        const note = await Note.findOneAndDelete({ _id: id, ownerId });

        if (!note) {
            return next(createError(404, 'Note not found'));
        }

        res.json({
            success: true,
            message: 'Note deleted successfully',
            data: { id: note._id }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Search notes by title
 */
const searchNotes = async (req, res, next) => {
    try {
        const { search } = req.query;
        const ownerId = req.user._id;

        let query = { ownerId };

        if (search) {
            query.$text = { $search: search };
        }

        const notes = await Note.find(query)
            .populate('ownerId', 'email isVerified')
            .sort({ createdAt: -1 })
            .lean();

        res.json({
            success: true,
            message: 'Search completed successfully',
            data: notes,
            count: notes.length
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    createNote,
    getNotes,
    getNoteById,
    updateNote,
    deleteNote,
    searchNotes
};
