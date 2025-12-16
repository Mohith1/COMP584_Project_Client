# Auth0 Setup Guide for Fleet Management Client

## ✅ Auth0 Dashboard Configuration

### 1. Application Settings

**Application Type:** Single Page Web Applications (SPA)

**Basic Information:**
- Domain: `dev-7h4cbt1x17lvbozu.us.auth0.com`
- Client ID: `vbmmwzXgCr83bRKDVY7Vzy0vfP5PZ0Qc`

### 2. Application URIs

**Allowed Callback URLs:**
```
http://localhost:4200/user/login/callback
http://localhost:4200/owner/login/callback
```

**Allowed Logout URLs:**
```
http://localhost:4200
```

**Allowed Web Origins:**
```
http://localhost:4200
```

**Allowed Origins (CORS):**
```
http://localhost:4200
```

### 3. API Configuration (REQUIRED)

1. Go to **APIs** → **Create API**
2. Configure:
   - **Name:** Fleet Management API
   - **Identifier:** `https://fleet-management-api` (or your custom identifier)
   - **Signing Algorithm:** RS256
3. **Enable Offline Access:** Yes (for refresh tokens)
4. **Save the API Identifier** - you'll need it for the `audience` in environment.ts

### 4. Scopes Configuration

In your API (APIs → Fleet Management API → Scopes), add:
- `openid` (default)
- `profile` (default)
- `email` (default)
- `read:vehicles` (custom - for vehicle access)
- `read:telemetry` (custom - for telemetry access)

### 5. Advanced Settings

**OAuth Settings:**
- ✅ **Grant Types:** Authorization Code, Refresh Token
- ✅ **OIDC Conformant:** Yes
- ✅ **Token Endpoint Authentication Method:** None (for SPAs)

**Token Settings:**
- **ID Token Expiration:** 36000 seconds (or default)
- **Refresh Token Rotation:** Enabled (optional)
- **Refresh Token Expiration:** 2592000 seconds (30 days)

**Cross-Origin Authentication:**
- ❌ **Allow Cross-Origin Authentication:** OFF (usually not needed for SPA)

## 🔧 Environment Configuration

### Development (`src/environments/environment.development.ts`)

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:5224',
  okta: {
    domain: 'dev-7h4cbt1x17lvbozu.us.auth0.com',
    clientId: 'vbmmwzXgCr83bRKDVY7Vzy0vfP5PZ0Qc',
    issuer: 'https://dev-7h4cbt1x17lvbozu.us.auth0.com/',
    audience: 'https://fleet-management-api', // Update with your API identifier
    redirectUri: 'http://localhost:4200/user/login/callback'
  }
} as const;
```

### Production (`src/environments/environment.ts`)

Update with your production URLs:
```typescript
export const environment = {
  production: true,
  apiUrl: 'https://your-api-domain.com',
  okta: {
    domain: 'dev-7h4cbt1x17lvbozu.us.auth0.com', // Or your production Auth0 domain
    clientId: 'your-production-client-id',
    issuer: 'https://dev-7h4cbt1x17lvbozu.us.auth0.com/',
    audience: 'https://fleet-management-api',
    redirectUri: 'https://your-production-domain.com/user/login/callback'
  }
} as const;
```

## 🧪 Testing Your Configuration

1. **Start the Angular app:**
   ```bash
   npm start
   ```

2. **Navigate to user login:**
   ```
   http://localhost:4200/user/login
   ```

3. **Click "Continue with Okta"** - should redirect to Auth0 login

4. **After login**, you should be redirected back to the app

## ⚠️ Important Notes

1. **Update API Identifier:** Make sure to update the `audience` in `environment.development.ts` with your actual Auth0 API identifier

2. **Okta SDK Compatibility:** The app currently uses `@okta/okta-angular` SDK, which *should* work with Auth0 since both follow OIDC standards. If you encounter issues, you may need to migrate to `@auth0/auth0-angular` SDK.

3. **Backend Integration:** Make sure your ASP.NET Core backend is configured to validate Auth0 tokens with the same domain and audience.

## 🔄 If You Need to Switch to Auth0 SDK

If the Okta SDK doesn't work well with Auth0, you can migrate to the official Auth0 Angular SDK:

1. Install Auth0 SDK:
   ```bash
   npm install @auth0/auth0-angular
   ```

2. Remove Okta SDK:
   ```bash
   npm uninstall @okta/okta-angular @okta/okta-auth-js
   ```

3. Update `core.module.ts` and `okta-auth.facade.ts` to use Auth0 SDK

## 📋 Quick Checklist

- [ ] Application type set to "Single Page Web Applications"
- [ ] Callback URL configured: `http://localhost:4200/user/login/callback`
- [ ] Logout URL configured: `http://localhost:4200`
- [ ] Web Origins configured: `http://localhost:4200`
- [ ] API created with identifier
- [ ] API identifier added to environment.ts as `audience`
- [ ] OIDC Conformant enabled
- [ ] Token Endpoint Auth Method set to "None"
- [ ] Refresh tokens enabled
- [ ] Scopes configured (openid, profile, email + custom scopes)


