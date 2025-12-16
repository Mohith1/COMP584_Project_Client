export const environment = {
  production: true,
  apiUrl: 'https://fleetmanagement-api-production.up.railway.app',
  auth0: {
    domain: '{yourAuth0Domain}',
    clientId: '{yourAuth0ClientId}',
    audience: 'api://default',
    redirectUri: 'https://your-production-host/owner/login/callback'
  }
} as const;

