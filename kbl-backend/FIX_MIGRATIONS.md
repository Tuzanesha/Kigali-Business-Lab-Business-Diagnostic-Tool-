# Fix Migration State After Deleting Migration Files

## Current Situation

You deleted migration files and ran `--fake-initial`, but the database tables didn't change. This is because `--fake-initial` only marks migrations as applied without actually running them.

## Solution: Reset and Recreate Migrations

### Step 1: Check Current Migration State

```bash
python manage.py showmigrations
```

This will show which migrations are applied (marked with [X]) and which are not.

### Step 2: Fix Migration Dependencies

I've already fixed:
- ✅ `0003_alter_teammember_invitation_expires_at_and_more.py` - now depends on `0001_initial` instead of non-existent `0002`

### Step 3: Apply Migrations Properly

Since you used `--fake-initial`, you need to either:

**Option A: Unfake and Reapply (Recommended)**
```bash
# Mark all migrations as unapplied
python manage.py migrate diagnostic zero --fake

# Then apply them for real
python manage.py migrate
```

**Option B: If tables already exist, just fake the current ones**
```bash
# Fake the initial migration if tables already exist
python manage.py migrate diagnostic 0001 --fake

# Then apply the rest
python manage.py migrate
```

### Step 4: Verify Tables Exist

After migrations, check:
```bash
python manage.py dbshell
```

Then in PostgreSQL:
```sql
\dt  -- List all tables
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';
```

You should see:
- `userprofile` (User model)
- `team_members` (TeamMember model)
- `diagnostic_enterprise`
- `diagnostic_question`
- etc.

## For Production (Render)

Since you can't use Shell, the migrations will run automatically on the next deployment. The `start.sh` script will:

1. Wait for database
2. Run `python manage.py migrate --noinput`
3. Import questions
4. Start server

**Just commit and push these fixes, then trigger a manual deploy in Render.**

## Files Fixed

1. ✅ `diagnostic/migrations/0003_alter_teammember_invitation_expires_at_and_more.py` - Fixed dependency
2. ✅ `diagnostic/views.py` - Fixed account deletion to use correct table name (`userprofile`)

## Account Deletion Fix

The account deletion now:
- ✅ Uses `user._meta.db_table` to get the correct table name (`userprofile`)
- ✅ Handles missing `team_members` table gracefully
- ✅ Falls back to direct SQL deletion if needed

## Next Steps

1. **Commit the fixes**:
   ```bash
   git add diagnostic/migrations/0003_alter_teammember_invitation_expires_at_and_more.py diagnostic/views.py
   git commit -m "Fix migration dependencies and account deletion"
   git push
   ```

2. **In Production**: Trigger a manual deploy in Render - migrations will run automatically

3. **Verify**: After deployment, check:
   - `/migration-status/` endpoint
   - `/api/team/` endpoint (should work after migrations)
   - Account deletion (should work now)

## If Migrations Still Fail

If you see migration errors, you may need to:

1. **Check what tables actually exist in your database**
2. **Create a fresh migration** that matches your current database state
3. **Or reset the database** (if it's safe to do so in production)

For production, the safest approach is to let the automatic migration script handle it during deployment.

