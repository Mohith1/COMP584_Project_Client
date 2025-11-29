import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { FleetDetail, FleetSummary, UpsertFleetRequest } from '../models/fleet.model';
import { PaginationRequest, PaginatedResponse } from '../models/common.model';
import { OwnerAuthService } from './owner-auth.service';

@Injectable({
  providedIn: 'root'
})
export class FleetService {
  private readonly baseUrl = environment.apiUrl;

  constructor(
    private readonly http: HttpClient,
    private readonly ownerAuth: OwnerAuthService
  ) {}

  getFleets(ownerId: string, pagination?: PaginationRequest) {
    let params = new HttpParams();
    if (pagination) {
      params = params
        .set('page', pagination.page)
        .set('size', pagination.size);
    }

    return this.http.get<PaginatedResponse<FleetSummary>>(
      `${this.baseUrl}/api/owners/${ownerId}/fleets`,
      { params }
    );
  }

  getFleetDetail(fleetId: string) {
    return this.http.get<FleetDetail>(`${this.baseUrl}/api/fleets/${fleetId}`);
  }

  createFleet(ownerId: string, payload: UpsertFleetRequest) {
    return this.http.post<FleetSummary>(
      `${this.baseUrl}/api/owners/${ownerId}/fleets`,
      payload
    );
  }

  updateFleet(fleetId: string, payload: UpsertFleetRequest) {
    return this.http.put<FleetSummary>(
      `${this.baseUrl}/api/fleets/${fleetId}`,
      payload
    );
  }

  deleteFleet(fleetId: string) {
    return this.http
      .delete<void>(`${this.baseUrl}/api/fleets/${fleetId}`)
      .pipe(map(() => fleetId));
  }
}

