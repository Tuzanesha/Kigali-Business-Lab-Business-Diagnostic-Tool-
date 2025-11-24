# Production Fixes Guide

This document addresses the three main issues you're experiencing in production.

## Issue 1: Team Members Table Missing (500 Error)

**Error**: `relation "team_members" does not exist`

**Solution**: Run migrations in production

### Option A: Automatic (Recommended)
Migrations should run automatically on deployment via the `startCommand` in `render.yaml`. If they didn't, redeploy your service.

### Option B: Manual via Render Shell
1. Go to your Render dashboard
2. Navigate to your web service (`kbl-backend`)
3. Click on "Shell" tab
4. Run:
```bash
python manage.py migrate
```

### Option C: Using the Migration Check Command
```bash
python manage.py run_migrations
```

This will:
- Check database connection
- Show pending migrations
- Run all pending migrations
- Verify that `team_members` table exists

## Issue 2: Avatar/Profile Picture Not Updating

**Problem**: Avatar uploads work but images return 404 errors

**Fixes Applied**:
1. ✅ Media files now served in production (not just DEBUG mode)
2. ✅ Better error handling in avatar upload
3. ✅ File validation (size, type)
4. ✅ Old avatar deletion before upload

### Additional Steps for Production:

#### Option A: Use Cloud Storage (Recommended for Production)
For better performance and reliability, consider using:
- **AWS S3** with `django-storages`
- **Cloudinary** with `django-cloudinary-storage`
- **Google Cloud Storage**

#### Option B: Current Setup (Works but Limited)
The current setup serves media files through Django, which works but has limitations:
- Files are stored on the server (ephemeral in Render)
- Better for small files only
- Consider moving to cloud storage for production

### Verify Avatar Upload:
1. Upload an avatar via the API
2. Check the returned `avatar_url`
3. Try accessing the URL directly
4. Check Render logs for any errors

## Issue 3: Email Not Arriving (Resend Verification)

**Problem**: Logs show emails sent successfully, but emails don't arrive

### Possible Causes & Solutions:

#### 1. Check SendGrid Configuration
Verify in Render environment variables:
- `SENDGRID_API_KEY` is set correctly
- `DEFAULT_FROM_EMAIL` is verified in SendGrid
- `DEFAULT_FROM_NAME` is set

#### 2. Check Email Spam Folder
- SendGrid emails might go to spam initially
- Check spam/junk folder
- Mark as "Not Spam" if found

#### 3. Verify SendGrid Account Status
- Log into SendGrid dashboard
- Check if account is active
- Verify sender authentication
- Check activity logs in SendGrid

#### 4. Check SendGrid Sandbox Mode
In `settings.py`, `SENDGRID_SANDBOX_MODE_IN_DEBUG` is set to `False`, which is correct for production.

#### 5. Enhanced Logging
The code now includes detailed logging:
- Email sending attempts
- SendGrid API key status
- From/To addresses
- Verification URLs
- Error details

Check your Render logs for these details.

### Debug Email Issues:

1. **Check SendGrid Activity Logs**:
   - Go to SendGrid Dashboard → Activity
   - Look for your email sends
   - Check for any errors or bounces

2. **Test Email Sending**:
   ```bash
   # In Render Shell
   python manage.py test_email your-email@example.com
   ```

3. **Check Environment Variables**:
   ```bash
   # In Render Shell
   python manage.py shell
   ```
   Then:
   ```python
   import os
   print("SENDGRID_API_KEY:", "SET" if os.getenv('SENDGRID_API_KEY') else "NOT SET")
   print("DEFAULT_FROM_EMAIL:", os.getenv('DEFAULT_FROM_EMAIL'))
   ```

4. **Verify Email Domain**:
   - The `from_email` must be verified in SendGrid
   - Check SendGrid → Settings → Sender Authentication

## Quick Fix Checklist

### For Team Members Table:
- [ ] Run `python manage.py migrate` in Render Shell
- [ ] Verify with `python manage.py run_migrations --check-only`
- [ ] Redeploy if migrations didn't run automatically

### For Avatar Upload:
- [ ] Verify media files are accessible (check URL)
- [ ] Check file permissions in Render
- [ ] Consider moving to cloud storage for production

### For Email Issues:
- [ ] Verify SendGrid API key in Render environment
- [ ] Check SendGrid dashboard for activity
- [ ] Verify sender email in SendGrid
- [ ] Check spam folder
- [ ] Review enhanced logs in Render

## Testing After Fixes

1. **Test Team Endpoint**:
   ```bash
   curl -H "Authorization: Bearer YOUR_TOKEN" \
        https://business-diagnostic-tool.onrender.com/api/team/
   ```

2. **Test Avatar Upload**:
   ```bash
   curl -X POST \
        -H "Authorization: Bearer YOUR_TOKEN" \
        -F "avatar=@/path/to/image.jpg" \
        https://business-diagnostic-tool.onrender.com/api/account/avatar/upload/
   ```

3. **Test Email Resend**:
   ```bash
   curl -X POST \
        -H "Content-Type: application/json" \
        -d '{"email":"your-email@example.com"}' \
        https://business-diagnostic-tool.onrender.com/api/auth/resend-verification-email/
   ```

## Additional Notes

- **Media Files**: For production, consider using cloud storage (S3, Cloudinary) instead of serving through Django
- **Email Deliverability**: Ensure your SendGrid account is properly configured and sender is verified
- **Database Migrations**: Always run migrations after code deployments that include model changes
- **Logs**: Check Render logs regularly for errors and warnings

## Need Help?

If issues persist:
1. Check Render logs for detailed error messages
2. Verify all environment variables are set correctly
3. Test each component individually
4. Check SendGrid dashboard for email delivery status

