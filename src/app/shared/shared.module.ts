import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { NgChartsModule } from 'ng2-charts';

import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialogModule } from '@angular/material/dialog';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';

import { FleetListComponent } from './components/fleet-list/fleet-list.component';
import { VehicleTableComponent } from './components/vehicle-table/vehicle-table.component';
import { TelemetryHighlightsComponent } from './components/telemetry-highlights/telemetry-highlights.component';
import { TelemetryChartComponent } from './components/telemetry-chart/telemetry-chart.component';
import { PageHeaderComponent } from './components/page-header/page-header.component';
import { ConfirmDialogComponent } from './components/confirm-dialog/confirm-dialog.component';

const MATERIAL_MODULES = [
  MatToolbarModule,
  MatSidenavModule,
  MatIconModule,
  MatListModule,
  MatButtonModule,
  MatCardModule,
  MatTableModule,
  MatPaginatorModule,
  MatFormFieldModule,
  MatInputModule,
  MatSelectModule,
  MatSnackBarModule,
  MatDialogModule,
  MatChipsModule,
  MatProgressSpinnerModule,
  MatMenuModule,
  MatDividerModule,
  MatTooltipModule
];

const COMPONENTS = [
  FleetListComponent,
  VehicleTableComponent,
  TelemetryHighlightsComponent,
  TelemetryChartComponent,
  PageHeaderComponent,
  ConfirmDialogComponent
];

@NgModule({
  declarations: [...COMPONENTS],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    NgChartsModule,
    ...MATERIAL_MODULES
  ],
  exports: [
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    NgChartsModule,
    ...MATERIAL_MODULES,
    ...COMPONENTS
  ]
})
export class SharedModule {}










