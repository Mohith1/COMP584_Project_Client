import {
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest
} from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { OwnerAuthService } from '../services/owner-auth.service';
import { OktaAuthFacade } from '../services/okta-auth.facade';
import { PersonaService } from '../services/persona.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(
    private readonly ownerAuth: OwnerAuthService,
    private readonly oktaFacade: OktaAuthFacade,
    private readonly personaService: PersonaService
  ) {}

  intercept(
    req: HttpRequest<unknown>,
    next: HttpHandler
  ): Observable<HttpEvent<unknown>> {
    const persona = this.personaService.persona();
    let token: string | null = null;

    if (persona === 'owner') {
      token = this.ownerAuth.accessToken();
    } else if (persona === 'user') {
      token = this.oktaFacade.accessToken();
    }

    if (token) {
      req = req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
    }

    return next.handle(req);
  }
}











