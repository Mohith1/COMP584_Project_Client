import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map } from 'rxjs/operators';
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
      `${this.baseUrl}/api/Fleets/${fleetId}/vehicles`,
      payload
    ).pipe(
      map(response => ({
        ...response,
        year: response.modelYear // Add legacy 'year' field for template compatibility
      }))
    );
  }

  updateVehicle(vehicleId: string, payload: UpsertVehicleRequest) {
    return this.http.put<VehicleSummary>(
      `${this.baseUrl}/api/Vehicles/${vehicleId}`,
      payload
    ).pipe(
      map(response => ({
        ...response,
        year: response.modelYear // Add legacy 'year' field for template compatibility
      }))
    );
  }

  updateStatus(vehicleId: string, status: VehicleStatus) {
    return this.http.put<VehicleSummary>(
      `${this.baseUrl}/api/Vehicles/${vehicleId}`,
      { status }
    ).pipe(
      map(response => ({
        ...response,
        year: response.modelYear // Add legacy 'year' field for template compatibility
      }))
    );
  }

  deleteVehicle(vehicleId: string) {
    return this.http
      .delete<void>(`${this.baseUrl}/api/Vehicles/${vehicleId}`)
      .pipe(map(() => vehicleId));
  }
}


