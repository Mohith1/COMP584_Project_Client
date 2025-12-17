import { Injectable } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  CanActivate,
  CanActivateChild,
  Router,
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
    private readonly personaService: PersonaService,
    private readonly router: Router
  ) {}

  canActivate(
    _route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    // Don't redirect if already on login or register page
    if (state.url.includes('/owner/login') || state.url.includes('/owner/register')) {
      return of(true);
    }

    return from(this.ownerAuth.isAuth0Authenticated()).pipe(
      switchMap((isAuth) => {
        console.log('🔐 OwnerGuard: Auth0 authenticated?', isAuth);
        
        if (!isAuth) {
          // Not authenticated with Auth0, redirect to login page (not trigger Auth0 redirect)
          console.log('🔐 OwnerGuard: Not authenticated, redirecting to login');
          return of(this.router.createUrlTree(['/owner/login']));
        }

        // Check if owner profile exists
        if (this.ownerAuth.isAuthenticated()) {
          console.log('🔐 OwnerGuard: Owner profile exists, allowing access');
          this.personaService.setPersona('owner');
          return of(true);
        }

        // Try to sync/load owner profile from backend
        console.log('🔐 OwnerGuard: Syncing with backend...');
        return this.ownerAuth.syncWithAuth0().pipe(
          map((owner) => {
            if (owner) {
              console.log('🔐 OwnerGuard: Owner profile loaded, allowing access');
              this.personaService.setPersona('owner');
              return true;
            }
            // Authenticated with Auth0 but no owner profile - redirect to register
            console.log('🔐 OwnerGuard: No owner profile, redirecting to register');
            return this.router.createUrlTree(['/owner/register']);
          }),
          catchError((err) => {
            console.error('🔐 OwnerGuard: Error syncing:', err);
            // On error, redirect to register (user might need to create profile)
            return of(this.router.createUrlTree(['/owner/register']));
          })
        );
      }),
      catchError((err) => {
        console.error('🔐 OwnerGuard: Error checking auth:', err);
        return of(this.router.createUrlTree(['/owner/login']));
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
