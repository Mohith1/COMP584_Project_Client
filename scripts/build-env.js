/**
 * Build script to replace environment variables at build time
 * This script reads Vercel environment variables and updates environment.ts
 * 
 * Usage: node scripts/build-env.js
 */

const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '../src/environments/environment.ts');
const templatePath = path.join(__dirname, '../src/environments/environment.prod.template.ts');

// Read environment variables from process.env (set by Vercel)
const apiUrl = process.env.NG_APP_API_URL || process.env.API_URL || 'https://fleetmanagement-api-production.up.railway.app';
const oktaDomain = process.env.NG_APP_OKTA_DOMAIN || process.env.OKTA_DOMAIN || '{yourOktaDomain}';
const oktaClientId = process.env.NG_APP_OKTA_CLIENT_ID || process.env.OKTA_CLIENT_ID || '{yourOktaClientId}';
const oktaIssuer = process.env.NG_APP_OKTA_ISSUER || process.env.OKTA_ISSUER || `https://${oktaDomain}/oauth2/default`;
const oktaAudience = process.env.NG_APP_OKTA_AUDIENCE || process.env.OKTA_AUDIENCE || 'api://default';
const oktaRedirectUri = process.env.NG_APP_OKTA_REDIRECT_URI || process.env.OKTA_REDIRECT_URI || 'https://your-vercel-app.vercel.app/user/login/callback';

// Generate environment.ts content
const envContent = `export const environment = {
  production: true,
  apiUrl: '${apiUrl}',
  okta: {
    domain: '${oktaDomain}',
    clientId: '${oktaClientId}',
    issuer: '${oktaIssuer}',
    audience: '${oktaAudience}',
    redirectUri: '${oktaRedirectUri}'
  }
} as const;
`;

// Write to environment.ts
try {
  fs.writeFileSync(envPath, envContent, 'utf8');
  console.log('✅ Environment file updated successfully!');
  console.log('   API URL:', apiUrl);
  console.log('   Auth0 Domain:', oktaDomain);
  console.log('   Redirect URI:', oktaRedirectUri);
} catch (error) {
  console.error('❌ Error updating environment file:', error);
  process.exit(1);
}








