import { Injectable } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  CanActivate,
  CanActivateChild,
  Router,
  RouterStateSnapshot,
  UrlTree
} from '@angular/router';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { OwnerAuthService } from '../services/owner-auth.service';
import { PersonaService } from '../services/persona.service';

@Injectable({
  providedIn: 'root'
})
export class OwnerGuard implements CanActivate, CanActivateChild {
  constructor(
    private readonly ownerAuth: OwnerAuthService,
    private readonly router: Router,
    private readonly personaService: PersonaService
  ) {}

  canActivate(
    _route: ActivatedRouteSnapshot,
    _state: RouterStateSnapshot
  ): Observable<boolean | UrlTree> | boolean | UrlTree {
    if (this.ownerAuth.isAuthenticated()) {
      this.personaService.setPersona('owner');
      return true;
    }

    return this.ownerAuth.refresh().pipe(
      map(() => {
        if (this.ownerAuth.isAuthenticated()) {
          this.personaService.setPersona('owner');
          return true as boolean | UrlTree;
        }
        return this.router.createUrlTree(['/owner/login']);
      }),
      catchError(() => of(this.router.createUrlTree(['/owner/login'])))
    );
  }

  canActivateChild(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean | UrlTree> | boolean | UrlTree {
    return this.canActivate(route, state);
  }
}
