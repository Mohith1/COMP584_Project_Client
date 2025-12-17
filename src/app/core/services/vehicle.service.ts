import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import {
  UpsertVehicleRequest,
  VehicleSummary,
  VehicleStatus
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

  addVehicle(fleetId: string, payload: UpsertVehicleRequest): Observable<VehicleSummary> {
    if (this.useMockData) {
      const vehicle = this.mockData.addVehicle(fleetId, payload);
      if (vehicle) {
        return of(vehicle);
      }
      throw new Error('Fleet not found');
    }

    return this.http.post<VehicleSummary>(
      `${this.baseUrl}/api/Fleets/${fleetId}/vehicles`,
      payload
    ).pipe(
      map(response => ({
        ...response,
        year: response.modelYear // Add legacy 'year' field for template compatibility
      })),
      catchError(() => {
        console.log('📦 Using mock add vehicle (backend unavailable)');
        this.useMockData = true;
        const vehicle = this.mockData.addVehicle(fleetId, payload);
        if (vehicle) {
          return of(vehicle);
        }
        throw new Error('Fleet not found');
      })
    );
  }

  updateVehicle(vehicleId: string, payload: UpsertVehicleRequest): Observable<VehicleSummary> {
    if (this.useMockData) {
      // For mock, just return the payload as the updated vehicle
      return of({
        id: vehicleId,
        fleetId: '',
        ...payload,
        year: payload.modelYear,
        status: payload.status || 'Available'
      });
    }

    return this.http.put<VehicleSummary>(
      `${this.baseUrl}/api/Vehicles/${vehicleId}`,
      payload
    ).pipe(
      map(response => ({
        ...response,
        year: response.modelYear // Add legacy 'year' field for template compatibility
      })),
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

    return this.http.put<VehicleSummary>(
      `${this.baseUrl}/api/Vehicles/${vehicleId}`,
      { status }
    ).pipe(
      map(response => ({
        ...response,
        year: response.modelYear // Add legacy 'year' field for template compatibility
      })),
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


