# Quick Setup: SendGrid in Render

## Immediate Steps to Configure SendGrid

### 1. Go to Render Dashboard
Navigate to your backend service: https://dashboard.render.com

### 2. Add Environment Variables

Go to **Environment** tab and add/update these variables:

```
SENDGRID_API_KEY=your-sendgrid-api-key-here
DEFAULT_FROM_EMAIL=ishimwechloee@gmail.com
DEFAULT_FROM_NAME=Kigali Business Lab
```

### 3. Verify Sender Email in SendGrid

**CRITICAL:** Before emails will work, you MUST verify the sender email:

1. Go to https://app.sendgrid.com/
2. Navigate to **Settings** → **Sender Authentication**
3. Click **Verify a Single Sender**
4. Enter: `ishimwechloee@gmail.com`
5. Fill in required information
6. Check your email and click the verification link

### 4. Save and Redeploy

1. Click **"Save Changes"** in Render
2. Wait for automatic redeployment (2-3 minutes)

### 5. Test

After deployment, try registering a new user and check:
- Backend logs for email sending status
- Email inbox (including spam folder) for verification email

## How It Works

The application will automatically detect the `SENDGRID_API_KEY` and use SendGrid instead of SMTP. No need to set `EMAIL_BACKEND` manually.

## Troubleshooting

- **Emails not sending?** → Check if sender email is verified in SendGrid
- **Check logs** → Look for SendGrid-specific error messages
- **Check SendGrid dashboard** → Go to Activity → Email Activity to see delivery status

