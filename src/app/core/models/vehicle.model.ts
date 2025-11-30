import { TelemetrySnapshot } from './telemetry.model';

export type VehicleStatus =
  | 'Available'
  | 'InTransit'
  | 'Maintenance'
  | 'Offline';

export interface VehicleSummary {
  id: string;
  fleetId: string;
  vin: string;
  plateNumber: string;
  make?: string | null;
  model?: string | null;
  modelYear: number;
  status: VehicleStatus;
  lastTelemetry?: TelemetrySnapshot;
  // Legacy field name for template compatibility - maps to modelYear
  year?: number;
}

export interface UpsertVehicleRequest {
  vin: string;
  plateNumber: string;
  make?: string | null;
  model?: string | null;
  modelYear: number;
  status?: VehicleStatus;
}

export interface UpdateVehicleStatusRequest {
  vehicleId: string;
  status: VehicleStatus;
}


