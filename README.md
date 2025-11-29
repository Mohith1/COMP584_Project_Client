# Fleet Management Client

Angular 17 single-page application that fronts the `FleetManagement.Api` ASP.NET Core backend. Two distinct personas are supported:

- **Owner portal** – JWT issued by the backend, full CRUD over fleets, vehicles, and profile data.
- **User portal (drivers/dispatchers)** – Okta OIDC login, read-only telemetry and profile data driven by Okta claims.

Angular Material provides the responsive UI shell, signals back lightweight state, and Http interceptors attach the correct bearer tokens.

## Getting Started

### Prerequisites

- Node.js 18+ (Node 22 LTS recommended)
- npm 9+
- Access to the ASP.NET Core API and the Okta tenant referenced below

### Install dependencies

```bash
npm install
```

### Environment configuration

Environment files live under `src/environments/`. Copy the defaults and update them or drive values from CI:

`src/environments/environment.development.ts`

```ts
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
};
```

For production builds update `environment.ts`. The API base URL should match the ASP.NET Core deployment, and `okta.*` must match the configuration used by the backend (`OktaDefaults.ApiAuthenticationScheme` audience/domain).

### Running the app

```bash
npm start
```

Navigate to `http://localhost:4200`. Routes:

- `/owner/login`, `/owner/register` – email/password MFA with backend JWTs
- `/owner/*` – owner dashboard guarded by `OwnerGuard`
- `/user/login` – Okta hosted login
- `/user/*` – user portal guarded by `UserGuard`

### Building

```bash
npm run build
```

Artifacts are emitted to `dist/fleet-client`.

### Testing

Unit tests focus on the HTTP layer with Angular’s `HttpClientTestingModule`:

```bash
npm test
```

Add e2e coverage (Cypress/Playwright) to mock Okta, or call the API via intercepts.

## Architecture Overview

| Layer | Highlights |
| --- | --- |
| `app/core` | Guards, interceptors, state stores (signals), API services, persona tracking |
| `app/shared` | Angular Material module + reusable components: fleet list, vehicle table, telemetry highlights/chart, confirm dialog |
| `app/owner` | Owner portal shell, dashboard, fleet CRUD + vehicle management, profile editor, email/password auth views |
| `app/user` | User shell, Okta login, telemetry feed, profile derived from Okta claims |

### Authentication flows

- **Owner auth**  
  `OwnerAuthService` calls `/api/auth/login` and `/api/auth/register-owner`, stores the access token in-memory and refresh token in `sessionStorage`, schedules silent refresh via `/api/auth/refresh`, and invokes `/api/auth/revoke` on logout. `OwnerGuard` attempts a refresh before redirecting to `/owner/login`.

- **Okta / User portal**  
  `OktaAuthFacade` wires `@okta/okta-angular` to the Angular router. `UserGuard` checks for an Okta session and kicks off `signInWithRedirect` when missing. The Okta access token is attached to HTTP requests whenever the active persona is `user`.

`AuthInterceptor` inspects the active persona (`owner` vs `user`) and attaches the correct Authorization header. `HttpErrorInterceptor` normalizes backend responses into Material snack-bar toasts aligned with the server’s `GlobalExceptionMiddleware`.

### State

- `OwnerStateService` holds owner profile, fleets, vehicles, telemetry snapshots, and loading flags via Angular signals.
- `UserStateService` stores Okta claims + current access token.
- `PersonaService` persists the active persona in session storage so refreshes retain context.

### Telemetry & reusable components

- `TelemetryService` polls `/api/owners/{id}/vehicles/telemetry` and feeds `TelemetryHighlightsComponent` + `TelemetryChartComponent`.
- `FleetListComponent`, `VehicleTableComponent`, and dialogs encapsulate CRUD behaviors for both portals.

## Mock data & Testing aids

JSON fixtures live under `src/assets/mocks/` to help drive UI prototyping or future e2e tests:

- `fleets.json`
- `vehicles.json`
- `telemetry.json`

## Connecting to FleetManagement.Api

1. Ensure the API exposes the endpoints described in the spec (auth, owners, fleets, vehicles, telemetry).
2. Configure CORS to allow `http://localhost:4200`.
3. Owners authenticate via `/api/auth/login` and Okta users via `OktaDefaults.ApiAuthenticationScheme`.
4. Update the environment files (or CI secrets) with the deployed `apiUrl` and Okta settings.

## Scripts

| Command | Description |
| --- | --- |
| `npm start` | Dev server with live reload |
| `npm run build` | Production build |
| `npm test` | Karma + Jasmine unit tests |

## Further Work

- Extend `TelemetryService` with SSE/WebSocket streaming.
- Add maintenance ticket pages once backend endpoints exist.
- Introduce Cypress/Playwright specs mocking Okta via test tokens.
