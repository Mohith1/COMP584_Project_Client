import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController
} from '@angular/common/http/testing';
import { AuthService } from '@auth0/auth0-angular';
import { of } from 'rxjs';
import { OwnerAuthService } from './owner-auth.service';
import { OwnerStateService } from '../state/owner-state.service';
import { PersonaService } from './persona.service';
import { MockAuth0Service, mockOwnerProfile } from '../testing/testing.module';
import { environment } from '../../../environments/environment';

describe('OwnerAuthService', () => {
  let service: OwnerAuthService;
  let httpMock: HttpTestingController;
  let mockAuth0: MockAuth0Service;

  beforeEach(() => {
    // Clear sessionStorage before each test to ensure clean state
    sessionStorage.clear();
    
    mockAuth0 = new MockAuth0Service();

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        OwnerAuthService,
        OwnerStateService,
        PersonaService,
        { provide: AuthService, useValue: mockAuth0 }
      ]
    });

    service = TestBed.inject(OwnerAuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    sessionStorage.clear();
  });

  describe('login', () => {
    it('should login owner via API and set auth state', () => {
      const mockResponse = {
        accessToken: 'abc-token',
        refreshToken: 'xyz-refresh',
        expiresAtUtc: new Date(Date.now() + 3600000).toISOString(),
        owner: mockOwnerProfile
      };

      service
        .login({ email: 'owner@test.com', password: 'Password123!' })
        .subscribe((owner) => {
          expect(owner.id).toEqual('owner-123');
          expect(owner.companyName).toEqual('Test Fleet Co');
        });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/auth/login`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({
        email: 'owner@test.com',
        password: 'Password123!'
      });
      req.flush(mockResponse);
    });
  });

  describe('refresh', () => {
    it('should refresh token via API', () => {
      // First login to set refresh token
      const loginResponse = {
        accessToken: 'old-token',
        refreshToken: 'refresh-token',
        expiresAtUtc: new Date(Date.now() + 3600000).toISOString(),
        owner: mockOwnerProfile
      };

      service.login({ email: 'test@test.com', password: 'pass' }).subscribe();
      httpMock.expectOne(`${environment.apiUrl}/api/auth/login`).flush(loginResponse);

      // Now test refresh
      const refreshResponse = {
        accessToken: 'new-token',
        refreshToken: 'new-refresh',
        expiresAtUtc: new Date(Date.now() + 3600000).toISOString(),
        owner: mockOwnerProfile
      };

      service.refresh().subscribe((response) => {
        expect(response).toBeTruthy();
        expect(response?.accessToken).toBe('new-token');
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/auth/refresh`);
      expect(req.request.method).toBe('POST');
      req.flush(refreshResponse);
    });

    it('should return null when no refresh token exists', (done) => {
      // Ensure we're starting fresh with no stored token
      sessionStorage.clear();
      
      // Create a new service instance to ensure clean state
      const freshService = TestBed.inject(OwnerAuthService);
      
      freshService.refresh().subscribe((response) => {
        expect(response).toBeNull();
        done();
      });
    });
  });

  describe('loadProfile', () => {
    it('should load owner profile from API', () => {
      service.loadProfile().subscribe((owner) => {
        expect(owner.id).toBe('owner-123');
        expect(owner.companyName).toBe('Test Fleet Co');
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/Owners/me`);
      expect(req.request.method).toBe('GET');
      req.flush(mockOwnerProfile);
    });
  });

  describe('updateProfile', () => {
    it('should update owner profile via API', () => {
      const updates = { companyName: 'Updated Company' };

      service.updateProfile(updates).subscribe((owner) => {
        expect(owner.companyName).toBe('Updated Company');
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/Owners/me`);
      expect(req.request.method).toBe('PUT');
      req.flush({ ...mockOwnerProfile, companyName: 'Updated Company' });
    });
  });

  describe('logout', () => {
    it('should clear auth state and call Auth0 logout', () => {
      service.logout();

      expect(mockAuth0.logout).toHaveBeenCalled();
      expect(service.accessToken()).toBeNull();
      expect(service.owner()).toBeNull();
      expect(service.isAuthenticated()).toBeFalse();
    });
  });

  describe('isAuth0Authenticated', () => {
    it('should return true when authenticated', async () => {
      mockAuth0.setAuthenticated(true);

      const result = await service.isAuth0Authenticated();
      expect(result).toBeTrue();
    });

    it('should return false when not authenticated', async () => {
      mockAuth0.setAuthenticated(false);

      const result = await service.isAuth0Authenticated();
      expect(result).toBeFalse();
    });
  });

  describe('loginWithAuth0', () => {
    it('should call Auth0 loginWithRedirect', () => {
      service.loginWithAuth0('/owner/dashboard');

      expect(mockAuth0.loginWithRedirect).toHaveBeenCalledWith({
        appState: { target: '/owner/dashboard' }
      });
    });

    it('should use default returnTo when not provided', () => {
      service.loginWithAuth0();

      expect(mockAuth0.loginWithRedirect).toHaveBeenCalledWith({
        appState: { target: '/owner/dashboard' }
      });
    });
  });

  describe('ownerId helpers', () => {
    it('ownerId should return null when not authenticated', () => {
      expect(service.ownerId()).toBeNull();
    });

    it('ownerIdOrThrow should throw when not authenticated', () => {
      expect(() => service.ownerIdOrThrow()).toThrowError('Owner is not authenticated');
    });
  });
});
