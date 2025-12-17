# Quick Start: Deploy to Vercel

## 🚀 Fast Deployment (5 minutes)

### Step 1: Install Vercel CLI
```bash
npm install -g vercel
```

### Step 2: Login
```bash
vercel login
```

### Step 3: Set Environment Variables
Before deploying, you need to know:
- Your production API URL
- Your Vercel deployment URL (will be provided after first deploy)
- Your Auth0 settings (already configured)

**Option A: Set during deployment (recommended for first time)**
```bash
vercel
```
You'll be prompted to enter environment variables.

**Option B: Set in Vercel Dashboard**
1. Go to [vercel.com](https://vercel.com)
2. Your Project → Settings → Environment Variables
3. Add these variables (replace with your actual values):

```
API_URL=https://your-production-api.com
OKTA_DOMAIN=dev-7h4cbt1x17lvbozu.us.auth0.com
OKTA_CLIENT_ID=vbmmwzXgCr83bRKDVY7Vzy0vfP5PZ0Qc
OKTA_ISSUER=https://dev-7h4cbt1x17lvbozu.us.auth0.com/
OKTA_AUDIENCE=https://fleet-management-api
```

**Important**: After first deployment, you'll get a URL like `https://your-app.vercel.app`. Then:
1. Update `OKTA_REDIRECT_URI=https://your-app.vercel.app/user/login/callback`
2. Update Auth0 dashboard with this callback URL
3. Redeploy

### Step 4: Deploy
```bash
vercel --prod
```

### Step 5: Update Auth0 Callback URLs
After deployment, update your Auth0 application settings:
1. Go to Auth0 Dashboard → Applications → Your App
2. Add to **Allowed Callback URLs**: `https://your-app.vercel.app/user/login/callback`
3. Add to **Allowed Logout URLs**: `https://your-app.vercel.app`
4. Add to **Allowed Web Origins**: `https://your-app.vercel.app`

## 📝 Manual Alternative (No CLI)

1. **Push code to GitHub/GitLab**
2. **Go to [vercel.com](https://vercel.com)**
3. **Click "Add New Project"**
4. **Import your repository**
5. **Configure:**
   - Framework: Angular (auto-detected)
   - Build Command: `npm run vercel-build`
   - Output Directory: `dist/fleet-client/browser`
6. **Add Environment Variables** (see Step 3 above)
7. **Click "Deploy"**

## ✅ That's It!

Your app will be live at `https://your-app.vercel.app`

For detailed instructions, see `VERCEL_DEPLOYMENT_GUIDE.md`




