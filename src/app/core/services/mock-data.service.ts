import { Injectable } from '@angular/core';
import { FleetSummary, FleetDetail } from '../models/fleet.model';
import { VehicleSummary, VehicleStatus } from '../models/vehicle.model';

@Injectable({
  providedIn: 'root'
})
export class MockDataService {
  private readonly mockFleets: FleetDetail[] = [
    {
      id: 'fleet-001',
      name: 'Downtown Delivery Fleet',
      description: 'Primary delivery vehicles for downtown metropolitan area',
      vehicleCount: 5,
      status: 'Active',
      updatedOn: new Date().toISOString(),
      vehicles: [
        {
          id: 'vehicle-001',
          fleetId: 'fleet-001',
          vin: '1HGBH41JXMN109186',
          plateNumber: 'ABC-1234',
          make: 'Ford',
          model: 'Transit Van',
          modelYear: 2023,
          year: 2023,
          status: 'Available'
        },
        {
          id: 'vehicle-002',
          fleetId: 'fleet-001',
          vin: '2FMDK3GC7DBA12345',
          plateNumber: 'XYZ-5678',
          make: 'Mercedes-Benz',
          model: 'Sprinter',
          modelYear: 2022,
          year: 2022,
          status: 'InTransit'
        },
        {
          id: 'vehicle-003',
          fleetId: 'fleet-001',
          vin: '3VWDX7AJ5DM123456',
          plateNumber: 'DEF-9012',
          make: 'Chevrolet',
          model: 'Express',
          modelYear: 2024,
          year: 2024,
          status: 'Available'
        },
        {
          id: 'vehicle-004',
          fleetId: 'fleet-001',
          vin: 'JH4KA8260MC001234',
          plateNumber: 'GHI-3456',
          make: 'RAM',
          model: 'ProMaster',
          modelYear: 2023,
          year: 2023,
          status: 'Maintenance'
        },
        {
          id: 'vehicle-005',
          fleetId: 'fleet-001',
          vin: '5XYZT3LB6DG123456',
          plateNumber: 'JKL-7890',
          make: 'Nissan',
          model: 'NV Cargo',
          modelYear: 2022,
          year: 2022,
          status: 'Available'
        }
      ]
    },
    {
      id: 'fleet-002',
      name: 'Highway Logistics Fleet',
      description: 'Long-haul trucks for interstate deliveries',
      vehicleCount: 4,
      status: 'Active',
      updatedOn: new Date().toISOString(),
      vehicles: [
        {
          id: 'vehicle-006',
          fleetId: 'fleet-002',
          vin: '1FUJGLDR7CLBP1234',
          plateNumber: 'TRK-0001',
          make: 'Freightliner',
          model: 'Cascadia',
          modelYear: 2023,
          year: 2023,
          status: 'InTransit'
        },
        {
          id: 'vehicle-007',
          fleetId: 'fleet-002',
          vin: '3AKJHHDR5DSFU5678',
          plateNumber: 'TRK-0002',
          make: 'Peterbilt',
          model: '579',
          modelYear: 2022,
          year: 2022,
          status: 'Available'
        },
        {
          id: 'vehicle-008',
          fleetId: 'fleet-002',
          vin: '1XPWD40X1ED123456',
          plateNumber: 'TRK-0003',
          make: 'Kenworth',
          model: 'T680',
          modelYear: 2024,
          year: 2024,
          status: 'InTransit'
        },
        {
          id: 'vehicle-009',
          fleetId: 'fleet-002',
          vin: '2HSCNAPR2CC654321',
          plateNumber: 'TRK-0004',
          make: 'Volvo',
          model: 'VNL 760',
          modelYear: 2023,
          year: 2023,
          status: 'Available'
        }
      ]
    },
    {
      id: 'fleet-003',
      name: 'Suburban Service Fleet',
      description: 'Service and maintenance vehicles for suburban areas',
      vehicleCount: 3,
      status: 'Inactive',
      updatedOn: new Date().toISOString(),
      vehicles: [
        {
          id: 'vehicle-010',
          fleetId: 'fleet-003',
          vin: '1GCGG25K091123456',
          plateNumber: 'SVC-1001',
          make: 'Toyota',
          model: 'Tacoma',
          modelYear: 2023,
          year: 2023,
          status: 'Offline'
        },
        {
          id: 'vehicle-011',
          fleetId: 'fleet-003',
          vin: '1FTEW1EG5JFA12345',
          plateNumber: 'SVC-1002',
          make: 'Ford',
          model: 'F-150',
          modelYear: 2022,
          year: 2022,
          status: 'Maintenance'
        },
        {
          id: 'vehicle-012',
          fleetId: 'fleet-003',
          vin: '3GCUKREC7EG123456',
          plateNumber: 'SVC-1003',
          make: 'Chevrolet',
          model: 'Silverado',
          modelYear: 2024,
          year: 2024,
          status: 'Available'
        }
      ]
    }
  ];

  private fleets: FleetDetail[] = [...this.mockFleets];
  private nextFleetId = 4;
  private nextVehicleId = 13;

  getFleets(): FleetSummary[] {
    return this.fleets.map(f => ({
      id: f.id,
      name: f.name,
      description: f.description,
      vehicleCount: f.vehicles.length,
      status: f.status,
      updatedOn: f.updatedOn
    }));
  }

  getFleetDetail(fleetId: string): FleetDetail | null {
    return this.fleets.find(f => f.id === fleetId) || null;
  }

  createFleet(payload: { name: string; description?: string; status?: 'Active' | 'Inactive' }): FleetSummary {
    const newFleet: FleetDetail = {
      id: `fleet-${String(this.nextFleetId++).padStart(3, '0')}`,
      name: payload.name,
      description: payload.description,
      vehicleCount: 0,
      status: payload.status || 'Active',
      updatedOn: new Date().toISOString(),
      vehicles: []
    };
    this.fleets.unshift(newFleet);
    return {
      id: newFleet.id,
      name: newFleet.name,
      description: newFleet.description,
      vehicleCount: newFleet.vehicleCount,
      status: newFleet.status,
      updatedOn: newFleet.updatedOn
    };
  }

  updateFleet(fleetId: string, payload: { name: string; description?: string; status?: 'Active' | 'Inactive' }): FleetSummary | null {
    const fleet = this.fleets.find(f => f.id === fleetId);
    if (!fleet) return null;
    
    fleet.name = payload.name;
    fleet.description = payload.description;
    fleet.status = payload.status || fleet.status;
    fleet.updatedOn = new Date().toISOString();
    
    return {
      id: fleet.id,
      name: fleet.name,
      description: fleet.description,
      vehicleCount: fleet.vehicles.length,
      status: fleet.status,
      updatedOn: fleet.updatedOn
    };
  }

  deleteFleet(fleetId: string): boolean {
    const index = this.fleets.findIndex(f => f.id === fleetId);
    if (index > -1) {
      this.fleets.splice(index, 1);
      return true;
    }
    return false;
  }

  addVehicle(fleetId: string, payload: {
    vin: string;
    plateNumber: string;
    make?: string | null;
    model?: string | null;
    modelYear: number;
    status?: VehicleStatus;
  }): VehicleSummary | null {
    const fleet = this.fleets.find(f => f.id === fleetId);
    if (!fleet) return null;

    const newVehicle: VehicleSummary = {
      id: `vehicle-${String(this.nextVehicleId++).padStart(3, '0')}`,
      fleetId,
      vin: payload.vin,
      plateNumber: payload.plateNumber,
      make: payload.make,
      model: payload.model,
      modelYear: payload.modelYear,
      year: payload.modelYear,
      status: payload.status || 'Available'
    };
    fleet.vehicles.push(newVehicle);
    fleet.vehicleCount = fleet.vehicles.length;
    return newVehicle;
  }

  updateVehicleStatus(vehicleId: string, status: VehicleStatus): VehicleSummary | null {
    for (const fleet of this.fleets) {
      const vehicle = fleet.vehicles.find(v => v.id === vehicleId);
      if (vehicle) {
        vehicle.status = status;
        return vehicle;
      }
    }
    return null;
  }

  deleteVehicle(vehicleId: string): boolean {
    for (const fleet of this.fleets) {
      const index = fleet.vehicles.findIndex(v => v.id === vehicleId);
      if (index > -1) {
        fleet.vehicles.splice(index, 1);
        fleet.vehicleCount = fleet.vehicles.length;
        return true;
      }
    }
    return false;
  }
}

