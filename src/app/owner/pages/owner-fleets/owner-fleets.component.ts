import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { finalize } from 'rxjs/operators';
import { OwnerAuthService } from '../../../core/services/owner-auth.service';
import { OwnerStateService } from '../../../core/state/owner-state.service';
import { FleetService } from '../../../core/services/fleet.service';
import { VehicleService } from '../../../core/services/vehicle.service';
import { ToastService } from '../../../core/services/toast.service';
import { FleetSummary, UpsertFleetRequest } from '../../../core/models/fleet.model';
import { VehicleSummary, VehicleStatus } from '../../../core/models/vehicle.model';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';

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

  fleetForm = this.fb.group({
    id: [''],
    name: ['', Validators.required],
    description: [''],
    status: ['Active', Validators.required]
  });

  vehicleForm = this.fb.group({
    vin: ['', Validators.required],
    make: ['', Validators.required],
    model: ['', Validators.required],
    year: [2024, [Validators.required]],
    status: ['Active' as VehicleStatus]
  });

  constructor(
    private readonly fb: FormBuilder,
    private readonly ownerAuth: OwnerAuthService,
    private readonly ownerState: OwnerStateService,
    private readonly fleetService: FleetService,
    private readonly vehicleService: VehicleService,
    private readonly dialog: MatDialog,
    private readonly toast: ToastService
  ) {}

  ngOnInit(): void {
    this.loadFleets();
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
  }

  clearSelection() {
    this.selectedFleet = null;
    this.ownerState.setVehicles([]);
    this.fleetForm.reset({
      status: 'Active'
    });
  }

  saveFleet() {
    if (this.fleetForm.invalid) {
      return;
    }
    const ownerId = this.ownerAuth.ownerId();
    if (!ownerId) {
      return;
    }
    const { id, ...payload } = this.fleetForm.value as UpsertFleetRequest & {
      id?: string;
    };

    const request$ = id
      ? this.fleetService.updateFleet(id, payload)
      : this.fleetService.createFleet(ownerId, payload);

    request$.subscribe((fleet) => {
      this.ownerState.upsertFleet(fleet);
      this.toast.show(
        `Fleet ${id ? 'updated' : 'created'} successfully.`,
        'info'
      );
      if (!id) {
        this.selectFleet(fleet);
      }
    });
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
        });
      });
  }

  submitVehicle() {
    if (this.vehicleForm.invalid || !this.selectedFleet) {
      return;
    }
    const payload = this.vehicleForm.value;
    this.vehicleService
      .addVehicle(this.selectedFleet.id, payload)
      .subscribe((vehicle) => {
        this.ownerState.upsertVehicle(vehicle);
        this.vehicleForm.reset({
          status: 'Active'
        });
      });
  }

  handleVehicleStatusChange(event: {
    vehicle: VehicleSummary;
    status: VehicleStatus;
  }) {
    this.vehicleService
      .updateStatus(event.vehicle.id, event.status)
      .subscribe((vehicle) => this.ownerState.upsertVehicle(vehicle));
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
    });
  }
}

