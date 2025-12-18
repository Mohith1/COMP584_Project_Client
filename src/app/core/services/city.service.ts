import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
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

@Injectable({
  providedIn: 'root'
})
export class CityService {
  private readonly baseUrl = environment.apiUrl;

  constructor(private readonly http: HttpClient) {}

  getCountries(): Observable<Country[]> {
    return this.http.get<Country[]>(`${this.baseUrl}/api/Countries`).pipe(
      catchError((err) => {
        console.warn('Failed to load countries:', err?.message);
        return of([]);
      })
    );
  }

  getCities(countryId?: string): Observable<City[]> {
    let params = new HttpParams();
    if (countryId) {
      params = params.set('countryId', countryId);
    }

    // API returns City[] directly (not paginated)
    return this.http.get<City[]>(`${this.baseUrl}/api/Cities`, { params }).pipe(
      catchError((err) => {
        console.warn('Failed to load cities:', err?.message);
        return of([]);
      })
    );
  }

  getCitiesByCountry(countryId: string): Observable<City[]> {
    return this.getCities(countryId);
  }
}
