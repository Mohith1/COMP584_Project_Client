/**
 * Build script to replace environment variables at build time
 * This script reads Vercel environment variables and updates environment.ts
 * 
 * Usage: node scripts/build-env.js
 */

const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '../src/environments/environment.ts');

// Helper function to ensure URL uses https
function ensureHttps(url) {
  if (!url || url.includes('{your')) return url; // Skip placeholders
  // Remove any existing protocol and add https
  return 'https://' + url.replace(/^https?:\/\//, '');
}

// Read environment variables from process.env (set by Vercel)
const apiUrl = process.env.NG_APP_API_URL || process.env.API_URL || 'https://fleetmanagement-api-production.up.railway.app';
let oktaDomain = process.env.NG_APP_OKTA_DOMAIN || process.env.OKTA_DOMAIN || '{yourOktaDomain}';
const oktaClientId = process.env.NG_APP_OKTA_CLIENT_ID || process.env.OKTA_CLIENT_ID || '{yourOktaClientId}';
const oktaAudience = process.env.NG_APP_OKTA_AUDIENCE || process.env.OKTA_AUDIENCE || 'api://default';

// Ensure domain uses https
oktaDomain = ensureHttps(oktaDomain);

// Build issuer from domain if not explicitly provided
// For Auth0: issuer is just the domain (e.g., https://dev-xxx.auth0.com/)
// For Okta: issuer includes /oauth2/default
let oktaIssuer = process.env.NG_APP_OKTA_ISSUER || process.env.OKTA_ISSUER;
if (!oktaIssuer) {
  // Auto-detect Auth0 vs Okta based on domain
  if (oktaDomain.includes('auth0.com')) {
    // Auth0 issuer is just the domain with trailing slash
    oktaIssuer = oktaDomain.endsWith('/') ? oktaDomain : oktaDomain + '/';
  } else {
    // Okta issuer includes /oauth2/default
    oktaIssuer = `${oktaDomain}/oauth2/default`;
  }
} else {
  oktaIssuer = ensureHttps(oktaIssuer);
}

// Support both user and owner callback URIs
const baseRedirectUri = process.env.NG_APP_OKTA_REDIRECT_URI || process.env.OKTA_REDIRECT_URI || 'https://your-vercel-app.vercel.app/owner/login/callback';

// Generate environment.ts content
const envContent = `export const environment = {
  production: true,
  apiUrl: '${apiUrl}',
  okta: {
    domain: '${oktaDomain}',
    clientId: '${oktaClientId}',
    issuer: '${oktaIssuer}',
    audience: '${oktaAudience}',
    redirectUri: '${baseRedirectUri}'
  }
} as const;
`;

// Write to environment.ts
try {
  fs.writeFileSync(envPath, envContent, 'utf8');
  console.log('✅ Environment file updated successfully!');
  console.log('   API URL:', apiUrl);
  console.log('   Okta Domain:', oktaDomain);
  console.log('   Okta Issuer:', oktaIssuer);
  console.log('   Redirect URI:', baseRedirectUri);
} catch (error) {
  console.error('❌ Error updating environment file:', error);
  process.exit(1);
}








