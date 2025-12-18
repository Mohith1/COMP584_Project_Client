import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { interval, switchMap, startWith, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { TelemetrySnapshot } from '../models/telemetry.model';

/**
 * Server TelemetryDto format (what server sends)
 */
interface ServerTelemetryDto {
  id: string;
  vehicleId: string;
  vehicleVin?: string;
  latitude: number;
  longitude: number;
  speedKph: number;
  fuelLevelPercentage: number;
  capturedAtUtc: string;
}

@Injectable({
  providedIn: 'root'
})
export class TelemetryService {
  private readonly baseUrl = environment.apiUrl;

  constructor(private readonly http: HttpClient) {}

  getOwnerTelemetry(ownerId: string) {
    return this.http.get<ServerTelemetryDto[]>(
      `${this.baseUrl}/api/owners/${ownerId}/vehicles/telemetry`
    ).pipe(
      // Map server DTO format to client format
      map((serverData) => serverData.map(dto => this.mapServerTelemetryToClient(dto)))
    );
  }

  pollOwnerTelemetry(ownerId: string, intervalMs = 30000) {
    return interval(intervalMs).pipe(
      startWith(0),
      switchMap(() => this.getOwnerTelemetry(ownerId))
    );
  }

  /**
   * Map server TelemetryDto to client TelemetrySnapshot format
   */
  private mapServerTelemetryToClient(dto: ServerTelemetryDto): TelemetrySnapshot {
    return {
      id: dto.id,
      vehicleId: dto.vehicleId,
      vehicleVin: dto.vehicleVin,
      speedKph: dto.speedKph,
      speed: dto.speedKph, // Legacy field
      fuelLevelPercentage: dto.fuelLevelPercentage,
      fuelLevel: dto.fuelLevelPercentage, // Legacy field
      latitude: dto.latitude,
      longitude: dto.longitude,
      capturedAtUtc: dto.capturedAtUtc,
      recordedOn: dto.capturedAtUtc, // Legacy field
      // Client-only fields (not from server)
      batteryHealth: undefined,
      status: 'Normal' as const,
      alert: undefined
    };
  }
}













