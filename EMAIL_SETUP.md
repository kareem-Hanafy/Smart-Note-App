# Email Configuration Guide

## Required Environment Variables

Create a `.env` file in your project root with the following variables:

```env
# Email Configuration (Required for password reset)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM_EMAIL=your-email@gmail.com
SMTP_SECURE=false
```

## Gmail Setup Instructions

### 1. Enable 2-Factor Authentication
- Go to your Google Account settings
- Enable 2-Factor Authentication

### 2. Generate App Password
- Go to Google Account → Security → App passwords
- Select "Mail" and your device
- Copy the generated 16-character password
- Use this password as `SMTP_PASS`

### 3. Alternative: Less Secure Apps (Not Recommended)
- Only works if 2FA is disabled
- Go to Google Account → Security → Less secure app access
- Turn on "Allow less secure apps"

## Other Email Providers

### Outlook/Hotmail
```env
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_SECURE=false
```

### Yahoo
```env
SMTP_HOST=smtp.mail.yahoo.com
SMTP_PORT=587
SMTP_SECURE=false
```

### Custom SMTP Server
```env
SMTP_HOST=your-smtp-server.com
SMTP_PORT=587
SMTP_USER=your-username
SMTP_PASS=your-password
SMTP_FROM_EMAIL=noreply@yourdomain.com
```

## Testing Email Configuration

### 1. Start the server
```bash
npm start
```

### 2. Check console output
You should see:
- ✅ Email configuration verified successfully
- Or ⚠️ Email not configured warning

### 3. Test password reset
Use the test API:
```bash
POST http://localhost:3000/api/auth/forget-password
Content-Type: application/json

{
  "email": "your-email@example.com"
}
```

## Troubleshooting

### Common Issues

1. **"Email not configured" error**
   - Check that all SMTP environment variables are set
   - Verify `.env` file is in project root

2. **"Authentication failed" error**
   - Verify email and password are correct
   - For Gmail, use App Password instead of regular password
   - Check if 2FA is enabled

3. **"Connection timeout" error**
   - Check internet connection
   - Verify SMTP host and port
   - Try different port (465 with SSL, 587 with TLS)

4. **"Invalid credentials" error**
   - Double-check email and password
   - Ensure App Password is generated correctly
   - Try logging in to email provider directly

### Debug Mode

Add this to your `.env` file for detailed email logs:
```env
DEBUG=nodemailer:*
```

## Security Best Practices

1. **Never commit `.env` file to version control**
2. **Use App Passwords instead of regular passwords**
3. **Enable 2-Factor Authentication**
4. **Use environment-specific configurations**
5. **Regularly rotate App Passwords**

## Production Deployment

For production, consider using:
- **SendGrid**: `npm install @sendgrid/mail`
- **Mailgun**: `npm install mailgun.js`
- **AWS SES**: `npm install @aws-sdk/client-ses`
- **Resend**: `npm install resend`

These services provide better deliverability and monitoring.
