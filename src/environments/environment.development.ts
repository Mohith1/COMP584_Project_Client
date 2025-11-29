export const environment = {
  production: false,
  apiUrl: 'http://localhost:5000',
  okta: {
    domain: 'https://{yourOktaDomain}',
    clientId: '{yourOktaClientId}',
    issuer: 'https://{yourOktaDomain}/oauth2/default',
    audience: 'api://default',
    redirectUri: 'http://localhost:4200/user/login/callback'
  }
} as const;

