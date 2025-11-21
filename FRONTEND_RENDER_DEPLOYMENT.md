# Deploying Frontend to Render

This guide will help you deploy your Next.js frontend to Render and ensure it communicates correctly with your backend.

---

## 📋 Prerequisites

- Backend already deployed on Render (or ready to deploy)
- GitHub repository with your code
- Render account

---

## 🚀 Step 1: Prepare Your Frontend

### 1.1 Update Environment Variables

The frontend is already configured to use `NEXT_PUBLIC_API_URL` environment variable. You'll set this in Render.

### 1.2 Verify Build Configuration

Your `package.json` should have these scripts:
```json
{
  "scripts": {
    "build": "next build",
    "start": "next start"
  }
}
```

---

## 🎯 Step 2: Deploy Frontend to Render

### 2.1 Create New Web Service

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository
4. Select the repository containing your frontend

### 2.2 Configure the Service

**Basic Settings:**
- **Name**: `kbl-frontend` (or your preferred name)
- **Environment**: `Node`
- **Region**: Choose closest to your users
- **Branch**: `main` (or your default branch)

**Build & Deploy:**
- **Root Directory**: `kbl_frontend` (if your frontend is in a subdirectory)
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm start`

**OR** if you're using the `render.yaml` file:
- Render will automatically detect and use it

### 2.3 Set Environment Variables

Click **"Environment"** tab and add:

```bash
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://business-diagnostic-tool.onrender.com/api
```

**Important**: 
- Make sure to include `/api` at the end
- Your backend URL: `https://business-diagnostic-tool.onrender.com`
- Full API URL: `https://business-diagnostic-tool.onrender.com/api`

### 2.4 Advanced Settings (Optional)

- **Auto-Deploy**: `Yes` (deploys on every push to main)
- **Health Check Path**: `/` (or leave empty)

---

## ⚙️ Step 3: Update Backend CORS Settings

Your backend needs to allow requests from your frontend Render URL.

### 3.1 Update Backend Environment Variables

In your **backend Render service**, go to **"Environment"** and add/update:

```bash
# Frontend URL (for CORS and redirects) - UPDATE THIS AFTER FRONTEND DEPLOYMENT
FRONTEND_URL=https://your-frontend.onrender.com

# CORS Allowed Origins (comma-separated)
CORS_ALLOWED_ORIGINS=https://your-frontend.onrender.com,http://localhost:3000,http://localhost:8085

# Backend URL (for email verification links)
BACKEND_BASE_URL=https://business-diagnostic-tool.onrender.com

# Public Base URL
PUBLIC_BASE_URL=https://business-diagnostic-tool.onrender.com
```

**Important**: 
- Your backend URL: `https://business-diagnostic-tool.onrender.com` ✅
- Replace `your-frontend.onrender.com` with your actual frontend Render URL after deployment

### 3.2 Redeploy Backend

After updating environment variables, redeploy your backend service.

---

## ✅ Step 4: Verify Deployment

### 4.1 Check Frontend is Running

1. Visit your frontend URL: `https://your-frontend.onrender.com`
2. You should see your application

### 4.2 Test API Connection

1. Open browser DevTools (F12)
2. Go to **Console** tab
3. Try to login or register
4. Check for any CORS errors
5. Verify API calls are going to: `https://business-diagnostic-tool.onrender.com/api/...`

### 4.3 Common Issues

**CORS Error:**
```
Access to fetch at 'https://business-diagnostic-tool.onrender.com/api/...' from origin 'https://your-frontend.onrender.com' has been blocked by CORS policy
```

**Solution:**
- Verify `CORS_ALLOWED_ORIGINS` includes your frontend URL
- Verify `FRONTEND_URL` is set correctly
- Redeploy backend after changes

**404 on API calls:**
```
Failed to load resource: the server responded with a status of 404
```

**Solution:**
- Verify `NEXT_PUBLIC_API_URL` includes `/api` at the end
- Check backend is running and accessible
- Test backend directly: `https://business-diagnostic-tool.onrender.com/health/`

**Build Fails:**
```
Error: Command failed: npm run build
```

**Solution:**
- Check build logs in Render
- Verify all dependencies are in `package.json`
- Check for TypeScript errors locally first

---

## 🔧 Step 5: Environment Variables Summary

### Frontend (Render) - Required:

```bash
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://business-diagnostic-tool.onrender.com/api
```

### Backend (Render) - Required:

```bash
# Django
DJANGO_SECRET_KEY=your-secret-key
DJANGO_DEBUG=False
DJANGO_ALLOWED_HOSTS=business-diagnostic-tool.onrender.com

# Database
POSTGRES_DB=kbl_backend
POSTGRES_USER=kbl_user
POSTGRES_PASSWORD=your-password
POSTGRES_HOST=dpg-xxx.onrender.com
POSTGRES_PORT=5432

# Email
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password
DEFAULT_FROM_EMAIL=your-email@gmail.com

# URLs (IMPORTANT!)
FRONTEND_URL=https://your-frontend.onrender.com  # UPDATE AFTER FRONTEND DEPLOYMENT
BACKEND_BASE_URL=https://business-diagnostic-tool.onrender.com
PUBLIC_BASE_URL=https://business-diagnostic-tool.onrender.com
CORS_ALLOWED_ORIGINS=https://your-frontend.onrender.com,http://localhost:3000  # UPDATE AFTER FRONTEND DEPLOYMENT
CSRF_TRUSTED_ORIGINS=https://your-frontend.onrender.com,https://business-diagnostic-tool.onrender.com  # UPDATE AFTER FRONTEND DEPLOYMENT
```

---

## 📝 Step 6: Using render.yaml (Alternative)

If you prefer using `render.yaml` for infrastructure as code:

### Frontend render.yaml:

```yaml
services:
  - type: web
    name: kbl-frontend
    env: node
    buildCommand: npm install && npm run build
    startCommand: npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: NEXT_PUBLIC_API_URL
        sync: false  # Set this in Render dashboard
```

**Note**: You still need to set `NEXT_PUBLIC_API_URL` in the Render dashboard as it's marked `sync: false`.

---

## 🎯 Quick Checklist

After deployment, verify:

- [ ] Frontend is accessible at `https://your-frontend.onrender.com`
- [ ] Backend is accessible at `https://your-backend.onrender.com/health/`
- [ ] `NEXT_PUBLIC_API_URL` is set correctly (includes `/api`)
- [ ] `FRONTEND_URL` is set in backend
- [ ] `CORS_ALLOWED_ORIGINS` includes frontend URL
- [ ] Can login/register from frontend
- [ ] API calls work (check browser console)
- [ ] Email verification links work
- [ ] No CORS errors in browser console

---

## 🐛 Troubleshooting

### Frontend Shows Blank Page

1. Check browser console for errors
2. Check Render build logs
3. Verify `NEXT_PUBLIC_API_URL` is set
4. Check if backend is accessible

### API Calls Return 401 Unauthorized

1. Verify tokens are being stored in localStorage
2. Check if backend JWT settings are correct
3. Verify CORS is allowing credentials

### Build Takes Too Long

1. Render free tier has build time limits
2. Consider optimizing dependencies
3. Use `.npmrc` to cache dependencies

### Environment Variables Not Working

1. Variables starting with `NEXT_PUBLIC_` are exposed to browser
2. Restart service after adding variables
3. Check variable names are correct (case-sensitive)

---

## 📚 Additional Resources

- [Render Documentation](https://render.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [CORS Configuration](https://render.com/docs/cors)

---

## 🎉 Success!

Once everything is working:

1. Your frontend is live at: `https://your-frontend.onrender.com`
2. Your backend is live at: `https://business-diagnostic-tool.onrender.com` ✅
3. They communicate correctly via API
4. Email verification works
5. Users can register, login, and use the app!

---

**Need Help?** Check the logs in Render dashboard for detailed error messages.

