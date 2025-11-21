# Environment Variables for Deployment

## ✅ Your Deployed URLs
**Backend**: `https://business-diagnostic-tool.onrender.com`
**Frontend**: `https://kigali-business-lab-business-diagnostic.onrender.com`

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
# Frontend URL - ✅ UPDATE THIS NOW
FRONTEND_URL=https://kigali-business-lab-business-diagnostic.onrender.com

# CORS - ✅ UPDATE THIS NOW
CORS_ALLOWED_ORIGINS=https://kigali-business-lab-business-diagnostic.onrender.com,http://localhost:3000,http://localhost:8085

# Backend URLs (already correct)
BACKEND_BASE_URL=https://business-diagnostic-tool.onrender.com
PUBLIC_BASE_URL=https://business-diagnostic-tool.onrender.com

# CSRF - ✅ UPDATE THIS NOW
CSRF_TRUSTED_ORIGINS=https://kigali-business-lab-business-diagnostic.onrender.com,https://business-diagnostic-tool.onrender.com
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

## 📝 Next Steps (URGENT - Do This Now!)

1. ✅ **Frontend is deployed** at `https://kigali-business-lab-business-diagnostic.onrender.com`
2. ⚠️ **Update Backend Environment Variables** in Render:
   - Go to your backend service → Environment tab
   - Update `FRONTEND_URL` to: `https://kigali-business-lab-business-diagnostic.onrender.com`
   - Update `CORS_ALLOWED_ORIGINS` to: `https://kigali-business-lab-business-diagnostic.onrender.com,http://localhost:3000,http://localhost:8085`
   - Update `CSRF_TRUSTED_ORIGINS` to: `https://kigali-business-lab-business-diagnostic.onrender.com,https://business-diagnostic-tool.onrender.com`
3. **Save and Redeploy** your backend service
4. **Verify Frontend** has `NEXT_PUBLIC_API_URL=https://business-diagnostic-tool.onrender.com/api`

---

## ✅ Quick Checklist

- [x] Frontend deployed at `https://kigali-business-lab-business-diagnostic.onrender.com`
- [ ] Frontend `NEXT_PUBLIC_API_URL` set to `https://business-diagnostic-tool.onrender.com/api` (verify in Render)
- [ ] Backend `FRONTEND_URL` updated to `https://kigali-business-lab-business-diagnostic.onrender.com`
- [ ] Backend `CORS_ALLOWED_ORIGINS` includes `https://kigali-business-lab-business-diagnostic.onrender.com`
- [ ] Backend `CSRF_TRUSTED_ORIGINS` includes `https://kigali-business-lab-business-diagnostic.onrender.com`
- [ ] Backend redeployed after URL updates

