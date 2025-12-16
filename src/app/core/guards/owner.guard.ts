import { Injectable } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  CanActivate,
  CanActivateChild,
  RouterStateSnapshot,
  UrlTree
} from '@angular/router';
import { Observable, from, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { OwnerAuthService } from '../services/owner-auth.service';
import { PersonaService } from '../services/persona.service';

@Injectable({
  providedIn: 'root'
})
export class OwnerGuard implements CanActivate, CanActivateChild {
  constructor(
    private readonly ownerAuth: OwnerAuthService,
    private readonly personaService: PersonaService
  ) {}

  canActivate(
    _route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    return from(this.ownerAuth.isOktaAuthenticated()).pipe(
      switchMap((isAuth) => {
        if (!isAuth) {
          // Not authenticated with Okta, redirect to login
          this.ownerAuth.loginWithOkta(state.url);
          return of(false);
        }

        // Check if owner profile exists, if not sync with backend
        if (this.ownerAuth.isAuthenticated()) {
          this.personaService.setPersona('owner');
          return of(true);
        }

        // Try to sync/load owner profile from backend
        return this.ownerAuth.syncWithOktaAuth().pipe(
          map((owner) => {
            if (owner) {
              this.personaService.setPersona('owner');
              return true;
            }
            // Authenticated but no owner profile - redirect to register
            return false;
          }),
          catchError(() => of(false))
        );
      }),
      catchError(() => {
        this.ownerAuth.loginWithOkta(state.url);
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
