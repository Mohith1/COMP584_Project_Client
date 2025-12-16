import { VehicleSummary } from './vehicle.model';

export interface FleetSummary {
  id: string;
  name: string;
  description?: string;
  vehicleCount: number;
  status: 'Active' | 'Inactive';
  updatedOn?: string;
}

export interface FleetDetail extends FleetSummary {
  location?: string;
  vehicles: VehicleSummary[];
}

export interface UpsertFleetRequest {
  name: string;
  description?: string;
  status?: 'Active' | 'Inactive';
}












