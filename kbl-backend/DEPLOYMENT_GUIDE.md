# Deployment Guide - Running Migrations Without Shell Access

Since you're on Render's free tier and don't have Shell access, migrations will run automatically on every deployment.

## How It Works

1. **Automatic Migrations**: The `start.sh` script runs migrations automatically before starting the server
2. **On Every Deploy**: When you push code or trigger a manual deploy, migrations run automatically
3. **Error Handling**: If migrations fail, the service won't start (prevents running with incomplete database)

## To Run Migrations Now

### Option 1: Manual Deploy (Recommended)
1. Go to Render Dashboard
2. Navigate to your web service (`kbl-backend`)
3. Click **"Manual Deploy"** → **"Deploy latest commit"**
4. Wait for deployment to complete
5. Migrations will run automatically during startup

### Option 2: Push Code
1. Make a small change (add a comment, update README, etc.)
2. Commit and push:
   ```bash
   git add .
   git commit -m "Trigger deployment to run migrations"
   git push
   ```
3. Render will automatically deploy
4. Migrations will run during startup

### Option 3: Check Current Status
Visit this URL to check if migrations have run:
```
https://business-diagnostic-tool.onrender.com/migration-status/
```

This will show you:
- Database connection status
- Whether `team_members` table exists
- Status of other important tables

## What Happens During Deployment

1. **Build Phase**: Docker image is built
2. **Start Phase**: `start.sh` script runs:
   - Waits for database connection
   - Runs `python manage.py migrate --noinput`
   - Imports questions
   - Collects static files
   - Starts Gunicorn server

## Verifying Migrations Ran

### Method 1: Check Migration Status Endpoint
```bash
curl https://business-diagnostic-tool.onrender.com/migration-status/
```

Expected response if migrations ran:
```json
{
  "database_connected": true,
  "team_members_table_exists": true,
  "migrations_applied": true,
  "diagnostic_enterprise": true,
  "diagnostic_question": true,
  "accounts_user": true
}
```

### Method 2: Test Team Endpoint
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
     https://business-diagnostic-tool.onrender.com/api/team/
```

If migrations ran, you should get a 200 response (even if empty list).

### Method 3: Check Logs
1. Go to Render Dashboard → Your Service → **Logs**
2. Look for:
   - `✓ Migrations completed successfully`
   - `Running database migrations...`
   - Any migration errors

## Troubleshooting

### If Migrations Don't Run

1. **Check Logs**: Look for migration errors in Render logs
2. **Check Migration Status**: Visit `/migration-status/` endpoint
3. **Verify start.sh**: Make sure `start.sh` is executable and in the repo
4. **Check render.yaml**: Verify `startCommand` points to `start.sh`

### If Service Won't Start

1. **Check Logs**: Look for error messages
2. **Database Connection**: Verify database credentials in Render
3. **Migration Errors**: Check for specific migration failures

### Common Issues

**Issue**: "relation team_members does not exist"
- **Solution**: Deploy again - migrations should run automatically

**Issue**: Service starts but migrations didn't run
- **Solution**: Check `start.sh` is in repo and executable
- **Solution**: Verify `render.yaml` has correct `startCommand`

**Issue**: Migrations run but table still missing
- **Solution**: Check migration files exist in `diagnostic/migrations/`
- **Solution**: Verify migration file names match what's expected

## Files Changed

1. **`start.sh`**: New startup script that runs migrations
2. **`render.yaml`**: Updated to use `start.sh`
3. **`config/urls.py`**: Added `/migration-status/` endpoint

## Next Steps

1. **Commit and push** these changes:
   ```bash
   git add start.sh render.yaml config/urls.py
   git commit -m "Add automatic migration script and status endpoint"
   git push
   ```

2. **Wait for deployment** to complete

3. **Check migration status**:
   ```
   https://business-diagnostic-tool.onrender.com/migration-status/
   ```

4. **Test team endpoint**:
   ```
   https://business-diagnostic-tool.onrender.com/api/team/
   ```

## Important Notes

- ✅ Migrations run **automatically** on every deployment
- ✅ No Shell access needed
- ✅ Service won't start if migrations fail (prevents broken state)
- ✅ You can check migration status via `/migration-status/` endpoint
- ⚠️ First deployment after adding this will run all pending migrations

## After Migrations Run

Once migrations complete successfully:
- ✅ `/api/team/` endpoint will work
- ✅ Account deletion will work
- ✅ All team member features will be available

