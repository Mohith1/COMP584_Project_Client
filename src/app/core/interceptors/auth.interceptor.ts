import {
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest
} from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, from, of } from 'rxjs';
import { switchMap, catchError, take } from 'rxjs/operators';
import { AuthService } from '@auth0/auth0-angular';
import { OwnerAuthService } from '../services/owner-auth.service';
import { OktaAuthFacade } from '../services/okta-auth.facade';
import { PersonaService } from '../services/persona.service';
import { environment } from '../../../environments/environment';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(
    private readonly ownerAuth: OwnerAuthService,
    private readonly oktaFacade: OktaAuthFacade,
    private readonly personaService: PersonaService,
    private readonly auth0: AuthService
  ) {}

  intercept(
    req: HttpRequest<unknown>,
    next: HttpHandler
  ): Observable<HttpEvent<unknown>> {
    // Only intercept requests to our API
    if (!req.url.startsWith(environment.apiUrl)) {
      return next.handle(req);
    }

    const persona = this.personaService.persona();

    // For owner persona, get token directly from Auth0 SDK
    if (persona === 'owner') {
      return this.auth0.isAuthenticated$.pipe(
        take(1),
        switchMap((isAuth) => {
          if (!isAuth) {
            console.log('🔑 AuthInterceptor: Not authenticated, skipping token');
            return next.handle(req);
          }

          // Get fresh token from Auth0 SDK
          return this.auth0.getAccessTokenSilently().pipe(
            switchMap((token) => {
              if (token) {
                console.log('🔑 AuthInterceptor: Attaching token to request:', req.url.split('?')[0]);
                const authReq = req.clone({
                  setHeaders: {
                    Authorization: `Bearer ${token}`
                  }
                });
                return next.handle(authReq);
              }
              console.warn('🔑 AuthInterceptor: No token available');
              return next.handle(req);
            }),
            catchError((err) => {
              console.error('🔑 AuthInterceptor: Failed to get token:', err?.message);
              // Still proceed without token - let server return 401
              return next.handle(req);
            })
          );
        })
      );
    }

    // For user persona, use the stored token
    if (persona === 'user') {
      const token = this.oktaFacade.accessToken();
      if (token) {
        req = req.clone({
          setHeaders: {
            Authorization: `Bearer ${token}`
          }
        });
      }
    }

    return next.handle(req);
  }
}















