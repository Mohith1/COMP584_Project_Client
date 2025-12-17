/**
 * Build script to replace environment variables at build time
 * This script reads Vercel environment variables and updates environment.ts
 * 
 * Usage: node scripts/build-env.js
 */

const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '../src/environments/environment.ts');

// Debug: Log all NG_APP environment variables
console.log('🔍 Checking environment variables...');
Object.keys(process.env).filter(key => key.startsWith('NG_APP') || key.startsWith('AUTH0')).forEach(key => {
  console.log(`   ${key}: ${process.env[key] ? '✓ SET' : '✗ NOT SET'}`);
});

// Helper function to extract domain without protocol
function extractDomain(url) {
  if (!url || url.includes('{your')) return url; // Skip placeholders
  // Remove protocol (http:// or https://) and trailing slashes
  return url.replace(/^https?:\/\//, '').replace(/\/$/, '');
}

// Read environment variables from process.env (set by Vercel)
const apiUrl = process.env.NG_APP_API_URL || process.env.API_URL || 'https://fleetmanagement-api-production.up.railway.app';

// Auth0 configuration (domain should be without protocol for Auth0 SDK)
let auth0Domain = process.env.NG_APP_OKTA_DOMAIN || process.env.AUTH0_DOMAIN || '{yourAuth0Domain}';
console.log(`   Raw NG_APP_OKTA_DOMAIN: ${process.env.NG_APP_OKTA_DOMAIN}`);
auth0Domain = extractDomain(auth0Domain);

const auth0ClientId = process.env.NG_APP_OKTA_CLIENT_ID || process.env.AUTH0_CLIENT_ID || '{yourAuth0ClientId}';
const auth0Audience = process.env.NG_APP_OKTA_AUDIENCE || process.env.AUTH0_AUDIENCE || 'api://default';
const redirectUri = process.env.NG_APP_OKTA_REDIRECT_URI || process.env.AUTH0_REDIRECT_URI || 'https://your-vercel-app.vercel.app/owner/login/callback';

// Generate environment.ts content
const envContent = `export const environment = {
  production: true,
  apiUrl: '${apiUrl}',
  auth0: {
    domain: '${auth0Domain}',
    clientId: '${auth0ClientId}',
    audience: '${auth0Audience}',
    redirectUri: '${redirectUri}'
  }
} as const;
`;

// Write to environment.ts
try {
  fs.writeFileSync(envPath, envContent, 'utf8');
  console.log('✅ Environment file updated successfully!');
  console.log('   API URL:', apiUrl);
  console.log('   Auth0 Domain:', auth0Domain);
  console.log('   Auth0 Client ID:', auth0ClientId);
  console.log('   Redirect URI:', redirectUri);
} catch (error) {
  console.error('❌ Error updating environment file:', error);
  process.exit(1);
}








