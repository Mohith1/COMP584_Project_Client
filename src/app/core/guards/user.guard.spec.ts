import { TestBed } from '@angular/core/testing';
import { Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { UserGuard } from './user.guard';
import { OktaAuthFacade } from '../services/okta-auth.facade';
import { PersonaService } from '../services/persona.service';

describe('UserGuard', () => {
  let guard: UserGuard;
  let router: Router;
  let oktaFacadeSpy: jasmine.SpyObj<OktaAuthFacade>;
  let personaServiceSpy: jasmine.SpyObj<PersonaService>;

  const mockRoute = {} as ActivatedRouteSnapshot;

  beforeEach(() => {
    oktaFacadeSpy = jasmine.createSpyObj('OktaAuthFacade', [
      'isAuthenticated',
      'login'
    ]);
    personaServiceSpy = jasmine.createSpyObj('PersonaService', ['setPersona']);

    TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      providers: [
        UserGuard,
        { provide: OktaAuthFacade, useValue: oktaFacadeSpy },
        { provide: PersonaService, useValue: personaServiceSpy }
      ]
    });

    guard = TestBed.inject(UserGuard);
    router = TestBed.inject(Router);
  });

  describe('canActivate', () => {
    it('should allow access when authenticated', (done) => {
      const state = { url: '/user/vehicles' } as RouterStateSnapshot;
      oktaFacadeSpy.isAuthenticated.and.returnValue(Promise.resolve(true));

      const result = guard.canActivate(mockRoute, state);

      if (typeof result === 'object' && 'subscribe' in result) {
        result.subscribe((value) => {
          expect(value).toBeTrue();
          expect(personaServiceSpy.setPersona).toHaveBeenCalledWith('user');
          done();
        });
      }
    });

    it('should redirect to login when not authenticated', (done) => {
      const state = { url: '/user/vehicles' } as RouterStateSnapshot;
      oktaFacadeSpy.isAuthenticated.and.returnValue(Promise.resolve(false));

      const result = guard.canActivate(mockRoute, state);

      if (typeof result === 'object' && 'subscribe' in result) {
        result.subscribe((value) => {
          expect(value).toBeFalse();
          expect(oktaFacadeSpy.login).toHaveBeenCalledWith('/user/vehicles');
          done();
        });
      }
    });

    it('should pass current URL to login for redirect', (done) => {
      const state = { url: '/user/profile' } as RouterStateSnapshot;
      oktaFacadeSpy.isAuthenticated.and.returnValue(Promise.resolve(false));

      const result = guard.canActivate(mockRoute, state);

      if (typeof result === 'object' && 'subscribe' in result) {
        result.subscribe(() => {
          expect(oktaFacadeSpy.login).toHaveBeenCalledWith('/user/profile');
          done();
        });
      }
    });

    it('should redirect to login on authentication check error', (done) => {
      const state = { url: '/user/vehicles' } as RouterStateSnapshot;
      oktaFacadeSpy.isAuthenticated.and.returnValue(Promise.reject(new Error('Auth error')));

      const result = guard.canActivate(mockRoute, state);

      if (typeof result === 'object' && 'subscribe' in result) {
        result.subscribe((value) => {
          expect(value).toBeFalse();
          expect(oktaFacadeSpy.login).toHaveBeenCalledWith('/user/vehicles');
          done();
        });
      }
    });

    it('should not set persona when not authenticated', (done) => {
      const state = { url: '/user/vehicles' } as RouterStateSnapshot;
      oktaFacadeSpy.isAuthenticated.and.returnValue(Promise.resolve(false));

      const result = guard.canActivate(mockRoute, state);

      if (typeof result === 'object' && 'subscribe' in result) {
        result.subscribe(() => {
          expect(personaServiceSpy.setPersona).not.toHaveBeenCalled();
          done();
        });
      }
    });
  });

  describe('canActivateChild', () => {
    it('should delegate to canActivate', (done) => {
      const state = { url: '/user/vehicles' } as RouterStateSnapshot;
      oktaFacadeSpy.isAuthenticated.and.returnValue(Promise.resolve(true));

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

