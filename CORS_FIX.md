# CORS Configuration Fix for Production

## The Problem
The frontend at `https://kigali-business-lab-business-diagnostic.onrender.com` is being blocked by CORS when making requests to the backend at `https://business-diagnostic-tool.onrender.com`.

## The Solution

### Step 1: Set Environment Variable in Render

Go to your **backend service** on Render → **Environment** tab and add:

```bash
CORS_ALLOWED_ORIGINS=https://kigali-business-lab-business-diagnostic.onrender.com
```

**Important:** 
- Use the exact URL (with `https://`)
- No trailing slash
- If you have multiple origins, separate them with commas:
  ```
  CORS_ALLOWED_ORIGINS=https://kigali-business-lab-business-diagnostic.onrender.com,http://localhost:3000
  ```

### Step 2: Verify Other Environment Variables

Also ensure these are set correctly:

```bash
FRONTEND_URL=https://kigali-business-lab-business-diagnostic.onrender.com
BACKEND_BASE_URL=https://business-diagnostic-tool.onrender.com
```

### Step 3: Redeploy

After setting the environment variables:
1. Click **"Save Changes"**
2. Render will automatically redeploy
3. Wait for deployment to complete (2-3 minutes)

### Step 4: Test

Try the resend verification email feature again. The CORS error should be resolved.

## Alternative: If Environment Variable Doesn't Work

If setting the environment variable doesn't work, the code has a fallback that should add the production frontend URL automatically. However, using the environment variable is the recommended approach.

## Debugging

If you still see CORS errors after setting the environment variable:

1. **Check backend logs** in Render to see what CORS_ALLOWED_ORIGINS is being used
2. **Verify the URL** - make sure there are no typos
3. **Check for trailing slashes** - the URL should not end with `/`
4. **Ensure HTTPS** - use `https://` not `http://` for production

## Current Configuration

The code is configured to:
- Use `CORS_ALLOWED_ORIGINS` from environment if set
- Fall back to adding the production frontend URL automatically
- Allow credentials (`CORS_ALLOW_CREDENTIALS = True`)


