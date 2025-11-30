export const environment = {
  production: true,
  apiUrl: 'https://localhost:7211',
  okta: {
    domain: 'https://{yourOktaDomain}',
    clientId: '{yourOktaClientId}',
    issuer: 'https://{yourOktaDomain}/oauth2/default',
    audience: 'api://default',
    redirectUri: 'https://your-production-host/user/login/callback'
  }
} as const;

