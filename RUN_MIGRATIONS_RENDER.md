# 🚀 Running Migrations on Render (Quick Fix)

## ⚠️ Current Issue

Your database tables don't exist because migrations haven't been run. This guide will help you fix it immediately.

---

## 🔧 Option 1: Run Migrations Manually (Fastest - Do This Now!)

### Step 1: Access Render Shell

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click on your **backend service** (`business-diagnostic-tool` or `kbl-backend`)
3. Look for **"Shell"** tab or **"SSH"** option
4. Click to open a shell/terminal

### Step 2: Run Migrations

Once in the shell, run:

```bash
python manage.py migrate
```

**Expected Output:**
```
Operations to perform:
  Apply all migrations: admin, auth, contenttypes, sessions, accounts, diagnostic
Running migrations:
  Applying accounts.0001_initial... OK
  Applying accounts.0002_user_avatar_user_title... OK
  Applying diagnostic.0001_initial... OK
  Applying diagnostic.0002_emailotp... OK
  ...
```

### Step 3: Verify

Try registering a user again from your frontend. It should work now!

---

## 🔧 Option 2: Update Start Command (Permanent Fix)

I've already updated `render.yaml` to run migrations automatically on every deploy. After you commit and push:

1. The start command will run migrations before starting the server
2. This ensures migrations always run on deployment

**To apply:**
```bash
git add kbl-backend/render.yaml
git commit -m "Fix: Run migrations on startup"
git push
```

Then redeploy your service on Render.

---

## 🔧 Option 3: Use Render's Build Command

If you prefer to run migrations during build (instead of startup):

1. Go to your backend service on Render
2. Go to **Settings** → **Build & Deploy**
3. Update **Build Command** to:
   ```bash
   python manage.py migrate --noinput && python manage.py collectstatic --noinput
   ```

**Note:** This runs migrations during build, which is fine but slower. The start command approach (Option 2) is better.

---

## ✅ Verification

After running migrations, verify:

1. **Check tables exist:**
   - Try registering a user from frontend
   - Should work without errors

2. **Check logs:**
   - Go to backend service → **Logs**
   - Should see no database errors

3. **Test registration:**
   - Go to: `https://kigali-business-lab-business-diagnostic.onrender.com/signup`
   - Register a new user
   - Should succeed!

---

## 🐛 Troubleshooting

### "Command not found: python"

Try:
```bash
python3 manage.py migrate
```

### "No module named django"

The shell might not have the right environment. Try:
```bash
cd /app
python manage.py migrate
```

### "Can't connect to database"

1. Verify database environment variables are set:
   - `POSTGRES_HOST`
   - `POSTGRES_DB`
   - `POSTGRES_USER`
   - `POSTGRES_PASSWORD`
2. Check database service is running on Render
3. Verify connection details are correct

### "Migration already applied"

This is fine! It means migrations have run. Try registering a user to test.

---

## 📝 What Tables Should Exist?

After migrations, you should have:
- `accounts_user` (User model)
- `diagnostic_userprofile` (UserProfile - wait, this was deleted in migration 0005)
- `diagnostic_notificationpreference` (Notification preferences)
- `diagnostic_enterprise` (Enterprises)
- `diagnostic_assessmentsession` (Assessment sessions)
- `diagnostic_teammember` (Team members)
- And many more...

**Note:** The error mentions `userprofile` table, but migration `0005_notificationpreference_delete_userprofile.py` deletes it. The code might be trying to access a model that no longer exists. Check your views.py to see if it's referencing UserProfile.

---

## 🎯 Quick Action

**Right now, do this:**

1. Go to Render Dashboard → Your Backend Service
2. Open Shell/SSH
3. Run: `python manage.py migrate`
4. Test registration on frontend

This will fix the immediate issue!

