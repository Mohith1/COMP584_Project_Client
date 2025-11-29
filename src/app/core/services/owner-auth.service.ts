import { HttpClient } from '@angular/common/http';
import { Injectable, OnDestroy, computed, signal } from '@angular/core';
import { tap, finalize, map, switchMap, of, timer, Subscription } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  OwnerAuthResponse,
  OwnerAuthState,
  OwnerLoginRequest,
  OwnerRegisterRequest
} from '../models/auth.model';
import { OwnerProfile } from '../models/owner.model';
import { STORAGE_KEYS } from '../constants/storage-keys';
import { OwnerStateService } from '../state/owner-state.service';
import { PersonaService } from './persona.service';

@Injectable({
  providedIn: 'root'
})
export class OwnerAuthService implements OnDestroy {
  private readonly baseUrl = environment.apiUrl;
  private refreshSub?: Subscription;

  private readonly authState = signal<OwnerAuthState>({
    accessToken: null,
    refreshToken: sessionStorage.getItem(STORAGE_KEYS.ownerRefreshToken),
    expiresAt: null,
    owner: null
  });

  readonly accessToken = computed(() => this.authState().accessToken);
  readonly owner = computed(() => this.authState().owner);
  readonly isAuthenticated = computed(
    () => !!this.authState().accessToken && !!this.authState().owner
  );

  constructor(
    private readonly http: HttpClient,
    private readonly ownerState: OwnerStateService,
    private readonly personaService: PersonaService
  ) {}

  register(payload: OwnerRegisterRequest) {
    return this.http
      .post<OwnerProfile>(`${this.baseUrl}/api/auth/register-owner`, payload)
      .pipe(tap((owner) => this.ownerState.setOwner(owner)));
  }

  login(credentials: OwnerLoginRequest) {
    return this.http
      .post<OwnerAuthResponse>(`${this.baseUrl}/api/auth/login`, credentials)
      .pipe(
        tap((response) => this.handleAuthSuccess(response)),
        map((response) => response.owner)
      );
  }

  refresh() {
    const refreshToken = this.authState().refreshToken;
    if (!refreshToken) {
      return of(null);
    }

    return this.http
      .post<OwnerAuthResponse>(`${this.baseUrl}/api/auth/refresh`, {
        refreshToken
      })
      .pipe(tap((response) => this.handleAuthSuccess(response)));
  }

  logout() {
    const refreshToken = this.authState().refreshToken;
    const request$ = refreshToken
      ? this.http.post<void>(`${this.baseUrl}/api/auth/revoke`, {
          refreshToken
        })
      : of(void 0);

    return request$.pipe(finalize(() => this.clearAuthState()));
  }

  loadProfile() {
    return this.http
      .get<OwnerProfile>(`${this.baseUrl}/api/owners/me`)
      .pipe(tap((owner) => this.setOwner(owner)));
  }

  updateProfile(profile: Partial<OwnerProfile>) {
    return this.http
      .put<OwnerProfile>(`${this.baseUrl}/api/owners/me`, profile)
      .pipe(tap((owner) => this.setOwner(owner)));
  }

  ownerId(): string | null {
    return this.owner()?.id ?? null;
  }

  ownerIdOrThrow(): string {
    const id = this.ownerId();
    if (!id) {
      throw new Error('Owner is not authenticated');
    }
    return id;
  }

  private handleAuthSuccess(response: OwnerAuthResponse) {
    const expiresAt = Date.now() + response.expiresIn * 1000;
    this.authState.set({
      accessToken: response.accessToken,
      refreshToken: response.refreshToken,
      expiresAt,
      owner: response.owner
    });
    sessionStorage.setItem(
      STORAGE_KEYS.ownerRefreshToken,
      response.refreshToken
    );
    this.ownerState.setOwner(response.owner);
    this.scheduleRefresh(response.expiresIn);
    this.personaService.setPersona('owner');
  }

  private setOwner(owner: OwnerProfile | null) {
    const current = this.authState();
    this.authState.set({
      ...current,
      owner
    });
    this.ownerState.setOwner(owner);
  }

  private clearAuthState() {
    this.authState.set({
      accessToken: null,
      refreshToken: null,
      expiresAt: null,
      owner: null
    });
    sessionStorage.removeItem(STORAGE_KEYS.ownerRefreshToken);
    this.ownerState.setOwner(null);
    this.cancelRefreshSchedule();
    this.personaService.setPersona(null);
  }

  private scheduleRefresh(expiresIn: number) {
    this.cancelRefreshSchedule();
    const refreshInMs = Math.max((expiresIn - 30) * 1000, 30_000);
    this.refreshSub = timer(refreshInMs)
      .pipe(switchMap(() => this.refresh()))
      .subscribe();
  }

  private cancelRefreshSchedule() {
    this.refreshSub?.unsubscribe();
  }

  ngOnDestroy(): void {
    this.cancelRefreshSchedule();
  }
}

