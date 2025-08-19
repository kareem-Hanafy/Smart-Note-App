const express = require('express');
const router = express.Router();

// Import middleware and controller
const { authenticate } = require('../../middleware/auth.middleware');
const { validate } = require('../../middleware/validation.middleware');
const { handleUpload } = require('../../middleware/upload.middleware');
const {
    registerSchema,
    loginSchema,
    forgetPasswordSchema,
    resetPasswordSchema
} = require('../../middleware/validation.middleware');
const authController = require('./auth.controller');

// Auth routes
router.post('/register', validate(registerSchema), authController.register);
router.post('/login', validate(loginSchema), authController.login);
router.patch('/upload-profile-pic', authenticate, handleUpload, authController.uploadProfilePic);
router.post('/logout', authenticate, authController.logout);
router.post('/forget-password', validate(forgetPasswordSchema), authController.forgetPassword);
router.post('/reset-password', validate(resetPasswordSchema), authController.resetPassword);

module.exports = router;
