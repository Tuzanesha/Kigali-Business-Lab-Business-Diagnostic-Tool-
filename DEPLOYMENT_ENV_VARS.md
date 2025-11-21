# Environment Variables for Deployment

## ✅ Your Backend URL
**Backend**: `https://business-diagnostic-tool.onrender.com`

---

## 🎯 Frontend Environment Variables (Render)

When deploying your frontend to Render, set these:

```bash
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://business-diagnostic-tool.onrender.com/api
```

**Important**: Make sure to include `/api` at the end!

---

## 🔧 Backend Environment Variables (Render)

Update these in your backend Render service:

### Required URLs (Update after frontend deployment):

```bash
# Frontend URL - UPDATE THIS after you deploy frontend
FRONTEND_URL=https://your-frontend.onrender.com

# CORS - UPDATE THIS after you deploy frontend
CORS_ALLOWED_ORIGINS=https://your-frontend.onrender.com,http://localhost:3000,http://localhost:8085

# Backend URLs (already correct)
BACKEND_BASE_URL=https://business-diagnostic-tool.onrender.com
PUBLIC_BASE_URL=https://business-diagnostic-tool.onrender.com

# CSRF - UPDATE THIS after you deploy frontend
CSRF_TRUSTED_ORIGINS=https://your-frontend.onrender.com,https://business-diagnostic-tool.onrender.com
```

### Other Required Variables:

```bash
# Django
DJANGO_SECRET_KEY=your-secret-key
DJANGO_DEBUG=False
DJANGO_ALLOWED_HOSTS=business-diagnostic-tool.onrender.com

# Database
POSTGRES_DB=kbl_backend
POSTGRES_USER=kbl_user
POSTGRES_PASSWORD=your-password
POSTGRES_HOST=your-db-host.onrender.com
POSTGRES_PORT=5432

# Email
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password
DEFAULT_FROM_EMAIL=your-email@gmail.com
```

---

## 📝 Deployment Steps

1. **Deploy Frontend** with `NEXT_PUBLIC_API_URL=https://business-diagnostic-tool.onrender.com/api`
2. **Note your frontend URL** (e.g., `https://kbl-frontend.onrender.com`)
3. **Update Backend** with frontend URL in:
   - `FRONTEND_URL`
   - `CORS_ALLOWED_ORIGINS`
   - `CSRF_TRUSTED_ORIGINS`
4. **Redeploy Backend** after updating environment variables

---

## ✅ Quick Checklist

- [ ] Frontend `NEXT_PUBLIC_API_URL` set to `https://business-diagnostic-tool.onrender.com/api`
- [ ] Backend `FRONTEND_URL` updated with your frontend URL
- [ ] Backend `CORS_ALLOWED_ORIGINS` includes your frontend URL
- [ ] Backend `CSRF_TRUSTED_ORIGINS` includes your frontend URL
- [ ] Backend redeployed after URL updates

