export const environment = {
  production: false,
  apiUrl: 'https://fleetmanagement-api-production.up.railway.app',
  auth0: {
    domain: '{yourAuth0Domain}',
    clientId: '{yourAuth0ClientId}',
    audience: 'api://default',
    redirectUri: 'http://localhost:4200/owner/login/callback'
  }
} as const;

