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
    // Always allow access to login and register pages
    if (state.url.includes('/owner/login') || state.url.includes('/owner/register')) {
      return of(true);
    }

    return from(this.ownerAuth.isAuth0Authenticated()).pipe(
      switchMap((isAuth) => {
        console.log('🔐 OwnerGuard: Auth0 authenticated?', isAuth);
        
        if (!isAuth) {
          // Not authenticated with Auth0, redirect to login page
          console.log('🔐 OwnerGuard: Not authenticated, redirecting to login');
          return of(this.router.createUrlTree(['/owner/login']));
        }

        // Auth0 authenticated - sync token (profile may or may not exist, that's OK)
        console.log('🔐 OwnerGuard: Auth0 authenticated, syncing token...');
        this.personaService.setPersona('owner');
        
        // Sync token and try to load profile, but don't block navigation if profile doesn't exist
        return this.ownerAuth.syncWithAuth0().pipe(
          map((owner) => {
            if (owner) {
              console.log('🔐 OwnerGuard: Owner profile loaded, access granted');
            } else {
              console.log('🔐 OwnerGuard: No owner profile yet, but allowing access (profile can be created later)');
            }
            // Always allow access - profile existence is optional
            return true;
          }),
          catchError((err) => {
            // Token sync or profile load failed - still allow access (profile creation is optional)
            console.warn('🔐 OwnerGuard: Failed to sync/load profile, but allowing access:', err?.message || err);
            // Still allow navigation - user can create profile later
            return of(true);
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
