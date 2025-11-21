# Quick Start: Deploy Frontend & Backend to Render

## 🚀 Quick Deployment Steps

### 1. Deploy Backend First

1. Go to [Render Dashboard](https://dashboard.render.com)
2. **New +** → **Web Service**
3. Connect GitHub repo
4. Configure:
   - **Name**: `kbl-backend`
   - **Root Directory**: `kbl-backend`
   - **Environment**: `Docker`
   - **Build Command**: (auto-detected)
   - **Start Command**: (auto-detected)

5. **Add Environment Variables:**
   ```bash
   DJANGO_SECRET_KEY=your-secret-key
   DJANGO_DEBUG=False
   POSTGRES_DB=kbl_backend
   POSTGRES_USER=kbl_user
   POSTGRES_PASSWORD=your-password
   POSTGRES_HOST=your-db-host.onrender.com
   POSTGRES_PORT=5432
   EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USE_TLS=True
   EMAIL_HOST_USER=your-email@gmail.com
   EMAIL_HOST_PASSWORD=your-app-password
   DEFAULT_FROM_EMAIL=your-email@gmail.com
   ```

6. **Wait for deployment** → Note your backend URL: `https://kbl-backend.onrender.com`

---

### 2. Deploy Frontend

1. **New +** → **Web Service**
2. Connect same GitHub repo
3. Configure:
   - **Name**: `kbl-frontend`
   - **Root Directory**: `kbl_frontend`
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`

4. **Add Environment Variables:**
   ```bash
   NODE_ENV=production
   NEXT_PUBLIC_API_URL=https://business-diagnostic-tool.onrender.com/api
   ```
   ✅ **Your backend URL: `https://business-diagnostic-tool.onrender.com`**

5. **Wait for deployment** → Note your frontend URL: `https://kbl-frontend.onrender.com`

---

### 3. Update Backend CORS

Go back to **backend service** → **Environment** → Add:

```bash
FRONTEND_URL=https://your-frontend.onrender.com  # UPDATE AFTER FRONTEND DEPLOYMENT
CORS_ALLOWED_ORIGINS=https://your-frontend.onrender.com,http://localhost:3000  # UPDATE AFTER FRONTEND DEPLOYMENT
BACKEND_BASE_URL=https://business-diagnostic-tool.onrender.com
PUBLIC_BASE_URL=https://business-diagnostic-tool.onrender.com
```

✅ **Your backend URL: `https://business-diagnostic-tool.onrender.com`**  
⚠️ **Replace `your-frontend.onrender.com` with your actual frontend URL after deployment!**

**Redeploy backend** after adding these variables.

---

### 4. Test

1. Visit: `https://your-frontend.onrender.com`
2. Try to register/login
3. Check browser console (F12) for errors
4. Verify API calls are going to: `https://business-diagnostic-tool.onrender.com/api/...`

---

## ✅ Checklist

- [ ] Backend deployed and accessible
- [ ] Frontend deployed and accessible
- [ ] `NEXT_PUBLIC_API_URL` set correctly (includes `/api`)
- [ ] `FRONTEND_URL` set in backend
- [ ] `CORS_ALLOWED_ORIGINS` includes frontend URL
- [ ] Backend redeployed after CORS changes
- [ ] Can login/register from frontend
- [ ] No CORS errors in console

---

## 🐛 Common Issues

**CORS Error?**
→ Add frontend URL to `CORS_ALLOWED_ORIGINS` in backend

**404 on API?**
→ Check `NEXT_PUBLIC_API_URL` includes `/api`

**Build fails?**
→ Check Render build logs for errors

---

## 📚 Full Documentation

See `FRONTEND_RENDER_DEPLOYMENT.md` for detailed instructions.

