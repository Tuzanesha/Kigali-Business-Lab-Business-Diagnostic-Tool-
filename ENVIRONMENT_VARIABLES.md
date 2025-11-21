# Environment Variables Reference

This document lists all environment variables used in the KBL Business Diagnostic Tool.

## 🔵 Backend (Django) - Render

### Required Variables

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `DJANGO_SECRET_KEY` | Django secret key for cryptographic signing | `django-insecure-...` | ✅ Yes |
| `DJANGO_DEBUG` | Enable/disable debug mode | `False` | ✅ Yes |
| `DJANGO_ALLOWED_HOSTS` | Comma-separated list of allowed hosts | `your-app.onrender.com` | ✅ Yes |
| `POSTGRES_DB` | PostgreSQL database name | `kbl_backend` | ✅ Yes |
| `POSTGRES_USER` | PostgreSQL username | `kbl_user` | ✅ Yes |
| `POSTGRES_PASSWORD` | PostgreSQL password | `secure-password` | ✅ Yes |
| `POSTGRES_HOST` | PostgreSQL host | `dpg-xxx.onrender.com` | ✅ Yes |
| `POSTGRES_PORT` | PostgreSQL port | `5432` | ✅ Yes |

### Optional Variables

| Variable | Description | Example | Default |
|----------|-------------|---------|---------|
| `EMAIL_BACKEND` | Email backend to use | `django.core.mail.backends.smtp.EmailBackend` | Console (if DEBUG) |
| `EMAIL_HOST` | SMTP server host | `smtp.gmail.com` | `smtp.gmail.com` |
| `EMAIL_PORT` | SMTP server port | `587` | `587` |
| `EMAIL_USE_TLS` | Enable TLS for SMTP | `True` | `True` |
| `EMAIL_HOST_USER` | SMTP username | `your-email@gmail.com` | - |
| `EMAIL_HOST_PASSWORD` | SMTP password/app password | `app-password` | - |
| `DEFAULT_FROM_EMAIL` | Default sender email | `noreply@example.com` | `EMAIL_HOST_USER` |
| `PUBLIC_BASE_URL` | Public-facing base URL | `https://your-app.onrender.com` | `http://localhost:8085` |
| `FRONTEND_URL` | Frontend application URL | `https://your-app.vercel.app` | `http://localhost:3000` |
| `BACKEND_BASE_URL` | Backend API base URL | `https://your-app.onrender.com` | `http://localhost:8000` |
| `CORS_ALLOWED_ORIGINS` | Comma-separated CORS origins | `https://app.vercel.app` | Localhost only |
| `CSRF_TRUSTED_ORIGINS` | Comma-separated CSRF origins | `https://app.onrender.com` | Localhost only |

### Generating Secret Key

```bash
# Python
python -c "import secrets; print(secrets.token_urlsafe(32))"

# OpenSSL
openssl rand -hex 32
```

---

## 🟢 Frontend (Next.js) - Vercel

### Required Variables

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `NEXT_PUBLIC_API_URL` | Backend API URL (must start with `NEXT_PUBLIC_`) | `https://your-app.onrender.com/api` | ✅ Yes |

### Optional Variables

| Variable | Description | Example | Default |
|----------|-------------|---------|---------|
| `NODE_ENV` | Node environment | `production` | `production` (on Vercel) |

---

## 🔐 Security Notes

1. **Never commit** `.env` files to Git
2. **Use strong secrets** for `DJANGO_SECRET_KEY`
3. **Use app passwords** for Gmail (not your regular password)
4. **Rotate secrets** periodically
5. **Limit CORS origins** to your actual frontend domains

---

## 📝 Example .env Files

### Backend (.env) - Local Development

```env
DJANGO_SECRET_KEY=dev-secret-key-change-in-production
DJANGO_DEBUG=True
DJANGO_ALLOWED_HOSTS=localhost,127.0.0.1
POSTGRES_DB=kbl_backend
POSTGRES_USER=kbl_user
POSTGRES_PASSWORD=kblUser1234
POSTGRES_HOST=localhost
POSTGRES_PORT=5434
EMAIL_BACKEND=django.core.mail.backends.console.EmailBackend
PUBLIC_BASE_URL=http://localhost:8085
FRONTEND_URL=http://localhost:3000
BACKEND_BASE_URL=http://localhost:8000
```

### Frontend (.env.local) - Local Development

```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

---

## 🚀 Production Setup

### Render (Backend)

Set all variables in Render Dashboard → Your Service → Environment

### Vercel (Frontend)

Set variables in Vercel Dashboard → Your Project → Settings → Environment Variables

**Important**: For Next.js, environment variables that should be available in the browser must start with `NEXT_PUBLIC_`.

---

## 🔄 Updating Environment Variables

### Render
1. Go to Dashboard → Your Service → Environment
2. Add/Edit variables
3. Save (service will automatically redeploy)

### Vercel
1. Go to Dashboard → Your Project → Settings → Environment Variables
2. Add/Edit variables
3. Save (next deployment will use new values)

---

## ✅ Verification

After setting environment variables:

### Backend
```bash
# Check if variables are loaded
python manage.py shell
>>> import os
>>> print(os.getenv('DJANGO_SECRET_KEY'))
```

### Frontend
```bash
# Check in browser console
console.log(process.env.NEXT_PUBLIC_API_URL)
```

---

## 🆘 Troubleshooting

**Variable not found:**
- Check spelling (case-sensitive)
- Restart service after adding variables
- Verify variable is set in correct environment (production/development)

**CORS errors:**
- Ensure `CORS_ALLOWED_ORIGINS` includes your frontend URL
- Check `FRONTEND_URL` matches your actual frontend domain

**Database connection errors:**
- Verify all `POSTGRES_*` variables are set
- Check database is running
- Verify credentials are correct

