export const environment = {
  production: false,
  apiUrl: 'http://localhost:5224',
  okta: {
    domain: 'dev-7h4cbt1x17lvbozu.us.auth0.com',
    clientId: 'vbmmwzXgCr83bRKDVY7Vzy0vfP5PZ0Qc',
    issuer: 'https://dev-7h4cbt1x17lvbozu.us.auth0.com/',
    audience: 'https://fleet-management-api', // Update this with your Auth0 API identifier
    redirectUri: 'http://localhost:4200/user/login/callback'
  }
} as const;

