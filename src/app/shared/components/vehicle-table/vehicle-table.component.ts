import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output
} from '@angular/core';
import { VehicleStatus, VehicleSummary } from '../../../core/models/vehicle.model';

@Component({
  selector: 'app-vehicle-table',
  templateUrl: './vehicle-table.component.html',
  styleUrls: ['./vehicle-table.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class VehicleTableComponent {
  @Input() vehicles: VehicleSummary[] = [];
  @Input() showActions = true;

  @Output() addVehicle = new EventEmitter<void>();
  @Output() deleteVehicle = new EventEmitter<VehicleSummary>();
  @Output() statusChange = new EventEmitter<{
    vehicle: VehicleSummary;
    status: VehicleStatus;
  }>();

  readonly displayedColumns = [
    'vin',
    'make',
    'status',
    'telemetry',
    'actions'
  ];

  readonly statuses: VehicleStatus[] = [
    'Active',
    'Inactive',
    'Maintenance',
    'Decommissioned'
  ];

  trackByVehicle(_index: number, vehicle: VehicleSummary) {
    return vehicle.id;
  }

  onStatusChange(vehicle: VehicleSummary, status: VehicleStatus) {
    this.statusChange.emit({ vehicle, status });
  }

  get columns(): string[] {
    return this.showActions
      ? this.displayedColumns
      : this.displayedColumns.filter((col) => col !== 'actions');
  }
}

