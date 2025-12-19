import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, timeout } from 'rxjs/operators';
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
      timeout(5000), // 5 second timeout
      catchError((err: HttpErrorResponse | Error) => {
        // CORS errors, network errors, or server errors - all result in empty array
        if (err instanceof HttpErrorResponse) {
          // Server responded with error (400, 401, 500, etc.)
          if (err.status === 0) {
            // CORS or network error (status 0)
            console.warn('Failed to load countries: CORS or network error');
          } else {
            console.warn(`Failed to load countries: ${err.status} ${err.statusText}`);
          }
        } else {
          // Timeout or other error
          console.warn('Failed to load countries: Request timeout or connection error');
        }
        return of([]); // Gracefully degrade - allow registration without countries
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
      timeout(5000), // 5 second timeout
      catchError((err: HttpErrorResponse | Error) => {
        // CORS errors, network errors, or server errors - all result in empty array
        if (err instanceof HttpErrorResponse) {
          // Server responded with error (400, 401, 500, etc.)
          if (err.status === 0) {
            // CORS or network error (status 0)
            console.warn('Failed to load cities: CORS or network error');
          } else {
            console.warn(`Failed to load cities: ${err.status} ${err.statusText}`);
          }
        } else {
          // Timeout or other error
          console.warn('Failed to load cities: Request timeout or connection error');
        }
        return of([]); // Gracefully degrade - allow registration without cities
      })
    );
  }

  getCitiesByCountry(countryId: string): Observable<City[]> {
    return this.getCities(countryId);
  }
}
