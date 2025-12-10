export const environment = {
  production: true,
  apiUrl: 'https://fleetmanagement-api-production.up.railway.app',
  okta: {
    domain: 'https://{yourOktaDomain}',
    clientId: '{yourOktaClientId}',
    issuer: 'https://{yourOktaDomain}/oauth2/default',
    audience: 'api://default',
    redirectUri: 'https://your-production-host/user/login/callback'
  }
} as const;

