import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { FleetDetail, FleetSummary, UpsertFleetRequest } from '../models/fleet.model';
import { PaginationRequest, PaginatedResponse, ApiPaginatedResponse } from '../models/common.model';
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

    return this.http.get<ApiPaginatedResponse<FleetSummary>>(
      `${this.baseUrl}/api/owners/${ownerId}/fleets`,
      { params }
    ).pipe(
      map(apiResponse => ({
        data: apiResponse.items,
        total: apiResponse.totalCount,
        page: apiResponse.pageNumber,
        size: apiResponse.pageSize
      }))
    );
  }

  getFleetDetail(fleetId: string) {
    return this.http.get<FleetDetail>(`${this.baseUrl}/api/Fleets/${fleetId}`).pipe(
      map(fleet => ({
        ...fleet,
        vehicles: fleet.vehicles.map(vehicle => ({
          ...vehicle,
          year: vehicle.modelYear // Add legacy 'year' field for template compatibility
        }))
      }))
    );
  }

  createFleet(ownerId: string, payload: UpsertFleetRequest) {
    return this.http.post<FleetSummary>(
      `${this.baseUrl}/api/owners/${ownerId}/fleets`,
      payload
    );
  }

  updateFleet(fleetId: string, payload: UpsertFleetRequest) {
    return this.http.put<FleetSummary>(
      `${this.baseUrl}/api/Fleets/${fleetId}`,
      payload
    );
  }

  deleteFleet(fleetId: string) {
    return this.http
      .delete<void>(`${this.baseUrl}/api/Fleets/${fleetId}`)
      .pipe(map(() => fleetId));
  }
}


