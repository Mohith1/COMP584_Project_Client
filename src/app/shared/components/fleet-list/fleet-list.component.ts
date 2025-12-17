import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { FleetSummary } from '../../../core/models/fleet.model';

@Component({
  selector: 'app-fleet-list',
  templateUrl: './fleet-list.component.html',
  styleUrls: ['./fleet-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FleetListComponent {
  @Input() fleets: FleetSummary[] = [];
  @Input() selectedFleetId: string | null = null;
  @Input() showActions = true;

  @Output() create = new EventEmitter<void>();
  @Output() select = new EventEmitter<FleetSummary>();
  @Output() edit = new EventEmitter<FleetSummary>();
  @Output() remove = new EventEmitter<FleetSummary>();

  trackById(_index: number, fleet: FleetSummary) {
    return fleet.id;
  }
}













