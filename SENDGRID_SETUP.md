# SendGrid Email Configuration Guide

This guide explains how to configure SendGrid for sending emails in the KBL Business Diagnostic Tool.

## Overview

The application now uses SendGrid as the primary email backend when a SendGrid API key is configured. This provides better reliability, deliverability, and email tracking compared to SMTP.

## Setup Instructions

### Step 1: Configure Environment Variables

Go to your **backend service** on Render → **Environment** tab and add/update these variables:

```bash
# SendGrid Configuration
SENDGRID_API_KEY=your-sendgrid-api-key-here
DEFAULT_FROM_EMAIL=ishimwechloee@gmail.com
DEFAULT_FROM_NAME=Kigali Business Lab

# Optional: Override email backend explicitly (not required)
# EMAIL_BACKEND=config.email_backends.SendGridEmailBackend
```

### Step 2: Verify SendGrid Sender Authentication

**Important:** Before emails can be sent, you need to verify your sender email address in SendGrid:

1. Go to [SendGrid Dashboard](https://app.sendgrid.com/)
2. Navigate to **Settings** → **Sender Authentication**
3. Click **Verify a Single Sender**
4. Enter your email: `ishimwechloee@gmail.com`
5. Fill in the required information
6. Check your email inbox for a verification email
7. Click the verification link

**Note:** Until the sender is verified, SendGrid will not send emails. Verification is required for all sender addresses.

### Step 3: Redeploy Backend

After setting environment variables:
1. Click **"Save Changes"** in Render
2. Render will automatically redeploy
3. Wait for deployment to complete (2-3 minutes)

### Step 4: Test Email Sending

After deployment:
1. Try registering a new user
2. Check backend logs for email sending status
3. Check email inbox (and spam folder) for verification email

## How It Works

The email backend selection follows this priority:

1. **EMAIL_BACKEND** environment variable (if explicitly set)
2. **SendGrid** (if `SENDGRID_API_KEY` is present)
3. **SMTP** (if configured)
4. **Console backend** (in DEBUG mode only)

If `SENDGRID_API_KEY` is set, the application will automatically use SendGrid without needing to set `EMAIL_BACKEND`.

## Environment Variables Reference

### Required for SendGrid

- `SENDGRID_API_KEY`: Your SendGrid API key
- `DEFAULT_FROM_EMAIL`: Email address to send from (must be verified in SendGrid)

### Optional

- `DEFAULT_FROM_NAME`: Display name for the sender (default: "Kigali Business Lab")
- `EMAIL_BACKEND`: Override backend selection (usually not needed)

## Troubleshooting

### Emails Not Sending

1. **Check Sender Verification**
   - Ensure `ishimwechloee@gmail.com` is verified in SendGrid
   - Check SendGrid dashboard for verification status

2. **Check API Key**
   - Verify `SENDGRID_API_KEY` is set correctly in Render
   - Ensure there are no extra spaces or quotes

3. **Check Backend Logs**
   - Look for SendGrid-specific error messages
   - Check for API authentication errors

4. **Check SendGrid Dashboard**
   - Go to **Activity** → **Email Activity** in SendGrid
   - Look for failed delivery attempts
   - Check for error reasons

### Common Errors

#### "Sender email not verified"
- **Solution**: Verify the sender email in SendGrid dashboard

#### "API key invalid"
- **Solution**: Check that `SENDGRID_API_KEY` is correct and has no extra characters

#### "Permission denied"
- **Solution**: Ensure the API key has "Mail Send" permissions

## Switching Back to SMTP

If you need to switch back to SMTP temporarily:

1. Remove or unset `SENDGRID_API_KEY` in Render
2. Set these environment variables:
   ```bash
   EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USE_TLS=True
   EMAIL_HOST_USER=your-email@gmail.com
   EMAIL_HOST_PASSWORD=your-app-password
   DEFAULT_FROM_EMAIL=your-email@gmail.com
   ```
3. Redeploy

## Local Development

For local development, the application will use:
- **SendGrid** if `SENDGRID_API_KEY` is set in your `.env` file
- **Console backend** (prints to console) if DEBUG=True and no SendGrid key
- **SMTP** if configured and no SendGrid key

Add to your local `.env` file:
```bash
SENDGRID_API_KEY=your-sendgrid-api-key-here
DEFAULT_FROM_EMAIL=ishimwechloee@gmail.com
DEFAULT_FROM_NAME=Kigali Business Lab
```

## Benefits of SendGrid

- ✅ Better deliverability rates
- ✅ Email tracking and analytics
- ✅ Better spam handling
- ✅ No need for Gmail App Passwords
- ✅ Scalable for high volume
- ✅ Better error messages and debugging

## Additional Resources

- [SendGrid Documentation](https://docs.sendgrid.com/)
- [SendGrid Python SDK](https://github.com/sendgrid/sendgrid-python)
- [Django Email Backends](https://docs.djangoproject.com/en/stable/topics/email/#email-backends)

