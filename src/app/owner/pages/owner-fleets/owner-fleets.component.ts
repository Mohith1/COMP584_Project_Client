import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { finalize } from 'rxjs/operators';
import { OwnerAuthService } from '../../../core/services/owner-auth.service';
import { OwnerStateService } from '../../../core/state/owner-state.service';
import { FleetService } from '../../../core/services/fleet.service';
import { VehicleService } from '../../../core/services/vehicle.service';
import { ToastService } from '../../../core/services/toast.service';
import { FleetSummary, UpsertFleetRequest } from '../../../core/models/fleet.model';
import { VehicleSummary, VehicleStatus, UpsertVehicleRequest } from '../../../core/models/vehicle.model';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { vinValidator, normalizeVin, normalizePlate } from '../../../core/validators/vin.validator';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-owner-fleets',
  templateUrl: './owner-fleets.component.html',
  styleUrls: ['./owner-fleets.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OwnerFleetsComponent implements OnInit {
  readonly fleets = this.ownerState.fleets;
  readonly vehicles = this.ownerState.vehicles;
  readonly loading = this.ownerState.loading;

  selectedFleet: FleetSummary | null = null;
  totalFleets = 0;
  pageIndex = 0;
  pageSize = 5;

  currentYear = new Date().getFullYear();
  years: number[] = [];
  isSubmittingVehicle = false;
  isSubmittingFleet = false;

  fleetForm = this.fb.group({
    id: [''],
    name: ['', [Validators.required, Validators.maxLength(128)]],
    description: [''],
    status: ['Active', Validators.required]
  });

  vehicleForm = this.fb.group({
    vin: ['', [Validators.required, vinValidator()]],
    plateNumber: ['', [Validators.required, Validators.maxLength(16)]],
    make: ['', [Validators.maxLength(64)]],
    model: ['', [Validators.maxLength(64)]],
    year: [
      this.currentYear,
      [
        Validators.required,
        Validators.min(1900),
        Validators.max(this.currentYear + 1)
      ]
    ],
    status: ['Available' as VehicleStatus]
  });

  constructor(
    private readonly fb: FormBuilder,
    private readonly ownerAuth: OwnerAuthService,
    private readonly ownerState: OwnerStateService,
    private readonly fleetService: FleetService,
    private readonly vehicleService: VehicleService,
    private readonly dialog: MatDialog,
    private readonly toast: ToastService,
    private readonly cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // Generate years from 1900 to current year + 1
    for (let year = this.currentYear + 1; year >= 1900; year--) {
      this.years.push(year);
    }

    this.loadFleets();

    // Auto-normalize VIN input
    this.vehicleForm.get('vin')?.valueChanges.subscribe((value) => {
      if (value) {
        const normalized = normalizeVin(value);
        if (normalized !== value) {
          this.vehicleForm.get('vin')?.setValue(normalized, { emitEvent: false });
        }
      }
    });

    // Auto-normalize plate number input
    this.vehicleForm.get('plateNumber')?.valueChanges.subscribe((value) => {
      if (value) {
        const normalized = normalizePlate(value);
        if (normalized !== value) {
          this.vehicleForm.get('plateNumber')?.setValue(normalized, { emitEvent: false });
        }
      }
    });
  }

  loadFleets() {
    const ownerId = this.ownerAuth.ownerId();
    if (!ownerId) {
      return;
    }

    this.ownerState.setLoading(true);
    this.fleetService
      .getFleets(ownerId, {
        page: this.pageIndex + 1,
        size: this.pageSize
      })
      .pipe(finalize(() => this.ownerState.setLoading(false)))
      .subscribe((response) => {
        this.ownerState.setFleets(response.data);
        this.totalFleets = response.total;
        if (response.data.length && !this.selectedFleet) {
          this.selectFleet(response.data[0]);
        }
        this.cdr.markForCheck();
      });
  }

  selectFleet(fleet: FleetSummary) {
    this.selectedFleet = fleet;
    this.fleetForm.patchValue({
      id: fleet.id,
      name: fleet.name,
      description: fleet.description,
      status: fleet.status
    });
    this.loadFleetDetail(fleet.id);
    this.cdr.markForCheck();
  }

  clearSelection() {
    if (this.selectedFleet) {
      this.selectedFleet = null;
      this.ownerState.setVehicles([]);
      this.fleetForm.reset({
        status: 'Active'
      });
      this.vehicleForm.reset({
        year: this.currentYear,
        status: 'Available'
      });
      this.cdr.markForCheck();
    } else {
      // Already cleared, just reset forms
      this.fleetForm.reset({
        status: 'Active'
      });
      this.vehicleForm.reset({
        year: this.currentYear,
        status: 'Available'
      });
      this.cdr.markForCheck();
    }
  }

  saveFleet() {
    if (this.fleetForm.invalid || this.isSubmittingFleet) {
      return;
    }

    const ownerId = this.ownerAuth.ownerId();
    if (!ownerId) {
      return;
    }

    this.isSubmittingFleet = true;
    this.fleetForm.disable();

    const formValue = this.fleetForm.value;
    const { id, ...payload } = {
      ...formValue,
      name: formValue.name?.trim() || '',
      description: formValue.description?.trim() || undefined
    } as UpsertFleetRequest & {
      id?: string;
    };

    const request$ = id
      ? this.fleetService.updateFleet(id, payload)
      : this.fleetService.createFleet(ownerId, payload);

    request$.subscribe({
      next: (fleet) => {
        this.ownerState.upsertFleet(fleet);
        this.toast.success(`Fleet ${id ? 'updated' : 'created'} successfully.`);
        if (!id) {
          this.selectFleet(fleet);
        }
        this.isSubmittingFleet = false;
        this.fleetForm.enable();
        this.cdr.markForCheck();
      },
      error: (error: HttpErrorResponse) => {
        this.handleFleetError(error);
        this.isSubmittingFleet = false;
        this.fleetForm.enable();
        this.cdr.markForCheck();
      }
    });
  }

  private handleFleetError(error: HttpErrorResponse): void {
    // Handle duplicate fleet name
    if (error.status === 400 && error.error?.errors?.['name']) {
      const nameControl = this.fleetForm.get('name');
      if (nameControl) {
        nameControl.setErrors({
          serverError: error.error.errors['name'][0]
        });
      }
      this.toast.error(error.error.errors['name'][0]);
      return;
    }

    // Handle other validation errors
    if (error.status === 400 && error.error?.errors) {
      Object.keys(error.error.errors).forEach((field) => {
        const control = this.fleetForm.get(field);
        if (control) {
          control.setErrors({
            serverError: error.error.errors[field][0]
          });
        }
      });
      const message = error.error?.message || 'Validation failed. Please check the form.';
      this.toast.error(message);
      return;
    }

    // Handle other errors
    const message = error.error?.message || 'Failed to save fleet. Please try again.';
    this.toast.error(message);
  }

  deleteFleet(fleet: FleetSummary) {
    this.dialog
      .open(ConfirmDialogComponent, {
        data: {
          title: 'Delete fleet',
          message: `Delete ${fleet.name}? This cannot be undone.`,
          confirmLabel: 'Delete'
        }
      })
      .afterClosed()
      .subscribe((confirmed) => {
        if (!confirmed) {
          return;
        }
        this.fleetService.deleteFleet(fleet.id).subscribe(() => {
          this.ownerState.removeFleet(fleet.id);
          if (this.selectedFleet?.id === fleet.id) {
            this.clearSelection();
          }
          this.cdr.markForCheck();
        });
      });
  }

  submitVehicle() {
    if (this.vehicleForm.invalid || !this.selectedFleet || this.isSubmittingVehicle) {
      return;
    }

    this.isSubmittingVehicle = true;
    this.vehicleForm.disable();

    const formValue = this.vehicleForm.value;
    const payload: UpsertVehicleRequest = {
      vin: normalizeVin(formValue.vin ?? ''),
      plateNumber: normalizePlate(formValue.plateNumber ?? ''),
      make: formValue.make && formValue.make.trim() ? formValue.make.trim() : null,
      model: formValue.model && formValue.model.trim() ? formValue.model.trim() : null,
      modelYear: formValue.year ?? this.currentYear,
      status: (formValue.status ?? 'Available') as VehicleStatus
    };

    this.vehicleService.addVehicle(this.selectedFleet.id, payload).subscribe({
      next: (vehicle) => {
        this.ownerState.upsertVehicle(vehicle);
        this.toast.success(`Vehicle "${vehicle.vin}" added successfully!`);
        this.vehicleForm.reset({
          year: this.currentYear,
          status: 'Available'
        });
        this.isSubmittingVehicle = false;
        this.vehicleForm.enable();
        this.cdr.markForCheck();
      },
      error: (error: HttpErrorResponse) => {
        this.handleVehicleError(error);
        this.isSubmittingVehicle = false;
        this.vehicleForm.enable();
        this.cdr.markForCheck();
      }
    });
  }

  private handleVehicleError(error: HttpErrorResponse): void {
    // Handle duplicate VIN (409 Conflict)
    if (error.status === 409 && error.error?.errorCode === 'DUPLICATE_VIN') {
      const vinControl = this.vehicleForm.get('vin');
      if (vinControl) {
        vinControl.setErrors({
          duplicate: true,
          serverError: error.error.message || 'A vehicle with this VIN already exists.'
        });
      }
      this.toast.error(error.error.message || 'A vehicle with this VIN already exists.');
      return;
    }

    // Handle validation errors (400 Bad Request)
    if (error.status === 400 && error.error?.errors) {
      Object.keys(error.error.errors).forEach((field) => {
        const control = this.vehicleForm.get(field);
        if (control) {
          control.setErrors({
            serverError: error.error.errors[field][0]
          });
        }
      });
      const message = error.error?.message || 'Validation failed. Please check the form.';
      this.toast.error(message);
      return;
    }

    // Handle other errors
    const message = error.error?.message || 'Failed to add vehicle. Please try again.';
    this.toast.error(message);
  }

  get vinControl(): AbstractControl | null {
    return this.vehicleForm.get('vin');
  }

  get vinValidationMessage(): string {
    const vinControl = this.vinControl;
    if (!vinControl || !vinControl.value) return '';

    if (vinControl.errors?.['vinLength']) {
      const length = normalizeVin(vinControl.value).length;
      if (length < 11) {
        return `VIN too short (${length}/11 minimum)`;
      } else {
        return `VIN too long (${length}/17 maximum)`;
      }
    }

    if (vinControl.errors?.['vinFormat']) {
      return 'VIN contains invalid characters (I, O, or Q)';
    }

    if (vinControl.errors?.['duplicate']) {
      return vinControl.errors['serverError'] || 'This VIN already exists';
    }

    if (vinControl.errors?.['serverError']) {
      return vinControl.errors['serverError'];
    }

    return '';
  }

  // Expose normalizeVin for template
  normalizeVin = normalizeVin;

  handleVehicleStatusChange(event: {
    vehicle: VehicleSummary;
    status: VehicleStatus;
  }) {
    this.vehicleService
      .updateStatus(event.vehicle.id, event.status)
      .subscribe((vehicle) => {
        this.ownerState.upsertVehicle(vehicle);
        this.cdr.markForCheck();
      });
  }

  handleVehicleDelete(vehicle: VehicleSummary) {
    this.dialog
      .open(ConfirmDialogComponent, {
        data: {
          title: 'Remove vehicle',
          message: `Remove ${vehicle.vin}?`,
          confirmLabel: 'Remove'
        }
      })
      .afterClosed()
      .subscribe((confirmed) => {
        if (!confirmed) {
          return;
        }
        this.vehicleService.deleteVehicle(vehicle.id).subscribe(() => {
          this.ownerState.removeVehicle(vehicle.id);
          this.cdr.markForCheck();
        });
      });
  }

  handlePage(event: { pageIndex: number; pageSize: number }) {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadFleets();
  }

  private loadFleetDetail(fleetId: string) {
    this.fleetService.getFleetDetail(fleetId).subscribe((fleet) => {
      this.ownerState.setVehicles(fleet.vehicles);
      this.cdr.markForCheck();
    });
  }
}

