const nodemailer = require('nodemailer');

// Email configuration
const emailConfig = {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT) || 587,
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    from: process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER,
    secure: process.env.SMTP_SECURE === 'true' || false
};

// Create transporter with better error handling
const createTransporter = () => {
    if (!emailConfig.user || !emailConfig.pass) {
        console.warn('⚠️  Email not configured. Set SMTP_USER and SMTP_PASS environment variables.');
        return null;
    }

    try {
        return nodemailer.createTransport({
            host: emailConfig.host,
            port: emailConfig.port,
            secure: emailConfig.secure,
            auth: {
                user: emailConfig.user,
                pass: emailConfig.pass
            },
            // Add timeout and connection settings
            connectionTimeout: 10000,
            greetingTimeout: 10000,
            socketTimeout: 10000
        });
    } catch (error) {
        console.error('❌ Failed to create email transporter:', error.message);
        return null;
    }
};

const transporter = createTransporter();

/**
 * Verify email configuration
 */
const verifyEmailConfig = async () => {
    if (!transporter) {
        return false;
    }

    try {
        await transporter.verify();
        console.log('✅ Email configuration verified successfully');
        return true;
    } catch (error) {
        console.error('❌ Email configuration verification failed:', error.message);
        return false;
    }
};

/**
 * Send OTP email for password reset with HTML template
 */
const sendOTPEmail = async (email, otp) => {
    if (!transporter) {
        throw new Error('Email not configured. Please set SMTP_USER and SMTP_PASS environment variables.');
    }

    const htmlTemplate = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>Password Reset OTP</title>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: #007bff; color: white; padding: 20px; text-align: center; }
                .content { padding: 20px; background: #f8f9fa; }
                .otp { font-size: 32px; font-weight: bold; text-align: center; color: #007bff; padding: 20px; background: white; margin: 20px 0; }
                .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Smart Note App</h1>
                </div>
                <div class="content">
                    <h2>Password Reset Request</h2>
                    <p>You have requested to reset your password. Use the following OTP to complete the process:</p>
                    <div class="otp">${otp}</div>
                    <p><strong>This OTP is valid for 10 minutes only.</strong></p>
                    <p>If you didn't request this password reset, please ignore this email.</p>
                </div>
                <div class="footer">
                    <p>This is an automated message from Smart Note App</p>
                </div>
            </div>
        </body>
        </html>
    `;

    const mailOptions = {
        from: `"Smart Note App" <${emailConfig.from}>`,
        to: email,
        subject: 'Password Reset OTP - Smart Note App',
        text: `Your password reset OTP is: ${otp}. Valid for 10 minutes.`,
        html: htmlTemplate
    };

    try {
        const result = await transporter.sendMail(mailOptions);
        console.log(`✅ OTP email sent successfully to ${email}`);
        return result;
    } catch (error) {
        console.error(`❌ Failed to send OTP email to ${email}:`, error.message);
        throw new Error(`Failed to send email: ${error.message}`);
    }
};

module.exports = {
    sendOTPEmail,
    verifyEmailConfig,
    isEmailConfigured: () => !!transporter
};
