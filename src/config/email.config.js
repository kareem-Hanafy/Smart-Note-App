const nodemailer = require('nodemailer');

// Simple email configuration
const emailConfig = {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT) || 587,
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    from: process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER
};

// Create transporter
const transporter = emailConfig.user && emailConfig.pass ?
    nodemailer.createTransport({
        host: emailConfig.host,
        port: emailConfig.port,
        secure: false,
        auth: {
            user: emailConfig.user,
            pass: emailConfig.pass
        }
    }) : null;

/**
 * Send OTP email for password reset
 */
const sendOTPEmail = async (email, otp) => {
    if (!transporter) {
        throw new Error('Email not configured');
    }

    const mailOptions = {
        from: emailConfig.from,
        to: email,
        subject: 'Password Reset OTP',
        text: `Your password reset OTP is: ${otp}. Valid for 10 minutes.`
    };

    return await transporter.sendMail(mailOptions);
};

module.exports = {
    sendOTPEmail
};
