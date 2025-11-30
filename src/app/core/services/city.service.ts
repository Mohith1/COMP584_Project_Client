import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface Country {
  id: string;
  name: string;
  isoCode: string; // Changed from 'code' to match API reference
}

export interface City {
  id: string;
  name: string;
  countryId: string;
  countryName?: string;
  countryIsoCode?: string; // Added to match API reference
  timeZone?: string;
}

export interface CitiesResponse {
  items: City[];
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

@Injectable({
  providedIn: 'root'
})
export class CityService {
  private readonly baseUrl = environment.apiUrl;

  constructor(private readonly http: HttpClient) {}

  getCountries(): Observable<Country[]> {
    return this.http.get<Country[]>(`${this.baseUrl}/api/countries`).pipe(
      catchError(() => of([]))
    );
  }

  getCities(countryId?: string, search?: string): Observable<City[]> {
    let params = new HttpParams();
    if (countryId) {
      params = params.set('countryId', countryId);
    }
    if (search) {
      params = params.set('search', search);
    }

    return this.http.get<CitiesResponse>(`${this.baseUrl}/api/cities`, { params }).pipe(
      map(response => response.items),
      catchError(() => of([]))
    );
  }

  getCitiesByCountry(countryId: string): Observable<City[]> {
    return this.getCities(countryId);
  }

  searchCities(searchTerm: string): Observable<City[]> {
    return this.getCities(undefined, searchTerm);
  }
}
