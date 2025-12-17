import { TestBed, fakeAsync, tick, discardPeriodicTasks } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController
} from '@angular/common/http/testing';
import { TelemetryService } from './telemetry.service';
import { mockTelemetrySnapshot } from '../testing/testing.module';
import { environment } from '../../../environments/environment';
import { TelemetrySnapshot } from '../models/telemetry.model';

describe('TelemetryService', () => {
  let service: TelemetryService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [TelemetryService]
    });

    service = TestBed.inject(TelemetryService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('getOwnerTelemetry', () => {
    it('should GET telemetry data for owner', () => {
      const mockTelemetry: TelemetrySnapshot[] = [
        mockTelemetrySnapshot,
        { ...mockTelemetrySnapshot, vehicleId: 'vehicle-456', speed: 60 }
      ];

      service.getOwnerTelemetry('owner-123').subscribe((telemetry) => {
        expect(telemetry.length).toBe(2);
        expect(telemetry[0].vehicleId).toBe('vehicle-123');
        expect(telemetry[1].speed).toBe(60);
      });

      const req = httpMock.expectOne(
        `${environment.apiUrl}/api/owners/owner-123/vehicles/telemetry`
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockTelemetry);
    });

    it('should handle empty telemetry response', () => {
      service.getOwnerTelemetry('owner-empty').subscribe((telemetry) => {
        expect(telemetry.length).toBe(0);
      });

      const req = httpMock.expectOne(
        `${environment.apiUrl}/api/owners/owner-empty/vehicles/telemetry`
      );
      req.flush([]);
    });
  });

  describe('pollOwnerTelemetry', () => {
    it('should poll telemetry at specified interval', fakeAsync(() => {
      const mockTelemetry: TelemetrySnapshot[] = [mockTelemetrySnapshot];
      let callCount = 0;

      const subscription = service.pollOwnerTelemetry('owner-123', 1000).subscribe(() => {
        callCount++;
      });

      // Initial request (startWith(0))
      const req1 = httpMock.expectOne(
        `${environment.apiUrl}/api/owners/owner-123/vehicles/telemetry`
      );
      req1.flush(mockTelemetry);
      expect(callCount).toBe(1);

      // Wait for interval
      tick(1000);
      const req2 = httpMock.expectOne(
        `${environment.apiUrl}/api/owners/owner-123/vehicles/telemetry`
      );
      req2.flush(mockTelemetry);
      expect(callCount).toBe(2);

      // Wait for another interval
      tick(1000);
      const req3 = httpMock.expectOne(
        `${environment.apiUrl}/api/owners/owner-123/vehicles/telemetry`
      );
      req3.flush(mockTelemetry);
      expect(callCount).toBe(3);

      subscription.unsubscribe();
      discardPeriodicTasks();
    }));

    it('should use default interval of 30000ms', fakeAsync(() => {
      let callCount = 0;

      const subscription = service.pollOwnerTelemetry('owner-123').subscribe(() => {
        callCount++;
      });

      // Initial request
      const req1 = httpMock.expectOne(
        `${environment.apiUrl}/api/owners/owner-123/vehicles/telemetry`
      );
      req1.flush([mockTelemetrySnapshot]);
      expect(callCount).toBe(1);

      // Before default interval - no new request
      tick(29000);
      httpMock.expectNone(
        `${environment.apiUrl}/api/owners/owner-123/vehicles/telemetry`
      );

      // After default interval - new request
      tick(1000);
      const req2 = httpMock.expectOne(
        `${environment.apiUrl}/api/owners/owner-123/vehicles/telemetry`
      );
      req2.flush([mockTelemetrySnapshot]);
      expect(callCount).toBe(2);

      subscription.unsubscribe();
      discardPeriodicTasks();
    }));

    it('should stop polling when unsubscribed', fakeAsync(() => {
      let callCount = 0;

      const subscription = service.pollOwnerTelemetry('owner-123', 1000).subscribe(() => {
        callCount++;
      });

      // Initial request
      const req1 = httpMock.expectOne(
        `${environment.apiUrl}/api/owners/owner-123/vehicles/telemetry`
      );
      req1.flush([mockTelemetrySnapshot]);
      expect(callCount).toBe(1);

      // Unsubscribe
      subscription.unsubscribe();

      // Wait for interval
      tick(1000);

      // No new request should be made - verify call count stayed at 1
      expect(callCount).toBe(1);

      discardPeriodicTasks();
    }));
  });
});

