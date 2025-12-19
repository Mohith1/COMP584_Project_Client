import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { of, throwError } from 'rxjs';
import { OwnerGuard } from './owner.guard';
import { OwnerAuthService } from '../services/owner-auth.service';
import { PersonaService } from '../services/persona.service';

describe('OwnerGuard', () => {
  let guard: OwnerGuard;
  let router: Router;
  let ownerAuthSpy: jasmine.SpyObj<OwnerAuthService>;
  let personaServiceSpy: jasmine.SpyObj<PersonaService>;

  const mockRoute = {} as ActivatedRouteSnapshot;

  beforeEach(() => {
    ownerAuthSpy = jasmine.createSpyObj('OwnerAuthService', [
      'isAuth0Authenticated',
      'syncWithAuth0'
    ]);
    personaServiceSpy = jasmine.createSpyObj('PersonaService', ['setPersona']);

    TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      providers: [
        OwnerGuard,
        { provide: OwnerAuthService, useValue: ownerAuthSpy },
        { provide: PersonaService, useValue: personaServiceSpy }
      ]
    });

    guard = TestBed.inject(OwnerGuard);
    router = TestBed.inject(Router);
  });

  describe('canActivate', () => {
    it('should allow access to login page without authentication', (done) => {
      const state = { url: '/owner/login' } as RouterStateSnapshot;
      ownerAuthSpy.isAuth0Authenticated.and.returnValue(Promise.resolve(false));

      const result = guard.canActivate(mockRoute, state);

      if (result instanceof Promise) {
        result.then(() => done());
      } else if (typeof result === 'object' && 'subscribe' in result) {
        result.subscribe((value) => {
          expect(value).toBeTrue();
          done();
        });
      }
    });

    it('should allow access to register page without authentication', (done) => {
      const state = { url: '/owner/register' } as RouterStateSnapshot;
      ownerAuthSpy.isAuth0Authenticated.and.returnValue(Promise.resolve(false));

      const result = guard.canActivate(mockRoute, state);

      if (typeof result === 'object' && 'subscribe' in result) {
        result.subscribe((value) => {
          expect(value).toBeTrue();
          done();
        });
      }
    });

    it('should redirect to login when not authenticated', (done) => {
      const state = { url: '/owner/dashboard' } as RouterStateSnapshot;
      ownerAuthSpy.isAuth0Authenticated.and.returnValue(Promise.resolve(false));

      const result = guard.canActivate(mockRoute, state);

      if (typeof result === 'object' && 'subscribe' in result) {
        result.subscribe((value) => {
          // Should be a UrlTree redirecting to login
          expect(value).not.toBeTrue();
          expect(value.toString()).toContain('/owner/login');
          done();
        });
      }
    });

    it('should allow access when authenticated with Auth0', (done) => {
      const state = { url: '/owner/dashboard' } as RouterStateSnapshot;
      ownerAuthSpy.isAuth0Authenticated.and.returnValue(Promise.resolve(true));
      ownerAuthSpy.syncWithAuth0.and.returnValue(of(null));

      const result = guard.canActivate(mockRoute, state);

      if (typeof result === 'object' && 'subscribe' in result) {
        result.subscribe((value) => {
          expect(value).toBeTrue();
          expect(personaServiceSpy.setPersona).toHaveBeenCalledWith('owner');
          done();
        });
      }
    });

    it('should attempt to sync owner profile when authenticated', (done) => {
      const state = { url: '/owner/dashboard' } as RouterStateSnapshot;
      ownerAuthSpy.isAuth0Authenticated.and.returnValue(Promise.resolve(true));
      ownerAuthSpy.syncWithAuth0.and.returnValue(of({ id: 'owner-123' } as any));

      const result = guard.canActivate(mockRoute, state);

      if (typeof result === 'object' && 'subscribe' in result) {
        result.subscribe(() => {
          // syncWithAuth0 should be called (asynchronously)
          setTimeout(() => {
            expect(ownerAuthSpy.syncWithAuth0).toHaveBeenCalled();
            done();
          }, 0);
        });
      }
    });

    it('should handle sync errors gracefully', (done) => {
      const state = { url: '/owner/dashboard' } as RouterStateSnapshot;
      ownerAuthSpy.isAuth0Authenticated.and.returnValue(Promise.resolve(true));
      ownerAuthSpy.syncWithAuth0.and.returnValue(throwError(() => new Error('Sync failed')));

      const result = guard.canActivate(mockRoute, state);

      if (typeof result === 'object' && 'subscribe' in result) {
        result.subscribe((value) => {
          // Should still allow access even if sync fails
          expect(value).toBeTrue();
          done();
        });
      }
    });

    it('should redirect to login on auth check error', (done) => {
      const state = { url: '/owner/dashboard' } as RouterStateSnapshot;
      ownerAuthSpy.isAuth0Authenticated.and.returnValue(Promise.reject(new Error('Auth error')));

      const result = guard.canActivate(mockRoute, state);

      if (typeof result === 'object' && 'subscribe' in result) {
        result.subscribe((value) => {
          expect(value.toString()).toContain('/owner/login');
          done();
        });
      }
    });
  });

  describe('canActivateChild', () => {
    it('should delegate to canActivate', (done) => {
      const state = { url: '/owner/dashboard' } as RouterStateSnapshot;
      ownerAuthSpy.isAuth0Authenticated.and.returnValue(Promise.resolve(true));
      ownerAuthSpy.syncWithAuth0.and.returnValue(of(null));

      spyOn(guard, 'canActivate').and.callThrough();

      const result = guard.canActivateChild(mockRoute, state);

      if (typeof result === 'object' && 'subscribe' in result) {
        result.subscribe(() => {
          expect(guard.canActivate).toHaveBeenCalledWith(mockRoute, state);
          done();
        });
      }
    });
  });
});





