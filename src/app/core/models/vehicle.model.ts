import { TelemetrySnapshot } from './telemetry.model';

export type VehicleStatus =
  | 'Active'
  | 'Inactive'
  | 'Maintenance'
  | 'Decommissioned';

export interface VehicleSummary {
  id: string;
  fleetId: string;
  vin: string;
  make: string;
  model: string;
  year: number;
  status: VehicleStatus;
  lastTelemetry?: TelemetrySnapshot;
}

export interface UpsertVehicleRequest {
  vin: string;
  make: string;
  model: string;
  year: number;
  status?: VehicleStatus;
}

export interface UpdateVehicleStatusRequest {
  vehicleId: string;
  status: VehicleStatus;
}

