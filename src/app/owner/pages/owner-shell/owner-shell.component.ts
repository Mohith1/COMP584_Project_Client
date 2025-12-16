import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Router } from '@angular/router';
import { OwnerAuthService } from '../../../core/services/owner-auth.service';

@Component({
  selector: 'app-owner-shell',
  templateUrl: './owner-shell.component.html',
  styleUrls: ['./owner-shell.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OwnerShellComponent {
  readonly navItems = [
    { label: 'Dashboard', icon: 'dashboard', link: '/owner/dashboard' },
    { label: 'Fleets', icon: 'local_shipping', link: '/owner/fleets' },
    { label: 'Profile', icon: 'person', link: '/owner/profile' }
  ];

  constructor(
    private readonly ownerAuth: OwnerAuthService,
    private readonly router: Router
  ) {}

  async logout(): Promise<void> {
    await this.ownerAuth.logout();
    this.router.navigate(['/owner/login']);
  }
}












