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
        this.presentError(error);
        return throwError(() => error);
      })
    );
  }

  private presentError(error: HttpErrorResponse) {
    const status = error.status;
    const message =
      (error.error && (error.error.message || error.error.title)) ||
      error.message ||
      'Unexpected error';

    switch (status) {
      case 0:
        this.toast.show('Unable to reach server. Check network connectivity.', 'warn');
        break;
      case 400:
        this.toast.show(message || 'Validation error', 'warn');
        break;
      case 401:
        this.toast.show('Session expired. Please sign in again.', 'warn');
        break;
      case 403:
        this.toast.show('You do not have access to that resource.', 'warn');
        break;
      case 500:
        this.toast.show('Something went wrong on the server.', 'error');
        break;
      default:
        this.toast.show(message);
    }
  }
}

