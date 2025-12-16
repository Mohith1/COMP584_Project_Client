import { ChangeDetectionStrategy, Component } from '@angular/core';
import { OktaAuthFacade } from '../../../core/services/okta-auth.facade';

@Component({
  selector: 'app-user-shell',
  templateUrl: './user-shell.component.html',
  styleUrls: ['./user-shell.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UserShellComponent {
  readonly navItems = [
    { label: 'Vehicles', icon: 'speed', link: '/user/vehicles' },
    { label: 'Profile', icon: 'person', link: '/user/profile' }
  ];

  constructor(private readonly oktaFacade: OktaAuthFacade) {}

  logout() {
    this.oktaFacade.logout();
  }
}












