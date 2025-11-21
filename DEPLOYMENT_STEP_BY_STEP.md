# 🚀 Step-by-Step Deployment Guide

Complete guide to deploy your KBL Business Diagnostic Tool to production.

---

## 📋 Prerequisites Checklist

Before starting, make sure you have:
- [ ] GitHub repository with your code pushed
- [ ] Gmail account (for email sending)
- [ ] Gmail App Password (see Step 1.4 below)

---

## 🔵 PART 1: Deploy Backend to Render

### Step 1.1: Create Render Account & Database

1. **Go to [render.com](https://render.com)** and sign up/login
2. **Click "New +"** → **"PostgreSQL"**
3. **Configure Database:**
   - **Name**: `kbl-db`
   - **Database**: `kbl_backend`
   - **User**: `kbl_user`
   - **Region**: Choose closest to your users (e.g., `Oregon (US West)`)
   - **PostgreSQL Version**: `16`
   - **Plan**: `Free` (or `Starter` for production)
4. **Click "Create Database"**
5. **Wait for database to be ready** (1-2 minutes)
6. **Copy these details** (you'll need them):
   - Internal Database URL
   - Host
   - Port
   - Database name
   - User
   - Password

### Step 1.2: Generate Django Secret Key

Open your terminal and run:

```bash
python3 -c "import secrets; print(secrets.token_urlsafe(32))"
```

**Copy the output** - you'll need it in the next step.

### Step 1.3: Get Gmail App Password

1. Go to [Google Account Settings](https://myaccount.google.com/)
2. Click **"Security"** → **"2-Step Verification"** (enable if not already)
3. Go to **"App passwords"**
4. Select **"Mail"** and **"Other (Custom name)"**
5. Enter: `KBL Backend`
6. Click **"Generate"**
7. **Copy the 16-character password** (you'll use this as `EMAIL_HOST_PASSWORD`)

### Step 1.4: Create Web Service on Render

1. In Render Dashboard, click **"New +"** → **"Web Service"**
2. **Connect GitHub:**
   - Click **"Connect GitHub"** if not already connected
   - Authorize Render
   - Select your repository: `Kigali-Business-Lab-Business-Diagnostic-Tool-`
3. **Configure Service:**
   - **Name**: `kbl-backend`
   - **Region**: Same as your database
   - **Branch**: `main` (or your default branch)
   - **Root Directory**: `kbl-backend` ⚠️ **Important!**
   - **Runtime**: `Docker`
   - **Dockerfile Path**: `Dockerfile`
   - **Docker Context**: `.`
   - **Start Command**: `gunicorn config.wsgi:application --bind 0.0.0.0:$PORT --workers 3`

### Step 1.5: Add Environment Variables

Before clicking "Create", scroll down to **"Environment Variables"** and click **"Add Environment Variable"** for each:

**Required Variables:**

| Key | Value | Notes |
|-----|-------|-------|
| `DJANGO_SECRET_KEY` | `[paste the secret key from Step 1.2]` | The key you generated |
| `DJANGO_DEBUG` | `False` | Must be False for production |
| `DJANGO_ALLOWED_HOSTS` | `kbl-backend.onrender.com` | Will be your Render URL |
| `POSTGRES_DB` | `kbl_backend` | From database details |
| `POSTGRES_USER` | `kbl_user` | From database details |
| `POSTGRES_PASSWORD` | `[from database]` | From database details |
| `POSTGRES_HOST` | `[from database]` | Internal host from database |
| `POSTGRES_PORT` | `5432` | Usually 5432 |

**Email Variables:**

| Key | Value |
|-----|-------|
| `EMAIL_BACKEND` | `django.core.mail.backends.smtp.EmailBackend` |
| `EMAIL_HOST` | `smtp.gmail.com` |
| `EMAIL_PORT` | `587` |
| `EMAIL_USE_TLS` | `True` |
| `EMAIL_HOST_USER` | `your-email@gmail.com` | Your Gmail address |
| `EMAIL_HOST_PASSWORD` | `[16-char app password]` | From Step 1.3 |
| `DEFAULT_FROM_EMAIL` | `your-email@gmail.com` | Same as EMAIL_HOST_USER |

**URL Variables (Update after deployment):**

| Key | Value (Update later) |
|-----|---------------------|
| `PUBLIC_BASE_URL` | `https://kbl-backend.onrender.com` | Update with actual URL |
| `FRONTEND_URL` | `https://your-frontend.vercel.app` | Update after Vercel deploy |
| `BACKEND_BASE_URL` | `https://kbl-backend.onrender.com` | Update with actual URL |

### Step 1.6: Deploy Backend

1. **Click "Create Web Service"**
2. **Wait for deployment** (5-10 minutes)
   - Watch the build logs
   - First deployment takes longer
3. **Note your backend URL** (e.g., `https://kbl-backend.onrender.com`)
   - You'll see it in the service dashboard

### Step 1.7: Run Database Migrations

1. In Render dashboard, go to your `kbl-backend` service
2. Click **"Shell"** tab (top right)
3. Run these commands one by one:

```bash
python manage.py migrate
python manage.py createsuperuser
python manage.py import_questions
```

**For createsuperuser:**
- Enter email, first name, last name, password when prompted

### Step 1.8: Update Environment Variables with Actual URLs

1. Go back to your service → **"Environment"** tab
2. Update these variables with your actual URLs:
   - `DJANGO_ALLOWED_HOSTS`: `kbl-backend.onrender.com` (your actual URL)
   - `PUBLIC_BASE_URL`: `https://kbl-backend.onrender.com` (your actual URL)
   - `BACKEND_BASE_URL`: `https://kbl-backend.onrender.com` (your actual URL)
3. **Save changes** (this will trigger a redeploy)

---

## 🟢 PART 2: Deploy Frontend to Vercel

### Step 2.1: Create Vercel Account

1. **Go to [vercel.com](https://vercel.com)** and sign up/login
2. **Connect GitHub** if not already connected
   - Click your profile → **"Settings"** → **"Git"**
   - Connect GitHub account

### Step 2.2: Import Project

1. In Vercel Dashboard, click **"Add New..."** → **"Project"**
2. **Import Git Repository:**
   - Find: `Kigali-Business-Lab-Business-Diagnostic-Tool-`
   - Click **"Import"**

### Step 2.3: Configure Project

1. **Project Settings:**
   - **Project Name**: `kbl-frontend` (or any name)
   - **Framework Preset**: `Next.js` (auto-detected)
   - **Root Directory**: `kbl_frontend` ⚠️ **Important!**
   - **Build Command**: `npm run build` (auto-filled)
   - **Output Directory**: `.next` (auto-filled)
   - **Install Command**: `npm install` (auto-filled)

2. **Environment Variables:**
   - Click **"Environment Variables"**
   - Click **"Add New"**
   - **Key**: `NEXT_PUBLIC_API_URL`
   - **Value**: `https://kbl-backend.onrender.com/api` (use your actual Render backend URL)
   - **Environment**: Select all (Production, Preview, Development)
   - Click **"Save"**

### Step 2.4: Deploy

1. **Click "Deploy"**
2. **Wait for deployment** (2-5 minutes)
   - Watch the build logs
   - First deployment takes longer
3. **Note your frontend URL** (e.g., `https://kbl-frontend.vercel.app`)

---

## 🔗 PART 3: Connect Frontend and Backend

### Step 3.1: Update Backend CORS Settings

1. **Go back to Render** → Your `kbl-backend` service → **"Environment"** tab
2. **Add/Update these variables:**

| Key | Value |
|-----|-------|
| `CORS_ALLOWED_ORIGINS` | `https://kbl-frontend.vercel.app` | Your actual Vercel URL |
| `FRONTEND_URL` | `https://kbl-frontend.vercel.app` | Your actual Vercel URL |
| `CSRF_TRUSTED_ORIGINS` | `https://kbl-backend.onrender.com,https://kbl-frontend.vercel.app` | Both URLs |

3. **Save changes** (this will trigger a redeploy)

### Step 3.2: Verify Connection

1. **Visit your Vercel frontend URL**
2. **Open browser Developer Tools** (F12) → **Console** tab
3. **Try to register a new user**
4. **Check for errors:**
   - If you see CORS errors, wait for backend redeploy to finish
   - If you see 404 errors, check the API URL in Vercel environment variables

---

## ✅ PART 4: Post-Deployment Tasks

### Step 4.1: Test the Application

1. **Register a new user:**
   - Go to your Vercel frontend URL
   - Click "Sign Up"
   - Fill in the form
   - Submit

2. **Check email:**
   - Check your email inbox
   - Click the verification link
   - Should redirect to verification success page

3. **Login:**
   - Use your credentials
   - Should redirect to dashboard

4. **Test features:**
   - Create an enterprise
   - Add team members
   - Complete an assessment
   - Test notifications

### Step 4.2: Set Up Custom Domain (Optional)

**For Backend (Render):**
1. Render Dashboard → Your service → **"Settings"** → **"Custom Domains"**
2. Add your domain
3. Follow DNS configuration instructions
4. Update `DJANGO_ALLOWED_HOSTS` with your custom domain

**For Frontend (Vercel):**
1. Vercel Dashboard → Your project → **"Settings"** → **"Domains"**
2. Add your domain
3. Follow DNS configuration instructions
4. Update `NEXT_PUBLIC_API_URL` if needed

---

## 🐛 Troubleshooting

### Backend Issues

**Database Connection Error:**
- Check database credentials in Render environment variables
- Ensure database is running (green status)
- Verify `POSTGRES_HOST` uses internal host (not external)

**Static Files Not Loading:**
- Check build logs for `collectstatic` errors
- Verify `STATIC_ROOT` in settings.py

**CORS Errors:**
- Verify `CORS_ALLOWED_ORIGINS` includes your Vercel URL
- Check `DJANGO_ALLOWED_HOSTS` includes your Render URL
- Wait for redeploy after changing environment variables

**Email Not Sending:**
- Verify Gmail App Password is correct (16 characters, no spaces)
- Check `EMAIL_HOST_USER` matches your Gmail address
- Check spam folder
- Test with: `python manage.py test_email --email your-email@gmail.com`

### Frontend Issues

**API Connection Errors:**
- Verify `NEXT_PUBLIC_API_URL` in Vercel environment variables
- Check backend is accessible: `curl https://your-backend.onrender.com/health/`
- Check browser console for specific error messages

**Build Errors:**
- Check Vercel build logs
- Verify Node.js version (should be 18+)
- Check for TypeScript errors

**404 Errors:**
- Verify root directory is set to `kbl_frontend`
- Check `next.config.ts` is correct

---

## 📊 Monitoring

### Render
- **Logs**: Dashboard → Your service → **"Logs"** tab
- **Metrics**: Dashboard → Your service → **"Metrics"** tab
- **Events**: Dashboard → Your service → **"Events"** tab

### Vercel
- **Logs**: Dashboard → Your project → **"Deployments"** → Click deployment → **"Logs"**
- **Analytics**: Dashboard → Your project → **"Analytics"** tab
- **Speed Insights**: Dashboard → Your project → **"Speed Insights"** tab

---

## 🔄 Updating Your Deployment

### Backend Updates
1. Push changes to GitHub
2. Render will automatically redeploy
3. Or manually trigger: Dashboard → Your service → **"Manual Deploy"**

### Frontend Updates
1. Push changes to GitHub
2. Vercel will automatically redeploy
3. Or manually trigger: Dashboard → Your project → **"Deployments"** → **"Redeploy"**

---

## 💰 Cost Estimation

### Render (Free Tier)
- **Web Service**: Free (with limitations)
  - 750 hours/month
  - Spins down after 15 minutes of inactivity
- **PostgreSQL**: Free (with limitations)
  - 90 days free trial, then $7/month
  - 256 MB storage

### Vercel (Free Tier)
- **Next.js Hosting**: Free
- **Bandwidth**: 100 GB/month
- **Builds**: Unlimited

**Total for testing**: $0/month (first 90 days)
**Total for production**: ~$7/month (after database trial)

---

## ✅ Deployment Checklist

- [ ] Render account created
- [ ] PostgreSQL database created
- [ ] Database credentials saved
- [ ] Django secret key generated
- [ ] Gmail app password created
- [ ] Backend web service created on Render
- [ ] All environment variables added
- [ ] Backend deployed successfully
- [ ] Migrations run
- [ ] Superuser created
- [ ] Questions imported
- [ ] Backend URL saved
- [ ] Vercel account created
- [ ] Frontend project imported
- [ ] Root directory set to `kbl_frontend`
- [ ] `NEXT_PUBLIC_API_URL` environment variable set
- [ ] Frontend deployed successfully
- [ ] Frontend URL saved
- [ ] CORS settings updated on backend
- [ ] Backend redeployed with CORS settings
- [ ] User registration tested
- [ ] Email verification tested
- [ ] Login tested
- [ ] Dashboard accessible
- [ ] All features working

---

## 🎉 Success!

Your application is now live and ready for users!

**Frontend**: https://your-frontend.vercel.app
**Backend API**: https://your-backend.onrender.com/api
**API Docs**: https://your-backend.onrender.com/swagger/

---

## 📞 Need Help?

- **Render Docs**: https://render.com/docs
- **Vercel Docs**: https://vercel.com/docs
- **Django Docs**: https://docs.djangoproject.com
- **Next.js Docs**: https://nextjs.org/docs

