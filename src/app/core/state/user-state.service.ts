import { computed, Injectable, signal } from '@angular/core';
import { OktaProfile } from '../models/okta.model';

@Injectable({
  providedIn: 'root'
})
export class UserStateService {
  private readonly profileSig = signal<OktaProfile | null>(null);
  private readonly tokenSig = signal<string | null>(null);

  readonly profile = computed(() => this.profileSig());
  readonly ownerId = computed(() => this.profileSig()?.ownerId ?? null);
  readonly accessToken = computed(() => this.tokenSig());

  setProfile(profile: OktaProfile | null): void {
    this.profileSig.set(profile);
  }

  setAccessToken(token: string | null): void {
    this.tokenSig.set(token);
  }
}

