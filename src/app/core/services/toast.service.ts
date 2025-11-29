import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

type ToastType = 'info' | 'error' | 'warn';

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  constructor(private snackBar: MatSnackBar) {}

  show(message: string, type: ToastType = 'info', duration = 4500): void {
    this.snackBar.open(message, 'Dismiss', {
      duration,
      panelClass: type
    });
  }
}

