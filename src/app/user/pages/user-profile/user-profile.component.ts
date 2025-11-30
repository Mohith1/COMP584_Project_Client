import { ChangeDetectionStrategy, Component } from '@angular/core';
import { UserStateService } from '../../../core/state/user-state.service';

@Component({
  selector: 'app-user-profile',
  templateUrl: './user-profile.component.html',
  styleUrls: ['./user-profile.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UserProfileComponent {
  readonly profile = this.userState.profile;

  constructor(private readonly userState: UserStateService) {}
}



