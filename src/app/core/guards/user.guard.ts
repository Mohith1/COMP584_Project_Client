import { Injectable } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  CanActivate,
  CanActivateChild,
  RouterStateSnapshot,
  UrlTree
} from '@angular/router';
import { Observable, from, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { OktaAuthFacade } from '../services/okta-auth.facade';
import { PersonaService } from '../services/persona.service';

@Injectable({
  providedIn: 'root'
})
export class UserGuard implements CanActivate, CanActivateChild {
  constructor(
    private readonly oktaFacade: OktaAuthFacade,
    private readonly personaService: PersonaService
  ) {}

  canActivate(
    _route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    return from(this.oktaFacade.isAuthenticated()).pipe(
      map((isAuth) => {
        if (isAuth) {
          this.personaService.setPersona('user');
          return true;
        }

        this.oktaFacade.login(state.url);
        return false;
      }),
      catchError(() => {
        this.oktaFacade.login(state.url);
        return of(false);
      })
    );
  }

  canActivateChild(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    return this.canActivate(route, state);
  }
}

