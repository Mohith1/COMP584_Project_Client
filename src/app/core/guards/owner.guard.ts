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
    return from(this.ownerAuth.isAuth0Authenticated()).pipe(
      switchMap((isAuth) => {
        if (!isAuth) {
          // Not authenticated with Auth0, redirect to login
          this.ownerAuth.loginWithAuth0(state.url);
          return of(false);
        }

        // Check if owner profile exists, if not sync with backend
        if (this.ownerAuth.isAuthenticated()) {
          this.personaService.setPersona('owner');
          return of(true);
        }

        // Try to sync/load owner profile from backend
        return this.ownerAuth.syncWithAuth0().pipe(
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
        this.ownerAuth.loginWithAuth0(state.url);
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
