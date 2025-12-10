import { ChangeDetectionStrategy, Component } from '@angular/core';
import { OktaAuthFacade } from '../../../core/services/okta-auth.facade';

@Component({
  selector: 'app-user-login',
  templateUrl: './user-login.component.html',
  styleUrls: ['./user-login.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UserLoginComponent {
  constructor(private readonly oktaFacade: OktaAuthFacade) {}

  login() {
    this.oktaFacade.login('/user/vehicles');
  }
}










