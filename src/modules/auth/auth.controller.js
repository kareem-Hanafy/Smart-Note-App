const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const createError = require('http-errors');

const User = require('../../models/User.model');
const Token = require('../../models/Token.model');
const jwtConfig = require('../../config/jwt.config');
const { sendOTPEmail, verifyEmailConfig } = require('../../config/email.config');

/**
 * Register new user
 */
const register = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return next(createError(400, 'User with this email already exists'));
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 12);

        // Create user
        const user = new User({
            email,
            password: hashedPassword
        });

        await user.save();

        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            data: {
                id: user._id,
                email: user.email,
                isVerified: user.isVerified
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Login user
 */
const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        // Find user
        const user = await User.findOne({ email });
        if (!user) {
            return next(createError(401, 'Invalid email or password'));
        }

        // Validate password
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            return next(createError(401, 'Invalid email or password'));
        }

        // Generate JWT
        const payload = {
            sub: user._id.toString(),
            email: user.email
        };

        const token = jwt.sign(
            { payload },
            jwtConfig.privateKey,
            jwtConfig.getSignOptions(crypto.randomUUID(), user._id.toString())
        );

        res.json({
            success: true,
            message: 'Login successful',
            data: {
                user: {
                    id: user._id,
                    email: user.email,
                    isVerified: user.isVerified
                },
                token
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Upload profile picture
 */
const uploadProfilePic = async (req, res, next) => {
    try {
        const userId = req.user._id;
        const filePath = req.file.path;

        // Update user with profile picture path
        await User.findByIdAndUpdate(userId, { profilePicture: filePath });

        res.json({
            success: true,
            message: 'Profile picture updated successfully',
            data: {
                filePath
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Logout user (revoke token)
 */
const logout = async (req, res, next) => {
    try {
        // For simple implementation, just send success
        // In production, you might want to blacklist the token
        res.json({
            success: true,
            message: 'Logout successful'
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Send OTP for password reset
 */
const forgetPassword = async (req, res, next) => {
    try {
        const { email } = req.body;

        // Check if user exists
        const user = await User.findOne({ email });
        if (!user) {
            return next(createError(404, 'User not found'));
        }

        // Check for existing unexpired OTP tokens
        const existingToken = await Token.findOne({
            userId: user._id,
            type: 'reset',
            expiresAt: { $gt: new Date() }
        });

        if (existingToken) {
            const timeLeft = Math.ceil((existingToken.expiresAt - new Date()) / 1000 / 60);
            return next(createError(429, `Please wait ${timeLeft} minutes before requesting another OTP`));
        }

        // Generate OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        // Save OTP token
        const token = new Token({
            userId: user._id,
            token: otp,
            type: 'reset',
            expiresAt
        });

        await token.save();

        // Send OTP email
        try {
            await sendOTPEmail(email, otp);
        } catch (emailError) {
            // Clean up the token if email fails
            await Token.findByIdAndDelete(token._id);
            console.error('Failed to send OTP email:', emailError.message);
            return next(createError(500, 'Failed to send OTP email. Please try again later.'));
        }

        res.json({
            success: true,
            message: 'OTP sent to your email address. Valid for 10 minutes.'
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Reset password with OTP
 */
const resetPassword = async (req, res, next) => {
    try {
        const { email, otp, newPassword } = req.body;

        // Validate new password
        if (!newPassword || newPassword.length < 6) {
            return next(createError(400, 'Password must be at least 6 characters long'));
        }

        // Find user
        const user = await User.findOne({ email });
        if (!user) {
            return next(createError(404, 'User not found'));
        }

        // Verify OTP
        const tokenRecord = await Token.findOne({
            userId: user._id,
            token: otp,
            type: 'reset',
            expiresAt: { $gt: new Date() }
        });
        console.log("tokenRecord:", tokenRecord);

        if (!tokenRecord) {
            return next(createError(400, 'Invalid or expired OTP'));
        }

        // Check if new password is same as current password
        const isSamePassword = await bcrypt.compare(newPassword, user.password);
        if (isSamePassword) {
            return next(createError(400, 'New password must be different from current password'));
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 12);

        // Update password
        await User.findByIdAndUpdate(user._id, { password: hashedPassword });

        // Delete used token
        await Token.findByIdAndDelete(tokenRecord._id);

        res.json({
            success: true,
            message: 'Password reset successfully'
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    register,
    login,
    uploadProfilePic,
    logout,
    forgetPassword,
    resetPassword
};
