/**
 * Testing utilities and mocks for the Fleet Management application.
 * This module provides reusable mock providers for Auth0, services, and common test setup.
 */

import { NgModule } from '@angular/core';
import { of, BehaviorSubject } from 'rxjs';
import { AuthService, User } from '@auth0/auth0-angular';

/**
 * Mock Auth0 AuthService for testing
 */
export class MockAuth0Service {
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  private isLoadingSubject = new BehaviorSubject<boolean>(false);
  private userSubject = new BehaviorSubject<User | null | undefined>(null);
  private errorSubject = new BehaviorSubject<Error | null>(null);

  isAuthenticated$ = this.isAuthenticatedSubject.asObservable();
  isLoading$ = this.isLoadingSubject.asObservable();
  user$ = this.userSubject.asObservable();
  error$ = this.errorSubject.asObservable();

  // Test control methods
  setAuthenticated(value: boolean): void {
    this.isAuthenticatedSubject.next(value);
  }

  setLoading(value: boolean): void {
    this.isLoadingSubject.next(value);
  }

  setUser(user: User | null): void {
    this.userSubject.next(user);
  }

  setError(error: Error | null): void {
    this.errorSubject.next(error);
  }

  // Mock methods
  loginWithRedirect = jasmine.createSpy('loginWithRedirect').and.returnValue(of(undefined));
  logout = jasmine.createSpy('logout').and.returnValue(of(undefined));
  getAccessTokenSilently = jasmine.createSpy('getAccessTokenSilently').and.returnValue(of('mock-token-123'));
}

/**
 * Creates a mock Auth0 service provider for TestBed
 */
export function provideMockAuth0() {
  return {
    provide: AuthService,
    useClass: MockAuth0Service
  };
}

/**
 * Creates a pre-configured mock Auth0 service with custom state
 */
export function createMockAuth0Service(options?: {
  isAuthenticated?: boolean;
  isLoading?: boolean;
  user?: User | null;
  accessToken?: string;
}): MockAuth0Service {
  const service = new MockAuth0Service();
  
  if (options?.isAuthenticated !== undefined) {
    service.setAuthenticated(options.isAuthenticated);
  }
  if (options?.isLoading !== undefined) {
    service.setLoading(options.isLoading);
  }
  if (options?.user !== undefined) {
    service.setUser(options.user);
  }
  if (options?.accessToken) {
    service.getAccessTokenSilently = jasmine.createSpy('getAccessTokenSilently')
      .and.returnValue(of(options.accessToken));
  }
  
  return service;
}

/**
 * Mock user for testing
 */
export const mockAuth0User: User = {
  sub: 'auth0|123456789',
  name: 'Test User',
  email: 'test@example.com',
  email_verified: true,
  picture: 'https://example.com/avatar.jpg'
};

/**
 * Mock owner profile for testing
 */
export const mockOwnerProfile = {
  id: 'owner-123',
  companyName: 'Test Fleet Co',
  contactEmail: 'owner@test.com',
  contactPhone: '+1234567890',
  city: 'New York',
  country: 'USA',
  fleetCount: 3
};

/**
 * Mock fleet summary for testing
 */
export const mockFleetSummary = {
  id: 'fleet-123',
  name: 'Metro Delivery Fleet',
  description: 'Downtown delivery vehicles',
  vehicleCount: 5,
  status: 'Active' as const,
  updatedOn: new Date().toISOString()
};

/**
 * Mock vehicle summary for testing
 */
export const mockVehicleSummary = {
  id: 'vehicle-123',
  fleetId: 'fleet-123',
  vin: 'WVWZZZ3CZWE123456',
  plateNumber: 'ABC1234',
  make: 'Volkswagen',
  model: 'ID.4',
  modelYear: 2024,
  year: 2024,
  status: 'Available' as const
};

/**
 * Mock telemetry snapshot for testing
 */
export const mockTelemetrySnapshot = {
  vehicleId: 'vehicle-123',
  vehicleName: 'Test Vehicle',
  speed: 45,
  fuelLevel: 65,
  batteryHealth: 92,
  latitude: 40.7128,
  longitude: -74.0060,
  status: 'Normal' as const,
  recordedOn: new Date().toISOString()
};

@NgModule({})
export class TestingModule {}

