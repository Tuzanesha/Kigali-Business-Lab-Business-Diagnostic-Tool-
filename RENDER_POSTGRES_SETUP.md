# 🗄️ Setting Up PostgreSQL on Render

## 📋 Overview

Your Django backend needs a PostgreSQL database. This guide will walk you through creating one on Render.

---

## 🚀 Step 1: Create PostgreSQL Database

### 1.1 Go to Render Dashboard

1. Log in to [Render Dashboard](https://dashboard.render.com)
2. Click **"New +"** button (top right)
3. Select **"PostgreSQL"**

### 1.2 Configure Database

Fill in the form:

**Name:**
```
kbl-database
```
(or any name you prefer)

**Database:**
```
kbl_backend
```
(This is the database name - you can change it)

**User:**
```
kbl_user
```
(This is the database user - you can change it)

**Region:**
- Choose the same region as your backend service (for better performance)
- If your backend is in a specific region, match it
- If unsure, choose a region close to your users

**PostgreSQL Version:**
- Leave as default (usually latest stable version like 15 or 16)
- Django works with PostgreSQL 12+

**Plan:**
- **Free**: Good for development/testing (limited connections, auto-sleeps after inactivity)
- **Starter ($7/month)**: Better for production (no auto-sleep, more connections)
- **Standard ($20/month)**: For production with more traffic

**For now, select "Free"** (you can upgrade later)

### 1.3 Create Database

1. Click **"Create Database"**
2. Wait 1-2 minutes for database to be provisioned
3. You'll see a success message when it's ready

---

## 🔑 Step 2: Get Database Connection Details

### 2.1 View Database Info

Once created, you'll see your database dashboard with:

- **Internal Database URL** (for services in same region)
- **External Connection String** (for connecting from outside Render)
- **Connection Details** section with:
  - Host
  - Port
  - Database name
  - User
  - Password

### 2.2 Copy Connection Details

You'll need these values for your backend environment variables:

1. **Host**: Something like `dpg-xxxxx-a.oregon-postgres.render.com`
2. **Port**: Usually `5432`
3. **Database**: The database name you set (e.g., `kbl_backend`)
4. **User**: The user you set (e.g., `kbl_user`)
5. **Password**: Auto-generated password (click "Show" to reveal)

**Important:** Save the password immediately - you won't be able to see it again!

---

## ⚙️ Step 3: Update Backend Environment Variables

### 3.1 Go to Your Backend Service

1. In Render Dashboard, go to your **backend service** (`business-diagnostic-tool`)
2. Click on the service name
3. Go to **"Environment"** tab

### 3.2 Add Database Variables

Add or update these environment variables:

```bash
# Database Configuration
POSTGRES_DB=kbl_backend
POSTGRES_USER=kbl_user
POSTGRES_PASSWORD=your-password-here
POSTGRES_HOST=dpg-xxxxx-a.oregon-postgres.render.com
POSTGRES_PORT=5432
```

**Replace:**
- `your-password-here` with the actual password from Step 2.2
- `dpg-xxxxx-a.oregon-postgres.render.com` with your actual host

### 3.3 Alternative: Use Connection String

Instead of individual variables, you can use a connection string:

```bash
DATABASE_URL=postgresql://kbl_user:password@dpg-xxxxx-a.oregon-postgres.render.com:5432/kbl_backend
```

**Note:** Your Django settings might need to be updated to use `DATABASE_URL`. Check your `settings.py` to see which format it expects.

---

## 🔧 Step 4: Update Django Settings (If Needed)

### 4.1 Check Your Current Settings

Open `kbl-backend/config/settings.py` and find the database configuration. It should look something like:

```python
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': os.getenv('POSTGRES_DB', 'kbl_backend'),
        'USER': os.getenv('POSTGRES_USER', 'kbl_user'),
        'PASSWORD': os.getenv('POSTGRES_PASSWORD', ''),
        'HOST': os.getenv('POSTGRES_HOST', 'localhost'),
        'PORT': os.getenv('POSTGRES_PORT', '5432'),
    }
}
```

If it's already configured like this, you're good! The environment variables will be used automatically.

### 4.2 If Using DATABASE_URL

If you want to use `DATABASE_URL` instead, you'll need to install `dj-database-url`:

```bash
pip install dj-database-url
```

Then update `settings.py`:

```python
import dj_database_url

# ... existing code ...

DATABASES = {
    'default': dj_database_url.config(
        default=os.getenv('DATABASE_URL'),
        conn_max_age=600,
        conn_health_checks=True,
    )
}
```

**For now, stick with individual environment variables** - it's simpler and your current setup likely already supports it.

---

## 🚀 Step 5: Run Migrations

### 5.1 Redeploy Backend

After updating environment variables:

1. Go to your backend service on Render
2. Click **"Manual Deploy"** → **"Deploy latest commit"**
   - OR it will auto-deploy when you save environment variables

### 5.2 Check Build Logs

1. Go to **"Logs"** tab in your backend service
2. Watch for migration output:
   ```
   Operations to perform:
     Apply all migrations: accounts, diagnostic, ...
   ```

### 5.3 If Migrations Don't Run Automatically

If your build script doesn't run migrations, you can run them manually:

1. Go to your backend service → **"Shell"** tab (if available)
2. Or use Render's **"Shell"** feature
3. Run:
   ```bash
   python manage.py migrate
   ```

**Or update your build script** (`kbl-backend/build.sh`) to include migrations:

```bash
#!/bin/bash
python manage.py migrate
python manage.py collectstatic --noinput
gunicorn config.wsgi:application --bind 0.0.0.0:$PORT
```

---

## ✅ Step 6: Verify Database Connection

### 6.1 Check Backend Logs

1. Go to backend service → **"Logs"** tab
2. Look for:
   - No database connection errors
   - Successful migration messages
   - Application started successfully

### 6.2 Test from Frontend

1. Go to your frontend
2. Try to register a new user
3. Check if it works (data should be saved to database)

### 6.3 Check Database

1. Go to your PostgreSQL service on Render
2. Click **"Connect"** or **"Info"** tab
3. You can use the connection string to connect with a database client (optional)

---

## 🔒 Step 7: Security Best Practices

### 7.1 Never Commit Passwords

- ✅ Environment variables are stored securely in Render
- ❌ Never commit `.env` files with passwords to Git
- ✅ Use Render's environment variables feature

### 7.2 Use Strong Passwords

- Render auto-generates strong passwords
- Don't change to a weak password
- Keep the auto-generated password

### 7.3 Restrict Access

- Use **Internal Database URL** for services in same region (faster, more secure)
- Use **External Connection String** only if needed
- Consider IP whitelisting for production (if available on your plan)

---

## 🐛 Troubleshooting

### Issue: "Connection refused" or "Can't connect to database"

**Solutions:**
1. Verify all environment variables are set correctly:
   - `POSTGRES_HOST` (no `http://` prefix, just the hostname)
   - `POSTGRES_PORT` (usually `5432`)
   - `POSTGRES_DB` (exact database name)
   - `POSTGRES_USER` (exact username)
   - `POSTGRES_PASSWORD` (exact password, no extra spaces)

2. Check database is running:
   - Go to PostgreSQL service on Render
   - Status should be "Available"
   - If it's "Sleeping" (free tier), it will wake up on first connection

3. Verify region matches:
   - Database and backend should be in same region for best performance

4. Check backend logs for specific error messages

### Issue: "Database does not exist"

**Solution:**
- Verify `POSTGRES_DB` matches the database name exactly
- Check database name in PostgreSQL service dashboard
- Database name is case-sensitive

### Issue: "Authentication failed"

**Solution:**
- Verify `POSTGRES_USER` and `POSTGRES_PASSWORD` are correct
- Copy-paste password (don't type manually - might have typos)
- Check for extra spaces in environment variables

### Issue: Migrations fail

**Solution:**
1. Check database connection first (see above)
2. Verify Django can connect to database
3. Check migration files are correct
4. Look at backend logs for specific migration errors

### Issue: Database goes to sleep (Free tier)

**Solution:**
- Free tier databases sleep after 90 days of inactivity
- First connection after sleep takes ~30 seconds
- Consider upgrading to Starter plan ($7/month) for production
- Starter plan doesn't sleep

---

## 📊 Database Plans Comparison

### Free Tier
- ✅ Good for development/testing
- ✅ 90 days of inactivity before sleep
- ⚠️ Limited connections
- ⚠️ Wakes up slowly after sleep
- ⚠️ Not recommended for production

### Starter ($7/month)
- ✅ No auto-sleep
- ✅ More connections
- ✅ Better for production
- ✅ Faster performance

### Standard ($20/month)
- ✅ Even more connections
- ✅ Better performance
- ✅ For high-traffic applications

**Recommendation:** Start with Free for testing, upgrade to Starter for production.

---

## 🔄 Step 8: Backup Strategy

### 8.1 Automatic Backups

- Render provides automatic daily backups on paid plans
- Free tier: Manual backups only
- Consider upgrading for automatic backups in production

### 8.2 Manual Backup

You can backup your database using:

```bash
pg_dump -h your-host -U your-user -d your-database > backup.sql
```

Or use Django's dumpdata:

```bash
python manage.py dumpdata > backup.json
```

---

## ✅ Checklist

Use this to verify everything is set up:

- [ ] PostgreSQL database created on Render
- [ ] Database connection details copied
- [ ] Backend environment variables updated:
  - [ ] `POSTGRES_DB`
  - [ ] `POSTGRES_USER`
  - [ ] `POSTGRES_PASSWORD`
  - [ ] `POSTGRES_HOST`
  - [ ] `POSTGRES_PORT`
- [ ] Backend redeployed
- [ ] Migrations ran successfully (check logs)
- [ ] No database connection errors in logs
- [ ] Can register/login from frontend (data saves to database)

---

## 🎉 You're Done!

Once your database is set up and connected:

1. ✅ Your backend will store all data in PostgreSQL
2. ✅ User accounts, assessments, enterprises - everything persists
3. ✅ Data survives backend restarts
4. ✅ Ready for production use

**Next Steps:**
- Test registration/login to verify database works
- Create some test data
- Monitor database usage in Render dashboard

---

## 📞 Quick Reference

**Database Service URL:**
```
https://dashboard.render.com → Your PostgreSQL Service
```

**Connection Details Location:**
```
PostgreSQL Service → Info/Connect Tab
```

**Backend Environment Variables:**
```
Backend Service → Environment Tab
```

**Need Help?**
- Check Render docs: https://render.com/docs/databases
- Check backend logs for specific errors
- Verify all environment variables are set correctly

