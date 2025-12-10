import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { TelemetrySnapshot } from '../../../core/models/telemetry.model';

@Component({
  selector: 'app-telemetry-highlights',
  templateUrl: './telemetry-highlights.component.html',
  styleUrls: ['./telemetry-highlights.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TelemetryHighlightsComponent {
  @Input() telemetry: TelemetrySnapshot[] = [];

  get totalVehicles(): number {
    return this.telemetry.length;
  }

  get criticalAlerts(): number {
    return this.telemetry.filter((t) => t.status === 'Critical').length;
  }

  get averageSpeed(): number {
    if (!this.telemetry.length) {
      return 0;
    }
    const total = this.telemetry.reduce((sum, item) => sum + item.speed, 0);
    return Math.round(total / this.telemetry.length);
  }

  get lowFuelCount(): number {
    return this.telemetry.filter((t) => t.fuelLevel < 25).length;
  }

  get highlightedRows(): TelemetrySnapshot[] {
    return this.telemetry.slice(0, 5);
  }
}










