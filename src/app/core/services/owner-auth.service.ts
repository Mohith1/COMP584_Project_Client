import { HttpClient } from '@angular/common/http';
import { Injectable, OnDestroy, computed, signal } from '@angular/core';
import { Observable, Subscription, of, timer, firstValueFrom } from 'rxjs';
import { tap, map, switchMap, catchError, take } from 'rxjs/operators';
import { AuthService } from '@auth0/auth0-angular';
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
    private readonly personaService: PersonaService,
    private readonly auth0: AuthService
  ) {}

  /**
   * Check if user is authenticated with Auth0
   */
  async isAuth0Authenticated(): Promise<boolean> {
    return firstValueFrom(this.auth0.isAuthenticated$.pipe(take(1)));
  }

  /**
   * Get Auth0 access token
   */
  getAuth0AccessToken(): Observable<string> {
    return this.auth0.getAccessTokenSilently();
  }

  /**
   * Initiate Auth0 login redirect using SDK
   */
  loginWithAuth0(returnTo?: string): void {
    console.log('🔐 Initiating Auth0 login via SDK...');
    
    this.auth0.loginWithRedirect({
      appState: { target: returnTo ?? '/owner/dashboard' }
    }).subscribe({
      error: (err) => console.error('❌ Auth0 login redirect failed:', err)
    });
  }

  /**
   * Store pending registration data and redirect to Auth0 for authentication
   */
  initiateRegistration(payload: OwnerRegisterRequest): void {
    // Store the registration data to complete after Auth0 auth
    sessionStorage.setItem(
      STORAGE_KEYS.pendingOwnerRegistration,
      JSON.stringify(payload)
    );
    
    // Redirect to Auth0 for authentication with signup hint
    this.auth0.loginWithRedirect({
      appState: { target: '/owner/login/callback?action=register' },
      authorizationParams: {
        screen_hint: 'signup'
      }
    }).subscribe({
      error: (err) => console.error('❌ Auth0 signup redirect failed:', err)
    });
  }

  /**
   * Complete registration after Auth0 authentication
   */
  completeRegistration(): Observable<OwnerProfile | null> {
    const pendingData = sessionStorage.getItem(STORAGE_KEYS.pendingOwnerRegistration);
    
    if (!pendingData) {
      return of(null);
    }

    const payload: OwnerRegisterRequest = JSON.parse(pendingData);
    
    return this.createOwnerProfile(payload).pipe(
      tap(() => {
        // Clear pending registration data
        sessionStorage.removeItem(STORAGE_KEYS.pendingOwnerRegistration);
      }),
      catchError((error) => {
        sessionStorage.removeItem(STORAGE_KEYS.pendingOwnerRegistration);
        throw error;
      })
    );
  }

  /**
   * Check if there's pending registration data
   */
  hasPendingRegistration(): boolean {
    return !!sessionStorage.getItem(STORAGE_KEYS.pendingOwnerRegistration);
  }

  /**
   * Sync owner state with Auth0 authentication
   */
  syncWithAuth0(): Observable<OwnerProfile | null> {
    return this.auth0.getAccessTokenSilently().pipe(
      switchMap((token) => {
        if (!token) {
          return of(null);
        }
        
        // Set the Auth0 token
        this.authState.update((state) => ({
          ...state,
          accessToken: token
        }));

        // Try to load existing owner profile
        return this.loadProfile().pipe(
          tap(() => {
            this.personaService.setPersona('owner');
          }),
          catchError(() => of(null))
        );
      }),
      catchError(() => of(null))
    );
  }

  /**
   * Create owner profile in backend (used after Auth0 auth)
   */
  private createOwnerProfile(payload: OwnerRegisterRequest): Observable<OwnerProfile> {
    // Map to the backend's expected format (CreateOwnerDto)
    const isHardcodedCity = payload.cityId && !payload.cityId.includes('-') === false && 
      ['nyc', 'la', 'chi', 'hou', 'phx', 'phi', 'sa', 'sd', 'dal', 'sj', 'aus', 'jax', 
       'fw', 'col', 'cha', 'ind', 'sf', 'sea', 'den', 'dc', 'bos', 'mia', 'atl', 'lv', 
       'det', 'min', 'por', 'nas', 'orl', 'bal'].some(prefix => payload.cityId.startsWith(prefix));
    
    const createOwnerDto: Record<string, unknown> = {
      companyName: payload.companyName,
      contactEmail: payload.email,
      contactPhone: payload.phoneNumber || null
    };
    
    // Only include cityId if it's a valid GUID from the API
    if (payload.cityId && !isHardcodedCity) {
      createOwnerDto['cityId'] = payload.cityId;
    }

    return this.http
      .post<OwnerProfile>(`${this.baseUrl}/api/Owners`, createOwnerDto)
      .pipe(
        tap((owner) => {
          this.setOwner(owner);
          this.personaService.setPersona('owner');
        })
      );
  }

  /**
   * @deprecated Use initiateRegistration() for Auth0-based registration
   * Legacy register method - now redirects through Auth0
   */
  register(payload: OwnerRegisterRequest) {
    this.initiateRegistration(payload);
    return of(null as unknown as OwnerProfile);
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

  logout(): void {
    this.clearAuthState();
    this.auth0.logout({
      logoutParams: {
        returnTo: window.location.origin
      }
    });
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
