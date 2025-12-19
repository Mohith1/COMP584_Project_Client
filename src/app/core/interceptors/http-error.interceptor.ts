import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest
} from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ToastService } from '../services/toast.service';

@Injectable()
export class HttpErrorInterceptor implements HttpInterceptor {
  constructor(private readonly toast: ToastService) {}

  intercept(
    req: HttpRequest<unknown>,
    next: HttpHandler
  ): Observable<HttpEvent<unknown>> {
    return next.handle(req).pipe(
      catchError((error: HttpErrorResponse) => {
        // Transform error to include additional context for component handling
        const enhancedError = this.enhanceError(error);
        this.presentError(enhancedError);
        return throwError(() => enhancedError);
      })
    );
  }

  private enhanceError(error: HttpErrorResponse): HttpErrorResponse {
    // Handle 409 Conflict (Duplicate VIN)
    if (error.status === 409 && error.error?.errorCode === 'DUPLICATE_VIN') {
      return {
        ...error,
        error: {
          ...error.error,
          field: 'vin',
          status: 409
        }
      } as HttpErrorResponse;
    }

    // Handle 400 Bad Request (Validation Errors)
    if (error.status === 400 && error.error?.errors) {
      return {
        ...error,
        error: {
          ...error.error,
          fieldErrors: error.error.errors
        }
      } as HttpErrorResponse;
    }

    return error;
  }

  private presentError(error: HttpErrorResponse) {
    const status = error.status;
    const url = error.url || '';
    
    // Skip error toasts for optional endpoints (Countries/Cities) - these are handled gracefully
    const isOptionalEndpoint = url.includes('/api/Countries') || url.includes('/api/Cities');
    if (isOptionalEndpoint && (status === 0 || status >= 400)) {
      return; // Don't show toast - service handles gracefully with empty arrays
    }
    
    // Handle CORS errors on registration endpoint - show user-friendly message
    if (status === 0 && url.includes('/api/Owners') && !url.includes('/api/Owners/me')) {
      this.toast.show('Unable to create profile: Server CORS configuration issue. Please contact support.', 'error');
      return;
    }
    
    const message =
      (error.error && (error.error.message || error.error.title)) ||
      error.message ||
      'Unexpected error';

    switch (status) {
      case 0:
        this.toast.show('Unable to reach server. Check network connectivity.', 'warn');
        break;
      case 400:
        // Don't show generic toast for validation errors - let forms handle it
        // Only show if there's a general message
        if (message && message !== 'Validation error') {
          this.toast.show(message, 'warn');
        }
        break;
      case 401:
        this.toast.show('Session expired. Please sign in again.', 'warn');
        break;
      case 403:
        this.toast.show('You do not have access to that resource.', 'warn');
        break;
      case 409:
        // Duplicate VIN - show the specific error message
        this.toast.show(message || 'A vehicle with this VIN already exists.', 'error');
        break;
      case 500:
        this.toast.show('Something went wrong on the server.', 'error');
        break;
      default:
        this.toast.show(message);
    }
  }
}


