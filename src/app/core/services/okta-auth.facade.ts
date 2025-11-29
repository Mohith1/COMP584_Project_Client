import { Inject, Injectable } from '@angular/core';
import {
  OktaAuthStateService,
  OKTA_AUTH
} from '@okta/okta-angular';
import { OktaAuth } from '@okta/okta-auth-js';
import { filter, tap } from 'rxjs';
import { OktaProfile } from '../models/okta.model';
import { UserStateService } from '../state/user-state.service';
import { PersonaService } from './persona.service';

@Injectable({
  providedIn: 'root'
})
export class OktaAuthFacade {
  constructor(
    private readonly oktaState: OktaAuthStateService,
    @Inject(OKTA_AUTH) private readonly oktaAuth: OktaAuth,
    private readonly userState: UserStateService,
    private readonly personaService: PersonaService
  ) {
    this.oktaState.authState$
      .pipe(
        filter((state) => state !== null),
        tap((state) => {
          if (state.isAuthenticated) {
            this.hydrateFromClaims();
            this.personaService.setPersona('user');
          } else {
            this.userState.setProfile(null);
            this.userState.setAccessToken(null);
          }
        })
      )
      .subscribe();
  }

  async login(returnTo?: string): Promise<void> {
    await this.oktaAuth.signInWithRedirect({
      originalUri: returnTo ?? window.location.href
    });
  }

  async logout(): Promise<void> {
    await this.oktaAuth.signOut();
    this.userState.setProfile(null);
    this.userState.setAccessToken(null);
    this.personaService.setPersona(null);
  }

  accessToken(): string | null {
    return this.userState.accessToken();
  }

  profile(): OktaProfile | null {
    return this.userState.profile();
  }

  isAuthenticated(): Promise<boolean> {
    return this.oktaAuth.isAuthenticated();
  }

  private async hydrateFromClaims(): Promise<void> {
    const [claims, token] = await Promise.all([
      this.oktaAuth.getUser(),
      this.oktaAuth.getAccessToken()
    ]);

    if (token) {
      this.userState.setAccessToken(token);
    }

    const profile: OktaProfile = {
      ...claims,
      ownerId:
        (claims['ownerId'] as string | undefined) ??
        (claims['custom:ownerId'] as string | undefined) ??
        (claims['https://schemas.fleet.com/ownerId'] as string | undefined),
      roles: (claims['roles'] as string[]) ?? this.extractRoles(claims)
    };

    this.userState.setProfile(profile);
  }

  private extractRoles(claims: Record<string, unknown>): string[] {
    const roles = claims['groups'] ?? claims['roles'];
    if (Array.isArray(roles)) {
      return roles as string[];
    }

    return [];
  }
}

