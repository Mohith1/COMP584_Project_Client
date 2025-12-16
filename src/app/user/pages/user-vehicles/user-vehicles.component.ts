import { ChangeDetectionStrategy, Component, OnDestroy } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { filter, switchMap } from 'rxjs/operators';
import { toObservable } from '@angular/core/rxjs-interop';
import { TelemetryService } from '../../../core/services/telemetry.service';
import { TelemetrySnapshot } from '../../../core/models/telemetry.model';
import { UserStateService } from '../../../core/state/user-state.service';

@Component({
  selector: 'app-user-vehicles',
  templateUrl: './user-vehicles.component.html',
  styleUrls: ['./user-vehicles.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UserVehiclesComponent implements OnDestroy {
  telemetry: TelemetrySnapshot[] = [];

  private readonly destroy$ = new Subject<void>();

  constructor(
    private readonly telemetryService: TelemetryService,
    private readonly userState: UserStateService
  ) {
    toObservable(this.userState.ownerId)
      .pipe(
        filter((ownerId): ownerId is string => !!ownerId),
        switchMap((ownerId) =>
          this.telemetryService.pollOwnerTelemetry(ownerId, 20000)
        ),
        takeUntil(this.destroy$)
      )
      .subscribe((telemetry) => (this.telemetry = telemetry));
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}












