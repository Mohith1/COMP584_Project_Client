import { ChangeDetectionStrategy, Component, OnDestroy, OnInit } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { OwnerAuthService } from '../../../core/services/owner-auth.service';
import { TelemetryService } from '../../../core/services/telemetry.service';
import { OwnerStateService } from '../../../core/state/owner-state.service';
import { FleetService } from '../../../core/services/fleet.service';

@Component({
  selector: 'app-owner-dashboard',
  templateUrl: './owner-dashboard.component.html',
  styleUrls: ['./owner-dashboard.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OwnerDashboardComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();

  readonly owner = this.ownerState.owner;
  readonly telemetry = this.ownerState.telemetry;
  readonly fleets = this.ownerState.fleets;

  constructor(
    private readonly ownerAuth: OwnerAuthService,
    private readonly telemetryService: TelemetryService,
    private readonly ownerState: OwnerStateService,
    private readonly fleetService: FleetService
  ) {}

  ngOnInit(): void {
    const ownerId = this.ownerAuth.ownerId();
    if (!ownerId) {
      return;
    }

    this.fleetService
      .getFleets(ownerId)
      .pipe(takeUntil(this.destroy$))
      .subscribe((response) => this.ownerState.setFleets(response.data));

    this.telemetryService
      .pollOwnerTelemetry(ownerId, 15000)
      .pipe(takeUntil(this.destroy$))
      .subscribe((telemetry) => this.ownerState.setTelemetry(telemetry));
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}










