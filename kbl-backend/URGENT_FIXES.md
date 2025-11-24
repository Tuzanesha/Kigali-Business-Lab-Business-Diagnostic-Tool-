# URGENT: Production Fixes Required

## Issue 1: Team Members Table Missing (CRITICAL)

**Error**: `relation "team_members" does not exist`

**Status**: ❌ NOT FIXED - Migrations need to be run

### Immediate Fix:

1. **Go to Render Dashboard** → Your Web Service → **Shell** tab

2. **Run migrations**:
   ```bash
   python manage.py migrate
   ```

3. **Or use the diagnostic tool**:
   ```bash
   python manage.py fix_production_issues --fix
   ```

4. **Verify the table exists**:
   ```bash
   python manage.py run_migrations --check-only
   ```

**Why this happened**: The `team_members` table migration exists in your code but hasn't been applied to your production database yet.

---

## Issue 2: Email Verification Not Arriving

**Status**: ⚠️ NEEDS INVESTIGATION - Emails show as sent but don't arrive

### Possible Causes:

1. **SendGrid Sandbox Mode** (Most Likely)
   - If SendGrid is in sandbox mode, emails only go to verified recipients
   - Check your SendGrid dashboard → Settings → Sender Authentication
   - Verify your sender email (`ishimwechloee@gmail.com`) is verified

2. **Email Going to Spam**
   - Check spam/junk folder
   - Mark as "Not Spam" if found
   - Add sender to contacts

3. **SendGrid Account Issues**
   - Check SendGrid dashboard → Activity
   - Look for bounces, blocks, or errors
   - Verify account is not suspended

4. **Rate Limiting**
   - Free SendGrid accounts have limits
   - Check if you've exceeded daily/monthly limits

### Immediate Actions:

1. **Check SendGrid Dashboard**:
   - Go to https://app.sendgrid.com
   - Navigate to **Activity** → **Email Activity**
   - Look for your recent sends
   - Check status (delivered, bounced, blocked, etc.)

2. **Verify Sender**:
   - Go to **Settings** → **Sender Authentication**
   - Verify `ishimwechloee@gmail.com` is authenticated
   - If not, authenticate it

3. **Check Environment Variables in Render**:
   - Go to Render Dashboard → Your Service → Environment
   - Verify `SENDGRID_API_KEY` is set correctly
   - Verify `DEFAULT_FROM_EMAIL` matches your verified sender

4. **Run Diagnostic**:
   ```bash
   python manage.py fix_production_issues
   ```
   This will show you the exact configuration status.

5. **Test Email Sending**:
   ```bash
   python manage.py test_email your-email@example.com
   ```

### If Emails Still Don't Arrive:

1. **Check SendGrid Activity Logs** - Most important!
2. **Try a different email provider** (temporarily) to test
3. **Check if your domain/IP is blacklisted**
4. **Contact SendGrid support** if account issues

---

## Issue 3: Avatar/Media Files Not Persisting

**Status**: ⚠️ EXPECTED BEHAVIOR - Render's filesystem is ephemeral

**Problem**: Files uploaded to Render are lost when the service restarts.

### Current Behavior:
- ✅ Avatar upload works (file is saved)
- ❌ File is lost on service restart (Render's filesystem is ephemeral)
- ❌ File URL returns 404 after restart

### Solutions:

#### Option A: Use Cloud Storage (RECOMMENDED for Production)

**Using AWS S3**:
1. Install: `pip install django-storages boto3`
2. Add to `requirements.txt`
3. Configure in `settings.py`:
   ```python
   DEFAULT_FILE_STORAGE = 'storages.backends.s3boto3.S3Boto3Storage'
   AWS_ACCESS_KEY_ID = os.getenv('AWS_ACCESS_KEY_ID')
   AWS_SECRET_ACCESS_KEY = os.getenv('AWS_SECRET_ACCESS_KEY')
   AWS_STORAGE_BUCKET_NAME = os.getenv('AWS_STORAGE_BUCKET_NAME')
   AWS_S3_REGION_NAME = os.getenv('AWS_S3_REGION_NAME', 'us-east-1')
   ```

**Using Cloudinary** (Easier):
1. Install: `pip install cloudinary django-cloudinary-storage`
2. Add to `requirements.txt`
3. Configure in `settings.py`:
   ```python
   import cloudinary
   import cloudinary.uploader
   import cloudinary.api
   
   CLOUDINARY = {
       'cloud_name': os.getenv('CLOUDINARY_CLOUD_NAME'),
       'api_key': os.getenv('CLOUDINARY_API_KEY'),
       'api_secret': os.getenv('CLOUDINARY_API_SECRET'),
   }
   ```

#### Option B: Accept Ephemeral Storage (Current)
- Files work until service restarts
- Users need to re-upload after restarts
- Not ideal for production

---

## Quick Fix Checklist

### For Team Members Error:
- [ ] Run `python manage.py migrate` in Render Shell
- [ ] Verify with `python manage.py fix_production_issues`
- [ ] Test `/api/team/` endpoint

### For Email Issues:
- [ ] Check SendGrid dashboard → Activity
- [ ] Verify sender email is authenticated
- [ ] Check spam folder
- [ ] Run `python manage.py fix_production_issues` to check config
- [ ] Test with `python manage.py test_email your-email@example.com`

### For Media Files:
- [ ] Decide: Use cloud storage or accept ephemeral?
- [ ] If cloud storage: Set up AWS S3 or Cloudinary
- [ ] Update settings.py with cloud storage config
- [ ] Test avatar upload

---

## Run Diagnostic Tool

The easiest way to check all issues:

```bash
# In Render Shell
python manage.py fix_production_issues
```

This will show you:
- ✅ What's working
- ❌ What's broken
- 🔧 What can be fixed automatically

To auto-fix what can be fixed:
```bash
python manage.py fix_production_issues --fix
```

---

## Priority Order

1. **URGENT**: Fix team_members table (run migrations)
2. **HIGH**: Investigate email delivery (check SendGrid dashboard)
3. **MEDIUM**: Set up cloud storage for media files

---

## Need Help?

1. Check Render logs for detailed errors
2. Check SendGrid dashboard for email status
3. Run diagnostic tool: `python manage.py fix_production_issues`
4. Review logs for specific error messages

