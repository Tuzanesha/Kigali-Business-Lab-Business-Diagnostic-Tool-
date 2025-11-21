# ✅ Frontend-Backend Integration Complete

## 🎯 Your Deployed URLs

- **Frontend**: `https://kigali-business-lab-business-diagnostic.onrender.com`
- **Backend**: `https://business-diagnostic-tool.onrender.com`

---

## 🔧 Required Backend Environment Variables (Render)

Go to your **backend Render service** → **Environment** tab and update/add these variables:

### Critical: Update These Now

```bash
# Frontend URL (for CORS, redirects, and email verification links)
FRONTEND_URL=https://kigali-business-lab-business-diagnostic.onrender.com

# CORS Allowed Origins (comma-separated, no spaces after commas)
CORS_ALLOWED_ORIGINS=https://kigali-business-lab-business-diagnostic.onrender.com,http://localhost:3000,http://localhost:8085

# CSRF Trusted Origins (comma-separated)
CSRF_TRUSTED_ORIGINS=https://kigali-business-lab-business-diagnostic.onrender.com,https://business-diagnostic-tool.onrender.com

# Backend URL (for email verification links)
BACKEND_BASE_URL=https://business-diagnostic-tool.onrender.com

# Public Base URL
PUBLIC_BASE_URL=https://business-diagnostic-tool.onrender.com
```

### Other Required Variables (Verify These Are Set)

```bash
# Django Settings
DJANGO_SECRET_KEY=your-secret-key-here
DJANGO_DEBUG=False
ALLOWED_HOSTS=business-diagnostic-tool.onrender.com

# Database (from your PostgreSQL service)
POSTGRES_DB=your-db-name
POSTGRES_USER=your-db-user
POSTGRES_PASSWORD=your-db-password
POSTGRES_HOST=your-db-host.onrender.com
POSTGRES_PORT=5432

# Email Configuration
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password
DEFAULT_FROM_EMAIL=your-email@gmail.com
```

---

## ✅ Frontend Environment Variables (Already Set)

Your frontend should already have:
```bash
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://business-diagnostic-tool.onrender.com/api
```

**Verify this in your frontend Render service** → **Environment** tab.

---

## 🚀 Steps to Complete Integration

### Step 1: Update Backend Environment Variables

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Select your **backend service** (`business-diagnostic-tool`)
3. Go to **Environment** tab
4. Add/update the variables listed above (especially `FRONTEND_URL` and `CORS_ALLOWED_ORIGINS`)
5. Click **Save Changes**
6. **Redeploy** your backend service (or it will auto-redeploy)

### Step 2: Verify Frontend Environment Variables

1. Go to your **frontend service** on Render
2. Check **Environment** tab
3. Verify `NEXT_PUBLIC_API_URL=https://business-diagnostic-tool.onrender.com/api`
4. If missing, add it and redeploy

### Step 3: Test Integration

1. **Visit your frontend**: `https://kigali-business-lab-business-diagnostic.onrender.com`
2. **Open Browser DevTools** (F12) → **Console** tab
3. **Try to register/login**:
   - Check for CORS errors
   - Verify API calls go to: `https://business-diagnostic-tool.onrender.com/api/...`
4. **Test email verification**:
   - Register a new account
   - Check email for verification link
   - Click the link - it should redirect to your frontend

---

## 🐛 Troubleshooting

### CORS Error
```
Access to fetch at 'https://business-diagnostic-tool.onrender.com/api/...' 
from origin 'https://kigali-business-lab-business-diagnostic.onrender.com' 
has been blocked by CORS policy
```

**Solution:**
- Verify `CORS_ALLOWED_ORIGINS` includes your frontend URL exactly (with `https://`)
- Verify `FRONTEND_URL` is set correctly
- Redeploy backend after changes

### 401 Unauthorized
```
Failed to load resource: the server responded with a status of 401
```

**Solution:**
- Check that `NEXT_PUBLIC_API_URL` includes `/api` at the end
- Verify tokens are being stored in localStorage
- Check browser console for token errors

### Email Verification Links Don't Work
- Verify `FRONTEND_URL` is set to your frontend URL
- Verify `BACKEND_BASE_URL` is set to your backend URL
- Check email links point to backend API, which redirects to frontend

### API Calls Go to Wrong URL
- Verify `NEXT_PUBLIC_API_URL=https://business-diagnostic-tool.onrender.com/api`
- Clear browser cache and hard refresh (Ctrl+Shift+R / Cmd+Shift+R)
- Check browser console for API base URL logs

---

## ✅ Verification Checklist

- [ ] Backend `FRONTEND_URL` is set to your frontend URL
- [ ] Backend `CORS_ALLOWED_ORIGINS` includes your frontend URL
- [ ] Backend `CSRF_TRUSTED_ORIGINS` includes your frontend URL
- [ ] Frontend `NEXT_PUBLIC_API_URL` is set to `https://business-diagnostic-tool.onrender.com/api`
- [ ] Both services are deployed and running
- [ ] No CORS errors in browser console
- [ ] Login/Register works
- [ ] Email verification links work
- [ ] API calls succeed (check Network tab)

---

## 📞 Quick Reference

**Backend Health Check:**
```
https://business-diagnostic-tool.onrender.com/health/
```

**Frontend URL:**
```
https://kigali-business-lab-business-diagnostic.onrender.com
```

**API Base URL:**
```
https://business-diagnostic-tool.onrender.com/api
```

---

## 🎉 You're All Set!

Once you've updated the backend environment variables and redeployed, your frontend and backend should be fully integrated and working together!

