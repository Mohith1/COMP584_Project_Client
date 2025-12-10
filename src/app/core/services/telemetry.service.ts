import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { interval, switchMap, startWith } from 'rxjs';
import { environment } from '../../../environments/environment';
import { TelemetrySnapshot } from '../models/telemetry.model';

@Injectable({
  providedIn: 'root'
})
export class TelemetryService {
  private readonly baseUrl = environment.apiUrl;

  constructor(private readonly http: HttpClient) {}

  getOwnerTelemetry(ownerId: string) {
    return this.http.get<TelemetrySnapshot[]>(
      `${this.baseUrl}/api/owners/${ownerId}/vehicles/telemetry`
    );
  }

  pollOwnerTelemetry(ownerId: string, intervalMs = 30000) {
    return interval(intervalMs).pipe(
      startWith(0),
      switchMap(() => this.getOwnerTelemetry(ownerId))
    );
  }
}










