# Vercel Deployment Guide

This guide will help you deploy the Fleet Management Client Angular application to Vercel.

## 📋 Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com) (free account works)
2. **GitHub/GitLab/Bitbucket Repository**: Your code should be in a Git repository
3. **Node.js 18+**: Vercel will use this automatically
4. **Environment Variables**: Prepare your production environment variables

## 🚀 Deployment Steps

### Option 1: Deploy via Vercel CLI (Recommended)

1. **Install Vercel CLI globally:**
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel:**
   ```bash
   vercel login
   ```

3. **Navigate to your project directory:**
   ```bash
   cd C:\Users\mk504221\Projects\COMP584_Project_Client
   ```

4. **Deploy to production:**
   ```bash
   vercel --prod
   ```

   Or deploy a preview first:
   ```bash
   vercel
   ```

5. **Follow the prompts:**
   - Link to existing project or create new
   - Confirm settings
   - Environment variables will be prompted (see below)

### Option 2: Deploy via Vercel Dashboard

1. **Go to [vercel.com](https://vercel.com) and login**

2. **Click "Add New Project"**

3. **Import your Git repository:**
   - Connect your GitHub/GitLab/Bitbucket account if needed
   - Select your repository
   - Click "Import"

4. **Configure Project Settings:**
   - **Framework Preset**: Angular (auto-detected)
   - **Root Directory**: `./` (project root)
   - **Build Command**: `npm run build` (or `npm run vercel-build`)
   - **Output Directory**: `dist/fleet-client/browser`
   - **Install Command**: `npm install`

5. **Set Environment Variables** (see below)

6. **Click "Deploy"**

## 🔧 Environment Variables

You **MUST** configure these environment variables in Vercel before deployment:

### Required Environment Variables

Go to: **Project Settings → Environment Variables**

Add these variables:

#### 1. API Configuration
```
NG_APP_API_URL=https://your-production-api-url.com
```

#### 2. Auth0/Okta Configuration
```
NG_APP_OKTA_DOMAIN=dev-7h4cbt1x17lvbozu.us.auth0.com
NG_APP_OKTA_CLIENT_ID=vbmmwzXgCr83bRKDVY7Vzy0vfP5PZ0Qc
NG_APP_OKTA_ISSUER=https://dev-7h4cbt1x17lvbozu.us.auth0.com/
NG_APP_OKTA_AUDIENCE=https://fleet-management-api
NG_APP_OKTA_REDIRECT_URI=https://your-vercel-app.vercel.app/user/login/callback
```

**Important Notes:**
- Replace `your-production-api-url.com` with your actual backend API URL
- Replace `your-vercel-app.vercel.app` with your actual Vercel deployment URL (or custom domain)
- Update `NG_APP_OKTA_AUDIENCE` with your actual Auth0 API identifier

### How to Set Environment Variables in Vercel

1. Go to your project in Vercel dashboard
2. Click **Settings** → **Environment Variables**
3. Add each variable:
   - **Key**: `NG_APP_API_URL` (or other variable name)
   - **Value**: Your actual value
   - **Environments**: Select `Production`, `Preview`, and/or `Development`
4. Click **Save**
5. **Redeploy** your application for changes to take effect

## 📝 Update Environment File for Build

Update `src/environments/environment.ts` to use environment variables:

```typescript
export const environment = {
  production: true,
  apiUrl: (window as any).__env?.NG_APP_API_URL || 'https://your-production-api-url.com',
  okta: {
    domain: (window as any).__env?.NG_APP_OKTA_DOMAIN || 'dev-7h4cbt1x17lvbozu.us.auth0.com',
    clientId: (window as any).__env?.NG_APP_OKTA_CLIENT_ID || 'vbmmwzXgCr83bRKDVY7Vzy0vfP5PZ0Qc',
    issuer: (window as any).__env?.NG_APP_OKTA_ISSUER || 'https://dev-7h4cbt1x17lvbozu.us.auth0.com/',
    audience: (window as any).__env?.NG_APP_OKTA_AUDIENCE || 'https://fleet-management-api',
    redirectUri: (window as any).__env?.NG_APP_OKTA_REDIRECT_URI || 'https://your-vercel-app.vercel.app/user/login/callback'
  }
} as const;
```

**However**, Angular doesn't automatically inject environment variables at runtime. We'll need to use a different approach (see below).

## 🔄 Alternative: Runtime Environment Configuration

Since Angular builds are static, we need to handle environment variables differently. Two options:

### Option A: Use Vercel Environment Variables (Recommended)

Vercel automatically injects environment variables prefixed with `NEXT_PUBLIC_` for Next.js, but for Angular, we need to create a script that injects them at build time.

Create a script that reads Vercel env vars and updates environment files:

**Better approach**: Use Angular's `fileReplacements` or create a custom script.

### Option B: Use a Config File (Simple)

Create a `config.json` file that's loaded at runtime:

1. Create `src/assets/config.json`:
```json
{
  "apiUrl": "https://your-api-url.com",
  "okta": {
    "domain": "dev-7h4cbt1x17lvbozu.us.auth0.com",
    "clientId": "vbmmwzXgCr83bRKDVY7Vzy0vfP5PZ0Qc",
    "issuer": "https://dev-7h4cbt1x17lvbozu.us.auth0.com/",
    "audience": "https://fleet-management-api",
    "redirectUri": "https://your-vercel-app.vercel.app/user/login/callback"
  }
}
```

2. Load it at app startup

**For now, let's use the simpler approach - update environment.ts with production values before deploying.**

## ✅ Pre-Deployment Checklist

- [ ] Update `src/environments/environment.ts` with production values
- [ ] Update Auth0/Okta redirect URIs to include your Vercel URL
- [ ] Test build locally: `npm run build`
- [ ] Verify build output in `dist/fleet-client/browser`
- [ ] Set environment variables in Vercel dashboard
- [ ] Configure Auth0/Okta allowed callback/logout URLs

## 🔍 Post-Deployment

After deployment:

1. **Test the application:**
   - Navigate to your Vercel URL
   - Test owner login/registration
   - Test user login (Auth0)

2. **Update Auth0/Okta settings:**
   - Add your Vercel URL to Allowed Callback URLs
   - Add your Vercel URL to Allowed Logout URLs
   - Add your Vercel URL to Allowed Web Origins

3. **Configure Custom Domain (Optional):**
   - Go to Project Settings → Domains
   - Add your custom domain
   - Update Auth0/Okta URLs with custom domain

## 🐛 Troubleshooting

### Build Fails
- Check build logs in Vercel dashboard
- Ensure Node.js version is 18+
- Verify all dependencies are in `package.json`

### Routing Not Working
- Verify `vercel.json` has the rewrite rule for `/(.*) → /index.html`
- Check that `baseHref` in `index.html` is `/`

### Environment Variables Not Working
- Ensure variables are set in Vercel dashboard
- Redeploy after adding variables
- Check variable names match exactly

### Auth0/Okta Redirect Issues
- Verify redirect URI matches exactly in Auth0/Okta dashboard
- Check that redirect URI in environment matches Vercel URL
- Ensure protocol (http/https) matches

## 📚 Additional Resources

- [Vercel Angular Documentation](https://vercel.com/docs/frameworks/angular)
- [Vercel CLI Documentation](https://vercel.com/docs/cli)
- [Angular Deployment Guide](https://angular.io/guide/deployment)

