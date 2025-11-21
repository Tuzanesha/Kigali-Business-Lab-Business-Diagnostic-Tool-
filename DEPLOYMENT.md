# Deployment Guide: Render (Backend) + Vercel (Frontend)

This guide will help you deploy the KBL Business Diagnostic Tool using:
- **Render** for the Django backend
- **Vercel** for the Next.js frontend

---

## 📋 Prerequisites

1. **GitHub Account** - Your code should be in a GitHub repository
2. **Render Account** - Sign up at [render.com](https://render.com)
3. **Vercel Account** - Sign up at [vercel.com](https://vercel.com)
4. **Domain (Optional)** - For custom domains

---

## 🚀 Part 1: Deploy Backend to Render

### Step 1: Prepare Your Repository

1. Ensure your backend code is in the `kbl-backend` directory
2. Make sure `render.yaml` is in the `kbl-backend` directory
3. Commit and push to GitHub

### Step 2: Create PostgreSQL Database on Render

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click **"New +"** → **"PostgreSQL"**
3. Configure:
   - **Name**: `kbl-db`
   - **Database**: `kbl_backend`
   - **User**: `kbl_user`
   - **Region**: Choose closest to your users
   - **Plan**: Starter (Free tier available)
4. Click **"Create Database"**
5. **Save the connection details** - you'll need them later

### Step 3: Create Web Service on Render

1. In Render Dashboard, click **"New +"** → **"Web Service"**
2. Connect your GitHub repository
3. Configure:
   - **Name**: `kbl-backend`
   - **Region**: Same as database
   - **Branch**: `main` (or your default branch)
   - **Root Directory**: `kbl-backend`
   - **Runtime**: `Docker`
   - **Dockerfile Path**: `Dockerfile`
   - **Docker Context**: `.`
   - **Start Command**: `gunicorn config.wsgi:application --bind 0.0.0.0:$PORT --workers 3`

### Step 4: Configure Environment Variables

In the Render dashboard, go to your web service → **Environment** tab, and add:

```bash
# Django Settings
DJANGO_SECRET_KEY=your-super-secret-key-here-generate-with-openssl-rand-hex-32
DJANGO_DEBUG=False
DJANGO_ALLOWED_HOSTS=your-backend-url.onrender.com,your-custom-domain.com

# Database (Auto-filled if you linked the database)
POSTGRES_DB=kbl_backend
POSTGRES_USER=kbl_user
POSTGRES_PASSWORD=(from database)
POSTGRES_HOST=(from database)
POSTGRES_PORT=5432

# Email Configuration
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password
DEFAULT_FROM_EMAIL=your-email@gmail.com

# URLs (Update after deployment)
PUBLIC_BASE_URL=https://your-backend-url.onrender.com
FRONTEND_URL=https://your-frontend-url.vercel.app
BACKEND_BASE_URL=https://your-backend-url.onrender.com
```

**Generate Secret Key:**
```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

### Step 5: Deploy

1. Click **"Create Web Service"**
2. Render will build and deploy your backend
3. Wait for deployment to complete (5-10 minutes)
4. **Save your backend URL** (e.g., `https://kbl-backend.onrender.com`)

### Step 6: Run Initial Migrations

1. In Render dashboard, go to your web service
2. Click **"Shell"** tab
3. Run:
```bash
python manage.py migrate
python manage.py createsuperuser
python manage.py import_questions
```

---

## 🎨 Part 2: Deploy Frontend to Vercel

### Step 1: Prepare Frontend

1. Ensure your frontend code is in the `kbl_frontend` directory
2. Make sure `vercel.json` is in the `kbl_frontend` directory

### Step 2: Connect Repository to Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **"Add New..."** → **"Project"**
3. Import your GitHub repository
4. Configure:
   - **Framework Preset**: Next.js
   - **Root Directory**: `kbl_frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`

### Step 3: Configure Environment Variables

In Vercel dashboard, go to your project → **Settings** → **Environment Variables**, and add:

```bash
NEXT_PUBLIC_API_URL=https://your-backend-url.onrender.com/api
```

**Important**: Replace `your-backend-url.onrender.com` with your actual Render backend URL.

### Step 4: Deploy

1. Click **"Deploy"**
2. Vercel will build and deploy your frontend
3. Wait for deployment (2-5 minutes)
4. **Save your frontend URL** (e.g., `https://kbl-frontend.vercel.app`)

### Step 5: Update Backend CORS Settings

After getting your Vercel URL, update the backend environment variables on Render:

1. Go back to Render dashboard → Your web service → **Environment**
2. Update:
   ```bash
   FRONTEND_URL=https://your-frontend-url.vercel.app
   PUBLIC_BASE_URL=https://your-backend-url.onrender.com
   ```
3. Also update `DJANGO_ALLOWED_HOSTS`:
   ```bash
   DJANGO_ALLOWED_HOSTS=your-backend-url.onrender.com
   ```
4. **Redeploy** the backend service

---

## 🔧 Part 3: Update Backend CORS Configuration

After deployment, you need to update the Django settings to allow your Vercel domain.

### Option 1: Update settings.py (Recommended)

Add your production domains to `CORS_ALLOWED_ORIGINS` in `kbl-backend/config/settings.py`:

```python
CORS_ALLOWED_ORIGINS = [
    "https://your-frontend-url.vercel.app",
    "https://www.your-custom-domain.com",  # If using custom domain
] + (["http://localhost:3000", "http://localhost:8085"] if DEBUG else [])

CSRF_TRUSTED_ORIGINS = CORS_ALLOWED_ORIGINS + [
    "https://your-backend-url.onrender.com",
]
```

### Option 2: Use Environment Variables

Update `settings.py` to read from environment:

```python
CORS_ALLOWED_ORIGINS = os.getenv(
    'CORS_ALLOWED_ORIGINS',
    'http://localhost:3000,http://localhost:8085'
).split(',') if DEBUG else os.getenv('CORS_ALLOWED_ORIGINS', '').split(',')
```

Then add to Render environment variables:
```bash
CORS_ALLOWED_ORIGINS=https://your-frontend-url.vercel.app
```

---

## 🌐 Part 4: Custom Domains (Optional)

### Backend Custom Domain (Render)

1. In Render dashboard → Your web service → **Settings**
2. Scroll to **"Custom Domains"**
3. Add your domain
4. Follow DNS configuration instructions
5. Update `DJANGO_ALLOWED_HOSTS` with your custom domain

### Frontend Custom Domain (Vercel)

1. In Vercel dashboard → Your project → **Settings** → **Domains**
2. Add your domain
3. Follow DNS configuration instructions
4. Update `NEXT_PUBLIC_API_URL` in Vercel environment variables

---

## ✅ Post-Deployment Checklist

- [ ] Backend deployed and accessible
- [ ] Database migrations run
- [ ] Superuser created
- [ ] Questions imported (`python manage.py import_questions`)
- [ ] Frontend deployed and accessible
- [ ] Frontend can connect to backend API
- [ ] CORS configured correctly
- [ ] Email sending works (test with notification)
- [ ] User registration works
- [ ] User login works
- [ ] Email verification works

---

## 🐛 Troubleshooting

### Backend Issues

**Database Connection Error:**
- Check database credentials in Render environment variables
- Ensure database is running
- Verify `POSTGRES_HOST` includes port if needed

**Static Files Not Loading:**
- Ensure `collectstatic` runs during build
- Check `STATIC_ROOT` in settings.py
- Verify WhiteNoise is configured

**CORS Errors:**
- Verify `CORS_ALLOWED_ORIGINS` includes your Vercel URL
- Check `DJANGO_ALLOWED_HOSTS` includes your Render URL
- Ensure `CORS_ALLOW_CREDENTIALS = True` in settings

### Frontend Issues

**API Connection Errors:**
- Verify `NEXT_PUBLIC_API_URL` is set correctly
- Check backend is accessible
- Verify CORS is configured on backend

**Build Errors:**
- Check Node.js version (should be 18+)
- Verify all dependencies are in `package.json`
- Check for TypeScript errors

---

## 📊 Monitoring

### Render
- View logs: Dashboard → Your service → **Logs**
- Monitor metrics: Dashboard → Your service → **Metrics**

### Vercel
- View logs: Dashboard → Your project → **Deployments** → Click deployment → **Logs**
- Monitor analytics: Dashboard → Your project → **Analytics**

---

## 🔄 Updating Deployment

### Backend Updates
1. Push changes to GitHub
2. Render will automatically redeploy
3. Or manually trigger: Dashboard → Your service → **Manual Deploy**

### Frontend Updates
1. Push changes to GitHub
2. Vercel will automatically redeploy
3. Or manually trigger: Dashboard → Your project → **Deployments** → **Redeploy**

---

## 💰 Cost Estimation

### Render (Free Tier)
- Web Service: Free (with limitations)
- PostgreSQL: Free (with limitations)
- **Total**: $0/month (for testing/small projects)

### Vercel (Free Tier)
- Next.js Hosting: Free
- Bandwidth: 100GB/month free
- **Total**: $0/month (for testing/small projects)

**Note**: Free tiers have limitations. For production, consider paid plans.

---

## 🔐 Security Checklist

- [ ] `DJANGO_SECRET_KEY` is strong and secret
- [ ] `DJANGO_DEBUG=False` in production
- [ ] Database credentials are secure
- [ ] Email credentials are secure
- [ ] CORS is properly configured
- [ ] `ALLOWED_HOSTS` is set correctly
- [ ] HTTPS is enabled (automatic on Render/Vercel)
- [ ] Environment variables are not committed to Git

---

## 📞 Support

If you encounter issues:
1. Check Render/Vercel logs
2. Review this guide
3. Check Django/Next.js documentation
4. Contact support if needed

---

**Happy Deploying! 🚀**

