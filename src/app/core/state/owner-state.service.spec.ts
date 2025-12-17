import { TestBed } from '@angular/core/testing';
import { OwnerStateService } from './owner-state.service';
import {
  mockOwnerProfile,
  mockFleetSummary,
  mockVehicleSummary,
  mockTelemetrySnapshot
} from '../testing/testing.module';
import { FleetSummary } from '../models/fleet.model';
import { VehicleSummary } from '../models/vehicle.model';

describe('OwnerStateService', () => {
  let service: OwnerStateService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [OwnerStateService]
    });

    service = TestBed.inject(OwnerStateService);
  });

  describe('owner state', () => {
    it('should return null initially', () => {
      expect(service.owner()).toBeNull();
    });

    it('should set and get owner', () => {
      service.setOwner(mockOwnerProfile);

      expect(service.owner()).toEqual(mockOwnerProfile);
      expect(service.owner()?.companyName).toBe('Test Fleet Co');
    });

    it('should clear owner when set to null', () => {
      service.setOwner(mockOwnerProfile);
      service.setOwner(null);

      expect(service.owner()).toBeNull();
    });
  });

  describe('fleets state', () => {
    it('should return empty array initially', () => {
      expect(service.fleets()).toEqual([]);
    });

    it('should set and get fleets', () => {
      const fleets: FleetSummary[] = [
        mockFleetSummary,
        { ...mockFleetSummary, id: 'fleet-456', name: 'Second Fleet' }
      ];

      service.setFleets(fleets);

      expect(service.fleets().length).toBe(2);
      expect(service.fleets()[0].name).toBe('Metro Delivery Fleet');
    });

    it('should upsert existing fleet (update)', () => {
      service.setFleets([mockFleetSummary]);
      
      const updatedFleet = { ...mockFleetSummary, name: 'Updated Fleet Name' };
      service.upsertFleet(updatedFleet);

      expect(service.fleets().length).toBe(1);
      expect(service.fleets()[0].name).toBe('Updated Fleet Name');
    });

    it('should upsert new fleet (insert at beginning)', () => {
      service.setFleets([mockFleetSummary]);
      
      const newFleet: FleetSummary = {
        ...mockFleetSummary,
        id: 'fleet-new',
        name: 'New Fleet'
      };
      service.upsertFleet(newFleet);

      expect(service.fleets().length).toBe(2);
      expect(service.fleets()[0].name).toBe('New Fleet'); // New fleet at beginning
      expect(service.fleets()[1].name).toBe('Metro Delivery Fleet');
    });

    it('should remove fleet by id', () => {
      const fleets: FleetSummary[] = [
        mockFleetSummary,
        { ...mockFleetSummary, id: 'fleet-456', name: 'Second Fleet' }
      ];
      service.setFleets(fleets);

      service.removeFleet('fleet-123');

      expect(service.fleets().length).toBe(1);
      expect(service.fleets()[0].id).toBe('fleet-456');
    });

    it('should do nothing when removing non-existent fleet', () => {
      service.setFleets([mockFleetSummary]);

      service.removeFleet('non-existent');

      expect(service.fleets().length).toBe(1);
    });
  });

  describe('vehicles state', () => {
    it('should return empty array initially', () => {
      expect(service.vehicles()).toEqual([]);
    });

    it('should set and get vehicles', () => {
      const vehicles: VehicleSummary[] = [
        mockVehicleSummary,
        { ...mockVehicleSummary, id: 'vehicle-456', vin: 'DIFFERENT123456789' }
      ];

      service.setVehicles(vehicles);

      expect(service.vehicles().length).toBe(2);
      expect(service.vehicles()[0].vin).toBe('WVWZZZ3CZWE123456');
    });

    it('should upsert existing vehicle (update)', () => {
      service.setVehicles([mockVehicleSummary]);
      
      const updatedVehicle = { ...mockVehicleSummary, status: 'InTransit' as const };
      service.upsertVehicle(updatedVehicle);

      expect(service.vehicles().length).toBe(1);
      expect(service.vehicles()[0].status).toBe('InTransit');
    });

    it('should upsert new vehicle (insert at beginning)', () => {
      service.setVehicles([mockVehicleSummary]);
      
      const newVehicle: VehicleSummary = {
        ...mockVehicleSummary,
        id: 'vehicle-new',
        vin: 'NEWVIN123456789AB'
      };
      service.upsertVehicle(newVehicle);

      expect(service.vehicles().length).toBe(2);
      expect(service.vehicles()[0].vin).toBe('NEWVIN123456789AB'); // New at beginning
    });

    it('should remove vehicle by id', () => {
      const vehicles: VehicleSummary[] = [
        mockVehicleSummary,
        { ...mockVehicleSummary, id: 'vehicle-456' }
      ];
      service.setVehicles(vehicles);

      service.removeVehicle('vehicle-123');

      expect(service.vehicles().length).toBe(1);
      expect(service.vehicles()[0].id).toBe('vehicle-456');
    });
  });

  describe('telemetry state', () => {
    it('should return empty array initially', () => {
      expect(service.telemetry()).toEqual([]);
    });

    it('should set and get telemetry', () => {
      const telemetry = [
        mockTelemetrySnapshot,
        { ...mockTelemetrySnapshot, vehicleId: 'vehicle-456' }
      ];

      service.setTelemetry(telemetry);

      expect(service.telemetry().length).toBe(2);
      expect(service.telemetry()[0].vehicleId).toBe('vehicle-123');
    });
  });

  describe('loading state', () => {
    it('should return false initially', () => {
      expect(service.loading()).toBeFalse();
    });

    it('should set loading to true', () => {
      service.setLoading(true);

      expect(service.loading()).toBeTrue();
    });

    it('should set loading to false', () => {
      service.setLoading(true);
      service.setLoading(false);

      expect(service.loading()).toBeFalse();
    });
  });
});

