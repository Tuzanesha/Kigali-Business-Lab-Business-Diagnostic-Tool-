# CRITICAL: Immediate Actions Required

## Issue 1: Team Members Table Missing (BLOCKING)

**Error**: `relation "team_members" does not exist`

**Impact**: 
- ❌ `/api/team/` returns 503 error
- ❌ Account deletion fails with 500 error
- ❌ Any feature using team members is broken

### IMMEDIATE FIX (Run in Render Shell):

```bash
python manage.py migrate
```

This will create the `team_members` table and fix all related issues.

### Verify Fix:

```bash
python manage.py fix_production_issues --check-only
```

Or test the endpoint:
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
     https://business-diagnostic-tool.onrender.com/api/team/
```

---

## Issue 2: Profile Pictures Not Persisting

**Problem**: Profile pictures upload successfully but disappear after service restart

**Root Cause**: Render's filesystem is **ephemeral** - files are lost when the service restarts.

**Current Behavior**:
- ✅ Avatar uploads work
- ✅ Avatar is saved to `/media/avatars/`
- ❌ File is lost when Render restarts the service
- ❌ URL returns 404 after restart

### Solutions:

#### Option A: Use Cloud Storage (RECOMMENDED)

**Using Cloudinary** (Easiest):

1. Sign up at https://cloudinary.com (free tier available)
2. Install package:
   ```bash
   pip install cloudinary django-cloudinary-storage
   ```
3. Add to `requirements.txt`:
   ```
   cloudinary
   django-cloudinary-storage
   ```
4. Update `settings.py`:
   ```python
   import cloudinary
   import cloudinary.uploader
   import cloudinary.api
   
   CLOUDINARY = {
       'cloud_name': os.getenv('CLOUDINARY_CLOUD_NAME'),
       'api_key': os.getenv('CLOUDINARY_API_KEY'),
       'api_secret': os.getenv('CLOUDINARY_API_SECRET'),
   }
   
   # For user avatars
   DEFAULT_FILE_STORAGE = 'cloudinary_storage.storage.MediaCloudinaryStorage'
   ```
5. Set environment variables in Render:
   - `CLOUDINARY_CLOUD_NAME`
   - `CLOUDINARY_API_KEY`
   - `CLOUDINARY_API_SECRET`

**Using AWS S3**:

1. Create S3 bucket
2. Install: `pip install django-storages boto3`
3. Configure in `settings.py`:
   ```python
   DEFAULT_FILE_STORAGE = 'storages.backends.s3boto3.S3Boto3Storage'
   AWS_ACCESS_KEY_ID = os.getenv('AWS_ACCESS_KEY_ID')
   AWS_SECRET_ACCESS_KEY = os.getenv('AWS_SECRET_ACCESS_KEY')
   AWS_STORAGE_BUCKET_NAME = os.getenv('AWS_STORAGE_BUCKET_NAME')
   AWS_S3_REGION_NAME = os.getenv('AWS_S3_REGION_NAME', 'us-east-1')
   ```

#### Option B: Accept Current Behavior (Not Recommended)

- Files work until service restart
- Users need to re-upload after restarts
- Not suitable for production

---

## Issue 3: Account Deletion Failing

**Status**: ✅ FIXED in code (needs deployment)

**Problem**: Account deletion fails because it tries to delete from `team_members` table that doesn't exist.

**Fix Applied**: 
- Code now checks if `team_members` table exists before trying to delete
- Handles missing table gracefully
- Still requires migrations to be run for full functionality

**After running migrations**, account deletion will work properly.

---

## Priority Actions

### URGENT (Do Now):
1. ✅ **Run migrations**: `python manage.py migrate` in Render Shell
2. ✅ **Verify team endpoint works**: Test `/api/team/` after migrations
3. ✅ **Test account deletion**: Should work after migrations

### HIGH (This Week):
1. ⚠️ **Set up cloud storage** for profile pictures (Cloudinary recommended)
2. ⚠️ **Update settings.py** with cloud storage configuration
3. ⚠️ **Set environment variables** in Render

### MEDIUM (When Possible):
1. 📝 Document cloud storage setup
2. 📝 Test avatar upload with cloud storage
3. 📝 Verify files persist after service restart

---

## Quick Commands

### Check Current Status:
```bash
python manage.py fix_production_issues
```

### Run Migrations:
```bash
python manage.py migrate
```

### Check Specific Table:
```bash
python manage.py shell
```
Then:
```python
from django.db import connection
with connection.cursor() as cursor:
    cursor.execute("""
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'team_members'
    """)
    print("Table exists:", cursor.fetchone() is not None)
```

---

## Summary

1. **Run migrations NOW** - This fixes team members and account deletion
2. **Set up cloud storage** - This fixes profile picture persistence
3. **Deploy updated code** - This includes better error handling

After these steps, all issues should be resolved!

