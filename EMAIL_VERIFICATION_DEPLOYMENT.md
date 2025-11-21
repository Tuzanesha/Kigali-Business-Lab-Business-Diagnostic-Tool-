# Email Verification in Production

## ✅ Yes, Email Verification Will Work After Deployment!

Your email verification is configured to work in production, but you need to set the correct environment variables.

---

## 🔧 Required Environment Variables for Production

### Backend (Render) - Required Variables:

```bash
# Backend URL (for verification links)
BACKEND_BASE_URL=https://your-backend.onrender.com

# Frontend URL (for redirects after verification)
FRONTEND_URL=https://your-frontend.vercel.app

# Public Base URL (can be same as BACKEND_BASE_URL)
PUBLIC_BASE_URL=https://your-backend.onrender.com
```

---

## 📧 How Email Verification Works in Production

### Step 1: User Registers
- User signs up on your Vercel frontend
- Backend creates an OTP and sends verification email
- **Verification link points to**: `https://your-backend.onrender.com/api/auth/verify-email/?uid=...&code=...`

### Step 2: User Clicks Link
- Link goes directly to your Render backend
- Backend verifies the OTP code
- **Backend redirects to**: `https://your-frontend.vercel.app/verification-status?verification=success`

### Step 3: User Sees Result
- Frontend shows verification status page
- User can then login

---

## ⚙️ Configuration Steps

### 1. After Deploying Backend to Render:

Add these environment variables in Render Dashboard:

```bash
BACKEND_BASE_URL=https://kbl-backend.onrender.com
FRONTEND_URL=https://kbl-frontend.vercel.app
PUBLIC_BASE_URL=https://kbl-backend.onrender.com
```

**Important**: Replace with your actual URLs!

### 2. After Deploying Frontend to Vercel:

The frontend doesn't need special configuration - it just needs to be accessible.

### 3. Test Email Verification:

1. Register a new user on your Vercel frontend
2. Check your email inbox
3. Click the verification link
4. Should redirect to: `https://your-frontend.vercel.app/verification-status?verification=success`

---

## 🔍 How It Works

### Development (Local):
- Verification link: `http://localhost:8085/api/auth/verify-email/...`
- Redirects to: `http://localhost:8085/verification-status`

### Production:
- Verification link: `https://your-backend.onrender.com/api/auth/verify-email/...`
- Redirects to: `https://your-frontend.vercel.app/verification-status`

---

## ✅ Verification Checklist

After deployment, verify:

- [ ] `BACKEND_BASE_URL` is set to your Render backend URL
- [ ] `FRONTEND_URL` is set to your Vercel frontend URL
- [ ] `PUBLIC_BASE_URL` is set to your Render backend URL
- [ ] Email sending works (test with notification)
- [ ] Verification link in email points to backend URL
- [ ] Clicking link redirects to frontend verification status page
- [ ] User can login after verification

---

## 🐛 Troubleshooting

### Verification Link Doesn't Work

**Problem**: Link returns 404 or doesn't verify

**Solutions**:
1. Check `BACKEND_BASE_URL` is set correctly
2. Verify the link format: `https://backend.onrender.com/api/auth/verify-email/?uid=...&code=...`
3. Check Render logs for errors
4. Ensure backend is accessible: `curl https://your-backend.onrender.com/health/`

### Redirect Goes to Wrong URL

**Problem**: After verification, redirect goes to backend instead of frontend

**Solutions**:
1. Check `FRONTEND_URL` is set correctly in Render
2. Verify it's your Vercel URL (not Render URL)
3. Redeploy backend after changing environment variables

### Email Not Received

**Problem**: User doesn't receive verification email

**Solutions**:
1. Check spam folder
2. Verify Gmail App Password is correct
3. Check `EMAIL_HOST_USER` matches your Gmail
4. Test email sending: `python manage.py test_email --email your-email@gmail.com`
5. Check Render logs for email errors

---

## 📝 Example Environment Variables

### Render (Backend) - Complete Setup:

```bash
# Django
DJANGO_SECRET_KEY=your-secret-key
DJANGO_DEBUG=False
DJANGO_ALLOWED_HOSTS=kbl-backend.onrender.com

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

# URLs (IMPORTANT FOR EMAIL VERIFICATION!)
BACKEND_BASE_URL=https://kbl-backend.onrender.com
FRONTEND_URL=https://kbl-frontend.vercel.app
PUBLIC_BASE_URL=https://kbl-backend.onrender.com
```

---

## 🎯 Summary

**Yes, email verification will work in production!** Just make sure:

1. ✅ `BACKEND_BASE_URL` = Your Render backend URL
2. ✅ `FRONTEND_URL` = Your Vercel frontend URL  
3. ✅ Email settings are configured correctly
4. ✅ Backend is accessible and running

The verification link will point to your backend API, and after verification, users will be redirected to your frontend.

