import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  UpsertVehicleRequest,
  VehicleSummary,
  VehicleStatus
} from '../models/vehicle.model';

@Injectable({
  providedIn: 'root'
})
export class VehicleService {
  private readonly baseUrl = environment.apiUrl;

  constructor(private readonly http: HttpClient) {}

  addVehicle(fleetId: string, payload: UpsertVehicleRequest) {
    return this.http.post<VehicleSummary>(
      `${this.baseUrl}/api/fleets/${fleetId}/vehicles`,
      payload
    );
  }

  updateVehicle(vehicleId: string, payload: UpsertVehicleRequest) {
    return this.http.put<VehicleSummary>(
      `${this.baseUrl}/api/vehicles/${vehicleId}`,
      payload
    );
  }

  updateStatus(vehicleId: string, status: VehicleStatus) {
    return this.http.put<VehicleSummary>(
      `${this.baseUrl}/api/vehicles/${vehicleId}`,
      { status }
    );
  }

  deleteVehicle(vehicleId: string) {
    return this.http
      .delete<void>(`${this.baseUrl}/api/vehicles/${vehicleId}`)
      .pipe(map(() => vehicleId));
  }
}

