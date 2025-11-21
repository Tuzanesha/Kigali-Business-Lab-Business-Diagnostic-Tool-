# 🧪 Testing Guide - Frontend-Backend Integration

## ✅ Prerequisites

Before testing, ensure:
- [ ] Backend environment variables are updated (see `INTEGRATION_COMPLETE.md`)
- [ ] Backend is redeployed after updating environment variables
- [ ] Frontend is deployed and accessible
- [ ] You have browser DevTools ready (F12)

---

## 🔍 Step 1: Basic Connectivity Test

### 1.1 Test Backend Health
Open in browser:
```
https://business-diagnostic-tool.onrender.com/health/
```

**Expected Result:**
- Should return `{"status": "ok"}` or similar JSON response
- Status code: 200

**If it fails:**
- Backend might be down or not deployed
- Check Render dashboard for service status

### 1.2 Test Frontend Loads
Open in browser:
```
https://kigali-business-lab-business-diagnostic.onrender.com
```

**Expected Result:**
- Frontend loads without errors
- No console errors in DevTools

### 1.3 Test API Connection from Frontend

1. Open frontend: `https://kigali-business-lab-business-diagnostic.onrender.com`
2. Open **DevTools** (F12) → **Console** tab
3. Type this in console:
```javascript
fetch('https://business-diagnostic-tool.onrender.com/api/health/')
  .then(r => r.json())
  .then(console.log)
  .catch(console.error)
```

**Expected Result:**
- Should return `{status: "ok"}` or similar
- No CORS errors

**If CORS error appears:**
- Backend `CORS_ALLOWED_ORIGINS` not set correctly
- Backend not redeployed after environment variable changes

---

## 🔐 Step 2: Authentication Testing

### 2.1 Test User Registration

1. Go to: `https://kigali-business-lab-business-diagnostic.onrender.com/signup`
2. Fill in registration form:
   - Full Name
   - Email (use a real email you can access)
   - Password
   - Phone (optional)
3. Submit the form
4. Open **DevTools** → **Network** tab (filter by "Fetch/XHR")
5. Watch for API calls

**Expected Results:**
- Registration API call to: `https://business-diagnostic-tool.onrender.com/api/auth/register/`
- Status: 200 or 201
- Response should indicate email verification was sent
- Success message appears on frontend
- Redirect to verification status page

**Check Console:**
- No CORS errors
- No 401/403 errors
- API calls go to correct backend URL

**If registration fails:**
- Check Network tab for error response
- Check Console for error messages
- Verify backend is running
- Check CORS settings

### 2.2 Test Email Verification

1. Check your email inbox (and spam folder)
2. Look for verification email from your app
3. Click the verification link in the email

**Expected Results:**
- Email contains verification link
- Link points to: `https://business-diagnostic-tool.onrender.com/api/auth/verify-email/?uid=...&code=...`
- After clicking, redirects to: `https://kigali-business-lab-business-diagnostic.onrender.com/verification-status?verification=success&message=email_verified`
- Success message appears on frontend

**If email not received:**
- Check spam folder
- Verify `EMAIL_HOST_USER` and `EMAIL_HOST_PASSWORD` are set correctly in backend
- Check Render logs for email sending errors
- Verify `EMAIL_BACKEND` is set to SMTP (not console)

**If verification link doesn't work:**
- Check that `FRONTEND_URL` is set correctly in backend
- Check that `BACKEND_BASE_URL` is set correctly
- Verify link format in email

### 2.3 Test User Login

1. Go to: `https://kigali-business-lab-business-diagnostic.onrender.com/login`
2. Enter credentials from registered account
3. Submit form
4. Watch **Network** tab

**Expected Results:**
- Login API call to: `https://business-diagnostic-tool.onrender.com/api/auth/login/`
- Status: 200
- Response contains `access` and `refresh` tokens
- Tokens stored in localStorage (check Application tab → Local Storage)
- Redirect to dashboard
- No console errors

**Check localStorage:**
- `accessToken` should be present
- `refreshToken` should be present

**If login fails:**
- Check Network tab for error response
- Verify email is verified (unverified users might be blocked)
- Check backend logs for authentication errors
- Verify credentials are correct

### 2.4 Test Logout

1. While logged in, click logout
2. Check **Network** tab

**Expected Results:**
- Logout API call made
- Tokens removed from localStorage
- Redirect to login page

---

## 👤 Step 3: Profile Testing

### 3.1 View Profile

1. Log in
2. Go to Settings → Profile
3. Open **Network** tab

**Expected Results:**
- API call to: `https://business-diagnostic-tool.onrender.com/api/account/profile/`
- Status: 200
- Profile data displays correctly
- No 401 errors

### 3.2 Update Profile

1. In Profile settings, update your name or other fields
2. Save changes
3. Watch **Network** tab

**Expected Results:**
- PUT request to: `https://business-diagnostic-tool.onrender.com/api/account/profile/`
- Status: 200
- Success message appears
- Changes persist after page refresh

### 3.3 Upload Avatar

1. In Profile settings, click to upload avatar
2. Select an image file
3. Watch **Network** tab

**Expected Results:**
- POST request to: `https://business-diagnostic-tool.onrender.com/api/account/avatar/upload/`
- Status: 200 or 201
- Avatar appears in sidebar/profile
- Image URL is correct

**Check:**
- Avatar displays in sidebar
- Avatar persists after page refresh
- Image loads correctly

---

## 🏢 Step 4: Enterprise & Assessment Testing

### 4.1 Create Enterprise

1. Log in
2. Go to Dashboard or Enterprises section
3. Create a new enterprise
4. Watch **Network** tab

**Expected Results:**
- POST request to: `https://business-diagnostic-tool.onrender.com/api/enterprises/`
- Status: 201
- Enterprise appears in list
- Can navigate to enterprise details

### 4.2 Start Assessment

1. Select an enterprise
2. Start assessment
3. Answer some questions
4. Submit answers

**Expected Results:**
- API calls to submit answers
- Progress is saved
- Can resume assessment
- Dashboard shows assessment status

### 4.3 View Dashboard Stats

1. Go to Dashboard
2. Check dashboard boxes/cards
3. Watch **Network** tab

**Expected Results:**
- API call to: `https://business-diagnostic-tool.onrender.com/api/my/assessment-stats/`
- Status: 200
- Stats display correctly:
  - Total assessments
  - Priority focus area
  - Average score
  - Recent activity

**If stats don't load:**
- Check Network tab for API call
- Verify response data structure
- Check Console for errors

---

## 👥 Step 5: Team Management Testing

### 5.1 View Team Members

1. Go to Settings → Team
2. Watch **Network** tab

**Expected Results:**
- API call to: `https://business-diagnostic-tool.onrender.com/api/team/`
- Status: 200
- Team members list displays

### 5.2 Invite Team Member

1. Click "Invite Member"
2. Enter email and select role
3. Submit
4. Watch **Network** tab

**Expected Results:**
- POST request to: `https://business-diagnostic-tool.onrender.com/api/team/`
- Status: 201
- Success message
- Invitation email sent (check email)
- Team member appears in list (pending)

**If invitation fails:**
- Check Network tab for error
- Verify email settings in backend
- Check backend logs

---

## 🔔 Step 6: Notifications Testing

### 6.1 View Notification Settings

1. Go to Settings → Notifications
2. Watch **Network** tab

**Expected Results:**
- API call to: `https://business-diagnostic-tool.onrender.com/api/account/notifications/`
- Status: 200
- Notification preferences display

### 6.2 Update Notification Settings

1. Toggle notification preferences
2. Save
3. Watch **Network** tab

**Expected Results:**
- PUT request to: `https://business-diagnostic-tool.onrender.com/api/account/notifications/`
- Status: 200
- Changes saved
- Success message

### 6.3 Test Notification Email

1. Click "Send Test Email" button
2. Watch **Network** tab

**Expected Results:**
- POST request to: `https://business-diagnostic-tool.onrender.com/api/account/notifications/test/`
- Status: 200
- Test email received in inbox
- Success message on frontend

---

## 🐛 Common Issues & Debugging

### Issue: CORS Error

**Error Message:**
```
Access to fetch at 'https://business-diagnostic-tool.onrender.com/api/...' 
from origin 'https://kigali-business-lab-business-diagnostic.onrender.com' 
has been blocked by CORS policy
```

**Solution:**
1. Verify backend `CORS_ALLOWED_ORIGINS` includes your frontend URL
2. Ensure no trailing slashes or typos
3. Redeploy backend after changes
4. Clear browser cache

### Issue: 401 Unauthorized

**Error Message:**
```
Failed to load resource: the server responded with a status of 401
```

**Solution:**
1. Check if user is logged in (check localStorage for tokens)
2. Verify token is being sent in Authorization header
3. Token might be expired - try logging out and back in
4. Check backend logs for authentication errors

### Issue: 404 Not Found

**Error Message:**
```
Failed to load resource: the server responded with a status of 404
```

**Solution:**
1. Verify API endpoint URL is correct
2. Check that `/api` is included in `NEXT_PUBLIC_API_URL`
3. Verify backend routes are correct
4. Check Network tab to see exact URL being called

### Issue: Email Not Sending

**Solution:**
1. Check backend environment variables:
   - `EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend`
   - `EMAIL_HOST_USER` is set
   - `EMAIL_HOST_PASSWORD` is set (use app password for Gmail)
2. Check Render logs for email errors
3. Verify SMTP settings are correct
4. For Gmail, ensure "Less secure app access" is enabled OR use App Password

### Issue: Verification Link Doesn't Work

**Solution:**
1. Verify `FRONTEND_URL` is set correctly in backend
2. Verify `BACKEND_BASE_URL` is set correctly
3. Check email link format
4. Ensure link points to backend API, which redirects to frontend

### Issue: API Calls Go to Wrong URL

**Solution:**
1. Verify `NEXT_PUBLIC_API_URL=https://business-diagnostic-tool.onrender.com/api`
2. Clear browser cache
3. Hard refresh (Ctrl+Shift+R / Cmd+Shift+R)
4. Check browser console for API base URL logs

---

## 📊 Testing Checklist

Use this checklist to verify everything works:

### Basic Functionality
- [ ] Backend health check works
- [ ] Frontend loads without errors
- [ ] No CORS errors in console
- [ ] API calls go to correct backend URL

### Authentication
- [ ] User registration works
- [ ] Verification email is received
- [ ] Email verification link works
- [ ] User login works
- [ ] User logout works
- [ ] Unauthorized access is blocked

### Profile
- [ ] Profile data loads
- [ ] Profile update works
- [ ] Avatar upload works
- [ ] Avatar displays in sidebar

### Dashboard
- [ ] Dashboard loads
- [ ] Stats API call succeeds
- [ ] Stats display correctly
- [ ] No errors in console

### Enterprise & Assessment
- [ ] Create enterprise works
- [ ] Start assessment works
- [ ] Submit answers works
- [ ] Assessment progress saves

### Team Management
- [ ] View team members works
- [ ] Invite team member works
- [ ] Invitation email is sent

### Notifications
- [ ] View notification settings works
- [ ] Update notification settings works
- [ ] Test email works

---

## 🔧 Debugging Tools

### Browser DevTools

**Console Tab:**
- Check for JavaScript errors
- Check for API errors
- Look for CORS errors
- Check API base URL logs

**Network Tab:**
- Filter by "Fetch/XHR" to see API calls
- Check request URLs
- Check response status codes
- Check response data
- Check request headers (Authorization token)

**Application Tab:**
- Local Storage: Check for `accessToken` and `refreshToken`
- Cookies: Check for session cookies

### Render Logs

1. Go to Render Dashboard
2. Select your backend service
3. Click "Logs" tab
4. Look for:
   - Django errors
   - Email sending errors
   - Authentication errors
   - CORS errors

### Test API Directly

Use curl or Postman to test backend directly:

```bash
# Health check
curl https://business-diagnostic-tool.onrender.com/health/

# Login (replace with real credentials)
curl -X POST https://business-diagnostic-tool.onrender.com/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"testpass"}'
```

---

## ✅ Success Criteria

Your integration is working correctly if:

1. ✅ No CORS errors in browser console
2. ✅ All API calls return 200/201 status codes
3. ✅ Authentication flow works end-to-end
4. ✅ Email verification works
5. ✅ Dashboard loads with real data
6. ✅ Profile updates persist
7. ✅ All features work as expected

---

## 🎉 You're Done!

If all tests pass, your frontend and backend are fully integrated and working correctly!

