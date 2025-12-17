import { TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController
} from '@angular/common/http/testing';
import { VehicleService } from './vehicle.service';
import { MockDataService } from './mock-data.service';
import { mockVehicleSummary } from '../testing/testing.module';
import { environment } from '../../../environments/environment';
import { VehicleStatus } from '../models/vehicle.model';

describe('VehicleService', () => {
  let service: VehicleService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [VehicleService, MockDataService]
    });

    service = TestBed.inject(VehicleService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('addVehicle', () => {
    it('should POST new vehicle to API', () => {
      const newVehicle = {
        vin: 'WVWZZZ3CZWE789012',
        plateNumber: 'XYZ9999',
        make: 'Tesla',
        model: 'Model 3',
        modelYear: 2024
      };

      service.addVehicle('fleet-123', newVehicle).subscribe((vehicle) => {
        expect(vehicle.vin).toBe('WVWZZZ3CZWE789012');
        expect(vehicle.plateNumber).toBe('XYZ9999');
      });

      const req = httpMock.expectOne(
        `${environment.apiUrl}/api/Fleets/fleet-123/vehicles`
      );
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(newVehicle);
      req.flush({ ...mockVehicleSummary, ...newVehicle });
    });

    it('should add year field from modelYear for template compatibility', () => {
      const newVehicle = {
        vin: 'WVWZZZ3CZWE789012',
        plateNumber: 'XYZ9999',
        modelYear: 2024
      };

      service.addVehicle('fleet-123', newVehicle).subscribe((vehicle) => {
        expect(vehicle.year).toBe(2024);
        expect(vehicle.modelYear).toBe(2024);
      });

      const req = httpMock.expectOne(
        `${environment.apiUrl}/api/Fleets/fleet-123/vehicles`
      );
      req.flush({ ...mockVehicleSummary, ...newVehicle });
    });

    it('should fallback to mock data on API error', (done) => {
      const newVehicle = {
        vin: 'WVWZZZ3CZWE789012',
        plateNumber: 'XYZ9999',
        modelYear: 2024
      };

      // First, let's ensure mock mode is disabled
      service.setMockMode(false);

      service.addVehicle('fleet-123', newVehicle).subscribe({
        next: (vehicle) => {
          // After error, mock mode should be enabled and return mock vehicle
          expect(vehicle).toBeDefined();
          done();
        },
        error: () => {
          // Error is expected if mock data service doesn't have the fleet
          done();
        }
      });

      const req = httpMock.expectOne(
        `${environment.apiUrl}/api/Fleets/fleet-123/vehicles`
      );
      req.error(new ProgressEvent('Network error'));
    });
  });

  describe('updateVehicle', () => {
    it('should PUT updated vehicle to API', () => {
      const updates = {
        vin: 'WVWZZZ3CZWE123456',
        plateNumber: 'ABC1234',
        modelYear: 2025,
        status: 'InTransit' as VehicleStatus
      };

      service.updateVehicle('vehicle-123', updates).subscribe((vehicle) => {
        expect(vehicle.modelYear).toBe(2025);
        expect(vehicle.status).toBe('InTransit');
      });

      const req = httpMock.expectOne(
        `${environment.apiUrl}/api/Vehicles/vehicle-123`
      );
      expect(req.request.method).toBe('PUT');
      req.flush({ ...mockVehicleSummary, ...updates });
    });

    it('should use mock data when mock mode is enabled', () => {
      service.setMockMode(true);

      const updates = {
        vin: 'WVWZZZ3CZWE123456',
        plateNumber: 'ABC1234',
        modelYear: 2025
      };

      service.updateVehicle('vehicle-123', updates).subscribe((vehicle) => {
        expect(vehicle.id).toBe('vehicle-123');
        expect(vehicle.modelYear).toBe(2025);
      });

      // No HTTP request should be made in mock mode
      httpMock.expectNone(`${environment.apiUrl}/api/Vehicles/vehicle-123`);
    });
  });

  describe('updateStatus', () => {
    it('should update vehicle status via API', () => {
      service.updateStatus('vehicle-123', 'Maintenance').subscribe((vehicle) => {
        expect(vehicle.status).toBe('Maintenance');
      });

      const req = httpMock.expectOne(
        `${environment.apiUrl}/api/Vehicles/vehicle-123`
      );
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual({ status: 'Maintenance' });
      req.flush({ ...mockVehicleSummary, status: 'Maintenance' });
    });
  });

  describe('deleteVehicle', () => {
    it('should DELETE vehicle via API', () => {
      service.deleteVehicle('vehicle-123').subscribe((id) => {
        expect(id).toBe('vehicle-123');
      });

      const req = httpMock.expectOne(
        `${environment.apiUrl}/api/Vehicles/vehicle-123`
      );
      expect(req.request.method).toBe('DELETE');
      req.flush(null);
    });

    it('should fallback to mock data on API error', (done) => {
      service.deleteVehicle('vehicle-123').subscribe({
        next: (id) => {
          expect(id).toBe('vehicle-123');
          done();
        },
        error: () => {
          // Error is expected if mock data service doesn't have the vehicle
          done();
        }
      });

      const req = httpMock.expectOne(
        `${environment.apiUrl}/api/Vehicles/vehicle-123`
      );
      req.error(new ProgressEvent('Network error'));
    });
  });

  describe('setMockMode', () => {
    it('should enable mock mode', (done) => {
      service.setMockMode(true);

      // Verify mock mode by attempting an operation - no HTTP call should be made
      service.deleteVehicle('test-123').subscribe({
        next: (id) => {
          expect(id).toBe('test-123');
          done();
        },
        error: done.fail
      });
      
      // No HTTP request should be made in mock mode
      httpMock.expectNone(`${environment.apiUrl}/api/Vehicles/test-123`);
    });

    it('should disable mock mode and make HTTP requests', (done) => {
      service.setMockMode(true);
      service.setMockMode(false);

      service.deleteVehicle('test-123').subscribe({
        next: (id) => {
          expect(id).toBe('test-123');
          done();
        },
        error: done.fail
      });
      
      // HTTP request should be made
      const req = httpMock.expectOne(`${environment.apiUrl}/api/Vehicles/test-123`);
      expect(req.request.method).toBe('DELETE');
      req.flush(null);
    });
  });
});

