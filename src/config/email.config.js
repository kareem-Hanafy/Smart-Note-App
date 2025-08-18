const nodemailer = require('nodemailer');

/**
 * Email configuration options
 */
const emailConfig = {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true' || false, // true for 465, false for other ports
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    fromName: process.env.SMTP_FROM_NAME || 'Smart Note App',
    fromEmail: process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER
};

/**
 * Create nodemailer transporter with configuration
 * @returns {Object|null} Transporter instance or null if not configured
 */
const createTransporter = () => {
    if (!emailConfig.user || !emailConfig.pass) {
        console.warn('⚠️ SMTP credentials not configured. Email functionality will be disabled.');
        return null;
    }

    const transporter = nodemailer.createTransporter({
        host: emailConfig.host,
        port: emailConfig.port,
        secure: emailConfig.secure,
        auth: {
            user: emailConfig.user,
            pass: emailConfig.pass
        },
        tls: {
            rejectUnauthorized: false // Allow self-signed certificates in development
        }
    });

    console.log('✅ Email transporter configured successfully');
    return transporter;
};

// Initialize transporter
const transporter = createTransporter();

/**
 * Verify SMTP connection
 * @returns {Promise<boolean>} Connection status
 */
const verifyConnection = async () => {
    if (!transporter) {
        return false;
    }

    try {
        await transporter.verify();
        console.log('✅ SMTP connection verified');
        return true;
    } catch (error) {
        console.error('❌ SMTP connection failed:', error.message);
        return false;
    }
};

/**
 * Send email with specified options
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.html - HTML content
 * @param {string} options.text - Plain text content
 * @returns {Promise<Object>} Send result
 */
const sendEmail = async ({ to, subject, html, text }) => {
    if (!transporter) {
        throw new Error('Email transporter not configured. Check SMTP settings.');
    }

    const mailOptions = {
        from: `"${emailConfig.fromName}" <${emailConfig.fromEmail}>`,
        to,
        subject,
        html,
        text
    };

    try {
        const result = await transporter.sendMail(mailOptions);
        console.log(`✅ Email sent successfully to ${to}`);
        return result;
    } catch (error) {
        console.error(`❌ Failed to send email to ${to}:`, error.message);
        throw error;
    }
};

/**
 * Send OTP email for password reset
 * @param {string} email - Recipient email
 * @param {string} otp - OTP code
 * @param {number} expiryMinutes - OTP expiry time in minutes
 * @returns {Promise<Object>} Send result
 */
const sendOTPEmail = async (email, otp, expiryMinutes = 10) => {
    const subject = 'Password Reset OTP - Smart Note App';
    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #333; text-align: center;">Password Reset Request</h2>
            <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p style="font-size: 16px; color: #555;">Hello,</p>
                <p style="font-size: 16px; color: #555;">
                    You requested to reset your password for Smart Note App. 
                    Use the OTP code below to reset your password:
                </p>
                <div style="text-align: center; margin: 30px 0;">
                    <span style="font-size: 32px; font-weight: bold; color: #007bff; letter-spacing: 5px; padding: 15px 30px; border: 2px dashed #007bff; display: inline-block; border-radius: 8px;">
                        ${otp}
                    </span>
                </div>
                <p style="font-size: 14px; color: #777; text-align: center;">
                    This OTP is valid for ${expiryMinutes} minutes only and can be used once.
                </p>
                <p style="font-size: 14px; color: #777;">
                    If you didn't request this password reset, please ignore this email.
                    Your account remains secure.
                </p>
            </div>
            <div style="text-align: center; margin-top: 30px;">
                <p style="font-size: 12px; color: #999;">
                    This is an automated email from Smart Note App. Please do not reply.
                </p>
            </div>
        </div>
    `;

    const text = `
        Password Reset Request - Smart Note App
        
        Hello,
        
        You requested to reset your password for Smart Note App.
        Use this OTP code to reset your password: ${otp}
        
        This OTP is valid for ${expiryMinutes} minutes only and can be used once.
        
        If you didn't request this password reset, please ignore this email.
        Your account remains secure.
    `;

    return sendEmail({ to: email, subject, html, text });
};

module.exports = {
    transporter,
    verifyConnection,
    sendEmail,
    sendOTPEmail,
    emailConfig
};
