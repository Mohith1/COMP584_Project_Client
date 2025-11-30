import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

type ToastType = 'info' | 'error' | 'warn' | 'success';

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  constructor(private snackBar: MatSnackBar) {}

  show(message: string, type: ToastType = 'info', duration = 4500): void {
    this.snackBar.open(message, 'Dismiss', {
      duration,
      panelClass: `toast-${type}`
    });
  }

  success(message: string, duration = 4500): void {
    this.show(message, 'success', duration);
  }

  error(message: string, duration = 6000): void {
    this.show(message, 'error', duration);
  }

  warn(message: string, duration = 5000): void {
    this.show(message, 'warn', duration);
  }

  info(message: string, duration = 4500): void {
    this.show(message, 'info', duration);
  }
}

