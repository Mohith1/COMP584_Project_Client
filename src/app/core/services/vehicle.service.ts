import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import {
  CreateVehicleRequest,
  UpdateVehicleRequest,
  VehicleSummary,
  VehicleStatus,
  statusStringToNumber,
  statusNumberToString
} from '../models/vehicle.model';
import { MockDataService } from './mock-data.service';

@Injectable({
  providedIn: 'root'
})
export class VehicleService {
  private readonly baseUrl = environment.apiUrl;
  private useMockData = false;

  constructor(
    private readonly http: HttpClient,
    private readonly mockData: MockDataService
  ) {}

  setMockMode(useMock: boolean): void {
    this.useMockData = useMock;
  }

  addVehicle(fleetId: string, payload: CreateVehicleRequest): Observable<VehicleSummary> {
    // Convert status to string for mock data compatibility
    const normalizedPayload = {
      ...payload,
      status: typeof payload.status === 'number' 
        ? statusNumberToString(payload.status)
        : (payload.status as VehicleStatus | undefined)
    };

    if (this.useMockData) {
      const vehicle = this.mockData.addVehicle(fleetId, normalizedPayload as any);
      if (vehicle) {
        return of(vehicle);
      }
      throw new Error('Fleet not found');
    }

    // Convert status from string to number if needed (server expects number)
    const serverPayload = {
      ...payload,
      fleetId, // Ensure fleetId is set
      status: typeof payload.status === 'string' 
        ? statusStringToNumber(payload.status as VehicleStatus)
        : payload.status ?? 0
    };

    return this.http.post<VehicleSummary>(
      `${this.baseUrl}/api/Fleets/${fleetId}/vehicles`,
      serverPayload
    ).pipe(
      map(response => this.normalizeVehicleResponse(response)),
      catchError(() => {
        console.log('📦 Using mock add vehicle (backend unavailable)');
        this.useMockData = true;
        const vehicle = this.mockData.addVehicle(fleetId, normalizedPayload as any);
        if (vehicle) {
          return of(vehicle);
        }
        throw new Error('Fleet not found');
      })
    );
  }

  updateVehicle(vehicleId: string, payload: UpdateVehicleRequest): Observable<VehicleSummary> {
    // Normalize status to string for consistency
    const normalizedStatus = typeof payload.status === 'number' 
      ? statusNumberToString(payload.status)
      : (payload.status as VehicleStatus | undefined);

    if (this.useMockData) {
      // For mock, just return the payload as the updated vehicle
      return of({
        id: vehicleId,
        fleetId: '',
        ...payload,
        year: payload.modelYear,
        status: (normalizedStatus || 'Available') as VehicleStatus
      });
    }

    // Convert status from string to number if needed (server expects number)
    const serverPayload = {
      ...payload,
      status: normalizedStatus 
        ? statusStringToNumber(normalizedStatus)
        : 0
    };

    return this.http.put<VehicleSummary>(
      `${this.baseUrl}/api/Vehicles/${vehicleId}`,
      serverPayload
    ).pipe(
      map(response => this.normalizeVehicleResponse(response)),
      catchError(() => {
        console.log('📦 Using mock update vehicle (backend unavailable)');
        this.useMockData = true;
        return of({
          id: vehicleId,
          fleetId: '',
          ...payload,
          year: payload.modelYear,
          status: payload.status || 'Available'
        });
      })
    );
  }

  updateStatus(vehicleId: string, status: VehicleStatus): Observable<VehicleSummary> {
    if (this.useMockData) {
      const vehicle = this.mockData.updateVehicleStatus(vehicleId, status);
      if (vehicle) {
        return of(vehicle);
      }
      throw new Error('Vehicle not found');
    }

    // Convert status from string to number (server expects number)
    const statusNumber = statusStringToNumber(status);

    return this.http.put<VehicleSummary>(
      `${this.baseUrl}/api/Vehicles/${vehicleId}`,
      { status: statusNumber }
    ).pipe(
      map(response => this.normalizeVehicleResponse(response)),
      catchError(() => {
        console.log('📦 Using mock update status (backend unavailable)');
        this.useMockData = true;
        const vehicle = this.mockData.updateVehicleStatus(vehicleId, status);
        if (vehicle) {
          return of(vehicle);
        }
        throw new Error('Vehicle not found');
      })
    );
  }

  /**
   * Normalize vehicle response from server (status as number) to client format (status as string)
   */
  private normalizeVehicleResponse(vehicle: VehicleSummary): VehicleSummary {
    // Convert status from number to string if needed
    const status = typeof vehicle.status === 'number' 
      ? statusNumberToString(vehicle.status)
      : vehicle.status;

    return {
      ...vehicle,
      status: status as VehicleStatus,
      year: vehicle.modelYear // Legacy field for template compatibility
    };
  }

  deleteVehicle(vehicleId: string): Observable<string> {
    if (this.useMockData) {
      this.mockData.deleteVehicle(vehicleId);
      return of(vehicleId);
    }

    return this.http
      .delete<void>(`${this.baseUrl}/api/Vehicles/${vehicleId}`)
      .pipe(
        map(() => vehicleId),
        catchError(() => {
          console.log('📦 Using mock delete vehicle (backend unavailable)');
          this.useMockData = true;
          this.mockData.deleteVehicle(vehicleId);
          return of(vehicleId);
        })
      );
  }
}


