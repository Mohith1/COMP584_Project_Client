export const environment = {
  production: true,
  apiUrl: 'https://fleetmanagement-api-production.up.railway.app',
  auth0: {
    // IMPORTANT: These MUST match your Auth0 configuration
    // domain: Your Auth0 tenant domain (e.g., 'your-tenant.us.auth0.com')
    domain: '{yourAuth0Domain}',
    // clientId: Your Auth0 application's Client ID
    clientId: '{yourAuth0ClientId}',
    // audience: MUST match the API Identifier registered in Auth0 > APIs
    // This is what your server validates. Without correct audience, you'll get 401 errors.
    // Typically this is your API URL: 'https://fleetmanagement-api-production.up.railway.app'
    // Or a custom identifier like: 'https://fleetmanagement-api'
    audience: 'https://fleetmanagement-api-production.up.railway.app',
    redirectUri: 'https://your-production-host/owner/login/callback'
  }
} as const;

