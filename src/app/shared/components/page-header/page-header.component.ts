import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-page-header',
  templateUrl: './page-header.component.html',
  styleUrls: ['./page-header.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PageHeaderComponent {
  @Input() title = '';
  @Input() subtitle = '';
  @Input() primaryLabel = '';
  @Input() showPrimary = true;
  @Input() showBack = false;

  @Output() primary = new EventEmitter<void>();
  @Output() back = new EventEmitter<void>();
}













