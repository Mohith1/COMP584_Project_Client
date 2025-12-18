import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { FleetDetail, FleetSummary, CreateFleetRequest, UpdateFleetRequest } from '../models/fleet.model';
import {
  PaginationRequest,
  PaginatedResponse,
  ApiPaginatedResponse
} from '../models/common.model';
import { statusNumberToString } from '../models/vehicle.model';
import { OwnerAuthService } from './owner-auth.service';
import { MockDataService } from './mock-data.service';

@Injectable({
  providedIn: 'root'
})
export class FleetService {
  private readonly baseUrl = environment.apiUrl;
  private useMockData = false;

  constructor(
    private readonly http: HttpClient,
    private readonly ownerAuth: OwnerAuthService,
    private readonly mockData: MockDataService
  ) {}

  getFleets(
    ownerId: string | null,
    pagination?: PaginationRequest
  ): Observable<PaginatedResponse<FleetSummary>> {
    // Use mock data if no ownerId or if mock mode is enabled
    if (!ownerId || this.useMockData) {
      return this.getMockFleets(pagination);
    }

    let params = new HttpParams();
    if (pagination) {
      params = params.set('page', pagination.page).set('size', pagination.size);
    }

    return this.http
      .get<ApiPaginatedResponse<FleetSummary>>(
        `${this.baseUrl}/api/owners/${ownerId}/fleets`,
        { params }
      )
      .pipe(
        map((apiResponse) => ({
          data: apiResponse.items,
          total: apiResponse.totalCount,
          page: apiResponse.pageNumber,
          size: apiResponse.pageSize
        })),
        catchError(() => {
          console.log('📦 Using mock fleet data (backend unavailable)');
          this.useMockData = true;
          return this.getMockFleets(pagination);
        })
      );
  }

  private getMockFleets(
    pagination?: PaginationRequest
  ): Observable<PaginatedResponse<FleetSummary>> {
    const allFleets = this.mockData.getFleets();
    const page = pagination?.page || 1;
    const size = pagination?.size || 5;
    const start = (page - 1) * size;
    const end = start + size;

    return of({
      data: allFleets.slice(start, end),
      total: allFleets.length,
      page,
      size
    });
  }

  getFleetDetail(fleetId: string): Observable<FleetDetail> {
    if (this.useMockData) {
      return this.getMockFleetDetail(fleetId);
    }

    return this.http.get<FleetDetail>(`${this.baseUrl}/api/Fleets/${fleetId}`).pipe(
      map((fleet) => {
        const normalizedFleet = this.normalizeFleetResponse(fleet);
        return {
          ...normalizedFleet,
          vehicles: fleet.vehicles.map((vehicle) => {
            // Normalize vehicle status from number to string
            const status = typeof vehicle.status === 'number' 
              ? statusNumberToString(vehicle.status)
              : vehicle.status;
            return {
              ...vehicle,
              status,
              year: vehicle.modelYear // Add legacy 'year' field for template compatibility
            };
          })
        };
      }),
      catchError(() => {
        console.log('📦 Using mock fleet detail (backend unavailable)');
        this.useMockData = true;
        return this.getMockFleetDetail(fleetId);
      })
    );
  }

  private getMockFleetDetail(fleetId: string): Observable<FleetDetail> {
    const fleet = this.mockData.getFleetDetail(fleetId);
    if (fleet) {
      return of(fleet);
    }
    throw new Error('Fleet not found');
  }

  createFleet(ownerId: string | null, payload: CreateFleetRequest): Observable<FleetSummary> {
    if (!ownerId || this.useMockData) {
      const fleet = this.mockData.createFleet(payload);
      return of(fleet);
    }

    // Server accepts both routes: /api/owners/{ownerId}/fleets OR /api/Fleets
    // If ownerId is in payload, use /api/Fleets; otherwise use nested route
    const requestPayload = { ...payload };
    if (!requestPayload.ownerId) {
      requestPayload.ownerId = ownerId;
    }

    // Try nested route first (as per server guide)
    const url = `${this.baseUrl}/api/owners/${ownerId}/fleets`;
    
    return this.http
      .post<FleetSummary>(url, requestPayload)
      .pipe(
        map((fleet) => this.normalizeFleetResponse(fleet)),
        catchError(() => {
          console.log('📦 Using mock create fleet (backend unavailable)');
          this.useMockData = true;
          const fleet = this.mockData.createFleet(payload);
          return of(fleet);
        })
      );
  }

  updateFleet(fleetId: string, payload: UpdateFleetRequest): Observable<FleetSummary> {
    if (this.useMockData) {
      const fleet = this.mockData.updateFleet(fleetId, payload);
      if (fleet) {
        return of(fleet);
      }
      throw new Error('Fleet not found');
    }

    return this.http
      .put<FleetSummary>(`${this.baseUrl}/api/Fleets/${fleetId}`, payload)
      .pipe(
        map((fleet) => this.normalizeFleetResponse(fleet)),
        catchError(() => {
          console.log('📦 Using mock update fleet (backend unavailable)');
          this.useMockData = true;
          const fleet = this.mockData.updateFleet(fleetId, payload);
          if (fleet) {
            return of(fleet);
          }
          throw new Error('Fleet not found');
        })
      );
  }

  /**
   * Normalize fleet response from server to client format
   */
  private normalizeFleetResponse(fleet: FleetSummary): FleetSummary {
    return {
      ...fleet,
      updatedOn: fleet.updatedAtUtc || fleet.createdAtUtc || new Date().toISOString()
    };
  }

  deleteFleet(fleetId: string): Observable<string> {
    if (this.useMockData) {
      this.mockData.deleteFleet(fleetId);
      return of(fleetId);
    }

    return this.http
      .delete<void>(`${this.baseUrl}/api/Fleets/${fleetId}`)
      .pipe(
        map(() => fleetId),
        catchError(() => {
          console.log('📦 Using mock delete fleet (backend unavailable)');
          this.useMockData = true;
          this.mockData.deleteFleet(fleetId);
          return of(fleetId);
        })
      );
  }
}



