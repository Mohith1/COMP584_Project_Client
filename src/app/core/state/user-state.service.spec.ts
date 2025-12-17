import { TestBed } from '@angular/core/testing';
import { UserStateService } from './user-state.service';
import { OktaProfile } from '../models/okta.model';

describe('UserStateService', () => {
  let service: UserStateService;

  const mockProfile: OktaProfile = {
    sub: 'auth0|123456789',
    name: 'Test User',
    email: 'test@example.com',
    locale: 'en-US',
    ownerId: 'owner-123',
    roles: ['user', 'admin']
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [UserStateService]
    });

    service = TestBed.inject(UserStateService);
  });

  describe('profile state', () => {
    it('should return null initially', () => {
      expect(service.profile()).toBeNull();
    });

    it('should set and get profile', () => {
      service.setProfile(mockProfile);

      expect(service.profile()).toEqual(mockProfile);
      expect(service.profile()?.name).toBe('Test User');
      expect(service.profile()?.email).toBe('test@example.com');
    });

    it('should clear profile when set to null', () => {
      service.setProfile(mockProfile);
      service.setProfile(null);

      expect(service.profile()).toBeNull();
    });
  });

  describe('ownerId computed', () => {
    it('should return null when profile is null', () => {
      expect(service.ownerId()).toBeNull();
    });

    it('should return ownerId from profile', () => {
      service.setProfile(mockProfile);

      expect(service.ownerId()).toBe('owner-123');
    });

    it('should return null when profile has no ownerId', () => {
      const profileWithoutOwner: OktaProfile = {
        ...mockProfile,
        ownerId: undefined
      };
      service.setProfile(profileWithoutOwner);

      expect(service.ownerId()).toBeNull();
    });
  });

  describe('accessToken state', () => {
    it('should return null initially', () => {
      expect(service.accessToken()).toBeNull();
    });

    it('should set and get access token', () => {
      service.setAccessToken('test-token-123');

      expect(service.accessToken()).toBe('test-token-123');
    });

    it('should clear access token when set to null', () => {
      service.setAccessToken('test-token-123');
      service.setAccessToken(null);

      expect(service.accessToken()).toBeNull();
    });

    it('should update access token', () => {
      service.setAccessToken('old-token');
      service.setAccessToken('new-token');

      expect(service.accessToken()).toBe('new-token');
    });
  });

  describe('combined state updates', () => {
    it('should handle profile and token updates independently', () => {
      service.setProfile(mockProfile);
      service.setAccessToken('token-123');

      expect(service.profile()?.name).toBe('Test User');
      expect(service.accessToken()).toBe('token-123');

      // Clear token but keep profile
      service.setAccessToken(null);

      expect(service.profile()?.name).toBe('Test User');
      expect(service.accessToken()).toBeNull();

      // Clear profile but set new token
      service.setProfile(null);
      service.setAccessToken('new-token');

      expect(service.profile()).toBeNull();
      expect(service.ownerId()).toBeNull();
      expect(service.accessToken()).toBe('new-token');
    });
  });
});

