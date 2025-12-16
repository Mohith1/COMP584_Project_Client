export const environment = {
  production: false,
  apiUrl: 'https://fleetmanagement-api-production.up.railway.app',
  okta: {
    domain: 'https://{yourOktaDomain}',
    clientId: '{yourOktaClientId}',
    issuer: 'https://{yourOktaDomain}/oauth2/default',
    audience: 'api://default',
    redirectUri: 'http://localhost:4200/owner/login/callback'
  }
} as const;

