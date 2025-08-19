const express = require('express');
const router = express.Router();

// Import middleware and controller
const { authenticate, requireOwnership } = require('../../middleware/auth.middleware');
const { validate } = require('../../middleware/validation.middleware');
const {
    createNoteSchema,
    updateNoteSchema,
    objectIdParamSchema,
    searchNotesSchema
} = require('../../middleware/validation.middleware');
const notesController = require('./notes.controller');

// All routes require authentication
router.use(authenticate);

// Search notes (must be before /:id route)
router.get('/search', validate(searchNotesSchema), notesController.searchNotes);

// Notes CRUD routes
router.post('/', validate(createNoteSchema), notesController.createNote);
router.get('/', validate(searchNotesSchema), notesController.getNotes);
router.get('/:id', validate(objectIdParamSchema), notesController.getNoteById);
router.put('/:id', validate(updateNoteSchema), notesController.updateNote);
router.delete('/:id', validate(objectIdParamSchema), notesController.deleteNote);

module.exports = router;
