import { ChangeDetectionStrategy, Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { ChartConfiguration } from 'chart.js';
import { TelemetrySnapshot } from '../../../core/models/telemetry.model';

@Component({
  selector: 'app-telemetry-chart',
  templateUrl: './telemetry-chart.component.html',
  styleUrls: ['./telemetry-chart.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TelemetryChartComponent implements OnChanges {
  @Input() telemetry: TelemetrySnapshot[] = [];

  lineChartData: ChartConfiguration<'line'>['data'] = {
    labels: [],
    datasets: []
  };

  lineChartOptions: ChartConfiguration<'line'>['options'] = {
    responsive: true,
    plugins: {
      legend: {
        display: true
      }
    }
  };

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['telemetry']) {
      this.buildChartData();
    }
  }

  private buildChartData() {
    const latest = this.telemetry.slice(0, 10).reverse();
    this.lineChartData = {
      labels: latest.map((item) =>
        new Date(item.recordedOn).toLocaleTimeString()
      ),
      datasets: [
        {
          data: latest.map((item) => item.speed),
          label: 'Speed (km/h)',
          fill: false,
          borderColor: '#2563eb',
          tension: 0.3
        },
        {
          data: latest.map((item) => item.fuelLevel),
          label: 'Fuel (%)',
          fill: false,
          borderColor: '#f97316',
          tension: 0.3
        }
      ]
    };
  }
}











