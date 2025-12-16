import { HttpClient } from '@angular/common/http';
import { Injectable, OnDestroy, computed, signal } from '@angular/core';
import { Observable, Subscription, of, timer } from 'rxjs';
import { tap, finalize, map, switchMap } from 'rxjs/operators';
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
    // Map to the backend's expected format (CreateOwnerDto)
    const createOwnerDto = {
      companyName: payload.companyName,
      contactEmail: payload.email,
      contactPhone: payload.phoneNumber || null,
      cityId: payload.cityId
    };

    return this.http
      .post<OwnerProfile>(`${this.baseUrl}/api/Owners`, createOwnerDto)
      .pipe(
        tap((owner) => {
          // Since backend doesn't have auth, simulate a logged-in session
          this.authState.set({
            accessToken: 'demo-token-' + owner.id,
            refreshToken: 'demo-refresh-' + owner.id,
            expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
            owner
          });
          sessionStorage.setItem(STORAGE_KEYS.ownerRefreshToken, 'demo-refresh-' + owner.id);
          this.ownerState.setOwner(owner);
          this.personaService.setPersona('owner');
        })
      );
  }

  login(credentials: OwnerLoginRequest) {
    return this.http
      .post<OwnerAuthResponse>(`${this.baseUrl}/api/auth/login`, credentials)
      .pipe(
        tap((response) => this.handleAuthSuccess(response)),
        map((response) => response.owner)
      );
  }

  refresh(): Observable<OwnerAuthResponse | null> {
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
      .get<OwnerProfile>(`${this.baseUrl}/api/Owners/me`)
      .pipe(tap((owner) => this.setOwner(owner)));
  }

  updateProfile(profile: Partial<OwnerProfile>) {
    return this.http
      .put<OwnerProfile>(`${this.baseUrl}/api/Owners/me`, profile)
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
    // Calculate expiration from expiresAtUtc
    const expiresAt = new Date(response.expiresAtUtc).getTime();
    const expiresInMs = expiresAt - Date.now();
    const expiresInSec = Math.floor(expiresInMs / 1000);

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
    this.scheduleRefresh(expiresInSec);
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

