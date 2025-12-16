import { Injectable } from '@angular/core';
import { AuthService, User } from '@auth0/auth0-angular';
import { filter, tap, take } from 'rxjs/operators';
import { firstValueFrom } from 'rxjs';
import { OktaProfile } from '../models/okta.model';
import { UserStateService } from '../state/user-state.service';
import { PersonaService } from './persona.service';

@Injectable({
  providedIn: 'root'
})
export class OktaAuthFacade {
  constructor(
    private readonly auth0: AuthService,
    private readonly userState: UserStateService,
    private readonly personaService: PersonaService
  ) {
    // Subscribe to auth state changes
    this.auth0.isAuthenticated$
      .pipe(
        filter((isAuth) => isAuth !== null),
        tap((isAuth) => {
          if (isAuth) {
            this.hydrateFromUser();
            this.personaService.setPersona('user');
          } else {
            this.userState.setProfile(null);
            this.userState.setAccessToken(null);
          }
        })
      )
      .subscribe();
  }

  login(returnTo?: string): void {
    this.auth0.loginWithRedirect({
      appState: { target: returnTo ?? window.location.href }
    });
  }

  logout(): void {
    this.userState.setProfile(null);
    this.userState.setAccessToken(null);
    this.personaService.setPersona(null);
    this.auth0.logout({
      logoutParams: {
        returnTo: window.location.origin + '/user/login'
      }
    });
  }

  accessToken(): string | null {
    return this.userState.accessToken();
  }

  profile(): OktaProfile | null {
    return this.userState.profile();
  }

  async isAuthenticated(): Promise<boolean> {
    return firstValueFrom(this.auth0.isAuthenticated$.pipe(take(1)));
  }

  private hydrateFromUser(): void {
    // Get user info
    this.auth0.user$.pipe(
      filter((user): user is User => user !== null && user !== undefined),
      take(1)
    ).subscribe((user) => {
      const profile: OktaProfile = {
        sub: user.sub,
        name: user.name,
        email: user.email,
        email_verified: user.email_verified,
        picture: user.picture,
        ownerId:
          (user['ownerId'] as string | undefined) ??
          (user['custom:ownerId'] as string | undefined) ??
          (user['https://schemas.fleet.com/ownerId'] as string | undefined),
        roles: this.extractRoles(user)
      };

      this.userState.setProfile(profile);
    });

    // Get access token
    this.auth0.getAccessTokenSilently().pipe(take(1)).subscribe((token) => {
      this.userState.setAccessToken(token);
    });
  }

  private extractRoles(user: User): string[] {
    const roles = user['groups'] ?? user['roles'] ?? user['https://schemas.fleet.com/roles'];
    if (Array.isArray(roles)) {
      return roles as string[];
    }
    return [];
  }
}
