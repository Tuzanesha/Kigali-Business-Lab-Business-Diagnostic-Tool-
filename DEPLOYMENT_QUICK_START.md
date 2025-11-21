# Quick Start Deployment Guide

## 🚀 Deploy in 10 Minutes

### Step 1: Deploy Backend to Render (5 min)

1. **Go to [render.com](https://render.com)** and sign up/login
2. **Click "New +" → "PostgreSQL"**
   - Name: `kbl-db`
   - Plan: Free
   - Click "Create Database"
   - **Save the connection details!**

3. **Click "New +" → "Web Service"**
   - Connect your GitHub repo
   - Name: `kbl-backend`
   - Root Directory: `kbl-backend`
   - Runtime: `Docker`
   - Start Command: `gunicorn config.wsgi:application --bind 0.0.0.0:$PORT --workers 3`

4. **Add Environment Variables:**
   ```
   DJANGO_SECRET_KEY=<generate-with-python-secrets-token-urlsafe-32>
   DJANGO_DEBUG=False
   DJANGO_ALLOWED_HOSTS=<your-render-url>.onrender.com
   POSTGRES_DB=<from-database>
   POSTGRES_USER=<from-database>
   POSTGRES_PASSWORD=<from-database>
   POSTGRES_HOST=<from-database>
   POSTGRES_PORT=5432
   EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USE_TLS=True
   EMAIL_HOST_USER=your-email@gmail.com
   EMAIL_HOST_PASSWORD=your-app-password
   DEFAULT_FROM_EMAIL=your-email@gmail.com
   ```

5. **Click "Create Web Service"** and wait for deployment

6. **After deployment, run in Shell:**
   ```bash
   python manage.py migrate
   python manage.py createsuperuser
   python manage.py import_questions
   ```

7. **Save your backend URL** (e.g., `https://kbl-backend.onrender.com`)

---

### Step 2: Deploy Frontend to Vercel (5 min)

1. **Go to [vercel.com](https://vercel.com)** and sign up/login
2. **Click "Add New..." → "Project"**
   - Import your GitHub repo
   - Framework: Next.js
   - Root Directory: `kbl_frontend`
   - Build Command: `npm run build`

3. **Add Environment Variable:**
   ```
   NEXT_PUBLIC_API_URL=https://your-backend-url.onrender.com/api
   ```
   (Replace with your actual Render backend URL)

4. **Click "Deploy"** and wait

5. **Save your frontend URL** (e.g., `https://kbl-frontend.vercel.app`)

---

### Step 3: Update Backend CORS (2 min)

1. **Go back to Render** → Your service → Environment
2. **Add/Update:**
   ```
   CORS_ALLOWED_ORIGINS=https://your-frontend-url.vercel.app
   FRONTEND_URL=https://your-frontend-url.vercel.app
   PUBLIC_BASE_URL=https://your-backend-url.onrender.com
   ```
3. **Redeploy** the service

---

### Step 4: Test (1 min)

1. Visit your Vercel frontend URL
2. Try registering a new user
3. Check email for verification link
4. Login and test the app

---

## ✅ Done!

Your app is now live! 🎉

For detailed instructions, see [DEPLOYMENT.md](./DEPLOYMENT.md)

