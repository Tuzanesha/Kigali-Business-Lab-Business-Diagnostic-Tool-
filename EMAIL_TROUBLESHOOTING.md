# 📧 Email Troubleshooting Guide

## ⚠️ Issue: Verification Email Not Received

If the system says "email sent" but you don't receive it, follow these steps:

---

## 🔍 Step 1: Check Backend Logs

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Open your **backend service**
3. Go to **"Logs"** tab
4. Look for email-related errors or messages

**Look for:**
- `✅ Successfully sent verification email` - Email was sent successfully
- `❌ Failed to send verification email` - Email sending failed
- SMTP errors
- Authentication errors

---

## ⚙️ Step 2: Verify Email Environment Variables

Go to your backend service → **Environment** tab and verify these are set:

### Required Email Settings:

```bash
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password
DEFAULT_FROM_EMAIL=your-email@gmail.com
```

### Important Notes:

1. **EMAIL_HOST_USER**: Your Gmail address
2. **EMAIL_HOST_PASSWORD**: **NOT your regular Gmail password!**
   - You need a **Gmail App Password**
   - See Step 3 below for how to create one
3. **DEFAULT_FROM_EMAIL**: Should match EMAIL_HOST_USER

---

## 🔑 Step 3: Create Gmail App Password

If you're using Gmail, you **must** use an App Password, not your regular password:

### For Gmail:

1. Go to your [Google Account](https://myaccount.google.com/)
2. Click **Security** (left sidebar)
3. Under **"Signing in to Google"**, enable **2-Step Verification** (if not already enabled)
4. After enabling 2-Step Verification:
   - Go back to **Security**
   - Click **"App passwords"** (under "Signing in to Google")
   - Select **"Mail"** and **"Other (Custom name)"**
   - Enter a name like "KBL Business Diagnostic"
   - Click **"Generate"**
   - **Copy the 16-character password** (no spaces)
5. Use this App Password as `EMAIL_HOST_PASSWORD` in Render

**Important:** 
- App passwords are 16 characters, no spaces
- Format: `xxxx xxxx xxxx xxxx` (but enter without spaces: `xxxxxxxxxxxxxxxx`)
- If you can't see "App passwords", make sure 2-Step Verification is enabled

---

## 📋 Step 4: Test Email Configuration

### Option A: Use Django Management Command (If you have shell access)

If you upgrade to a paid plan and get shell access, you can test:

```bash
python manage.py test_email your-email@gmail.com
```

### Option B: Check Logs After Registration

1. Try registering a new user
2. Immediately check backend logs
3. Look for:
   - Email sending success/failure messages
   - SMTP connection errors
   - Authentication errors

---

## 🐛 Common Issues & Solutions

### Issue 1: "SMTP Authentication failed"

**Cause:** Wrong password or not using App Password

**Solution:**
- Verify you're using a Gmail App Password (not regular password)
- Make sure `EMAIL_HOST_USER` is correct
- Check for extra spaces in `EMAIL_HOST_PASSWORD`

### Issue 2: "Connection refused" or "Connection timeout"

**Cause:** Wrong SMTP settings or firewall

**Solution:**
- Verify `EMAIL_HOST=smtp.gmail.com`
- Verify `EMAIL_PORT=587`
- Verify `EMAIL_USE_TLS=True`
- Try `EMAIL_PORT=465` with `EMAIL_USE_SSL=True` instead (alternative Gmail setting)

### Issue 3: Email goes to Spam

**Cause:** Email provider filtering

**Solution:**
- Check spam/junk folder
- Mark as "Not Spam" if found
- Add sender email to contacts
- Check if `DEFAULT_FROM_EMAIL` matches `EMAIL_HOST_USER`

### Issue 4: "Less secure app access" error

**Cause:** Gmail blocking the connection

**Solution:**
- Use App Password (see Step 3)
- Don't try to enable "Less secure app access" (deprecated by Google)

### Issue 5: No errors but email not received

**Possible causes:**
1. Email in spam folder (check spam/junk)
2. Wrong email address entered
3. Email provider blocking
4. Delay in delivery (wait 1-2 minutes)

**Solution:**
- Check spam folder thoroughly
- Verify email address is correct
- Try a different email address
- Wait a few minutes and check again

---

## 🔄 Step 5: Alternative Email Providers

If Gmail doesn't work, you can use other providers:

### SendGrid (Recommended for Production)

```bash
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=apikey
EMAIL_HOST_PASSWORD=your-sendgrid-api-key
DEFAULT_FROM_EMAIL=your-email@yourdomain.com
```

### Mailgun

```bash
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.mailgun.org
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-mailgun-username
EMAIL_HOST_PASSWORD=your-mailgun-password
DEFAULT_FROM_EMAIL=your-email@yourdomain.com
```

### Outlook/Office 365

```bash
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.office365.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@outlook.com
EMAIL_HOST_PASSWORD=your-password
DEFAULT_FROM_EMAIL=your-email@outlook.com
```

---

## ✅ Verification Checklist

Use this to verify your email setup:

- [ ] `EMAIL_BACKEND` is set to `django.core.mail.backends.smtp.EmailBackend`
- [ ] `EMAIL_HOST` is correct for your provider
- [ ] `EMAIL_PORT` is correct (587 for TLS, 465 for SSL)
- [ ] `EMAIL_USE_TLS=True` (or `EMAIL_USE_SSL=True` for port 465)
- [ ] `EMAIL_HOST_USER` is your email address
- [ ] `EMAIL_HOST_PASSWORD` is correct (App Password for Gmail)
- [ ] `DEFAULT_FROM_EMAIL` matches `EMAIL_HOST_USER`
- [ ] All environment variables are saved in Render
- [ ] Backend service has been redeployed after setting variables
- [ ] No email errors in backend logs

---

## 🧪 Quick Test

After updating email settings:

1. **Redeploy** your backend service
2. **Try registering** a new user
3. **Check logs** for email sending status
4. **Check email inbox** (and spam folder)
5. **Wait 1-2 minutes** if email doesn't arrive immediately

---

## 📞 Need More Help?

If emails still don't work:

1. **Check backend logs** for specific error messages
2. **Verify all environment variables** are set correctly
3. **Try a different email provider** (SendGrid, Mailgun)
4. **Test with a different email address**
5. **Check if your email provider blocks automated emails**

---

## 🎯 Most Common Solution

**90% of email issues are solved by:**
1. Using a **Gmail App Password** (not regular password)
2. Ensuring all environment variables are set correctly
3. Redeploying the backend after setting variables
4. Checking spam folder

Try these first!

