import { TelemetrySnapshot } from './telemetry.model';

export type VehicleStatus =
  | 'Available'
  | 'InTransit'
  | 'Maintenance'
  | 'Offline';

// VehicleStatus enum values as numbers (server format)
export enum VehicleStatusEnum {
  Available = 0,
  InTransit = 1,
  Maintenance = 2,
  Offline = 3
}

// Helper functions to convert between string and number status
export function statusStringToNumber(status: VehicleStatus): number {
  const map: Record<VehicleStatus, number> = {
    'Available': 0,
    'InTransit': 1,
    'Maintenance': 2,
    'Offline': 3
  };
  return map[status] ?? 0;
}

export function statusNumberToString(status: number): VehicleStatus {
  const map: Record<number, VehicleStatus> = {
    0: 'Available',
    1: 'InTransit',
    2: 'Maintenance',
    3: 'Offline'
  };
  return map[status] ?? 'Available';
}

export interface VehicleSummary {
  id: string;
  vin: string;
  plateNumber: string;
  make?: string | null;
  model?: string | null;
  modelYear: number;
  status: VehicleStatus | number;  // Server returns number, client uses string
  fleetId: string;
  fleetName?: string;              // Optional - from server
  ownerId?: string;                // Optional - from server
  createdAtUtc?: string;           // ISO 8601 - from server
  updatedAtUtc?: string;           // ISO 8601 - from server
  lastTelemetry?: TelemetrySnapshot;
  // Legacy field name for template compatibility - maps to modelYear
  year?: number;
}

export interface CreateVehicleRequest {
  vin: string;
  plateNumber: string;
  make?: string | null;
  model?: string | null;
  modelYear: number;
  status?: VehicleStatus | number; // Can be string or number
  fleetId?: string;                // Optional - may be set from route
  ownerId?: string;                // Optional - from server
}

export interface UpdateVehicleRequest {
  vin: string;
  plateNumber: string;
  make?: string | null;
  model?: string | null;
  modelYear: number;
  status?: VehicleStatus | number; // Can be string or number
}

// Legacy alias for backward compatibility
export interface UpsertVehicleRequest extends CreateVehicleRequest {}

export interface UpdateVehicleStatusRequest {
  vehicleId: string;
  status: VehicleStatus;
}


