import { VehicleSummary } from './vehicle.model';

export interface FleetSummary {
  id: string;
  name: string;
  description?: string;
  ownerId: string;              // GUID - from server
  ownerName?: string;           // Optional - from server
  vehicleCount: number;
  status?: 'Active' | 'Inactive'; // Optional - server may not return
  createdAtUtc?: string;        // ISO 8601 - from server
  updatedAtUtc?: string;        // ISO 8601 - from server
  updatedOn?: string;           // Legacy field for compatibility
}

export interface FleetDetail extends FleetSummary {
  location?: string;
  vehicles: VehicleSummary[];
}

export interface CreateFleetRequest {
  name: string;
  description?: string;
  ownerId?: string;             // Optional - may be set from route
}

export interface UpdateFleetRequest {
  name: string;
  description?: string;
}

// Legacy alias for backward compatibility
export interface UpsertFleetRequest extends CreateFleetRequest {}













