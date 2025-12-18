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
          // Not authenticated with Auth0, redirect to login page
          console.log('🔐 OwnerGuard: Not authenticated, redirecting to login');
          return of(this.router.createUrlTree(['/owner/login']));
        }

        // Auth0 authenticated - MUST sync token BEFORE allowing navigation
        console.log('🔐 OwnerGuard: Auth0 authenticated, syncing token...');
        this.personaService.setPersona('owner');
        
        // BLOCKING: Wait for token to be synced before allowing navigation
        return this.ownerAuth.syncWithAuth0().pipe(
          map((owner) => {
            if (owner) {
              console.log('🔐 OwnerGuard: Owner profile synced, access granted');
            } else {
              console.log('🔐 OwnerGuard: Token synced (no profile yet), access granted');
            }
            return true;
          }),
          catchError((err) => {
            // Token sync failed but Auth0 is authenticated
            // Still allow access - profile might not exist yet
            console.log('🔐 OwnerGuard: Token sync failed, but allowing access:', err?.message);
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
