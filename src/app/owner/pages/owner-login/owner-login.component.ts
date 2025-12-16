import { ChangeDetectionStrategy, Component, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { OwnerAuthService } from '../../../core/services/owner-auth.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-owner-login',
  templateUrl: './owner-login.component.html',
  styleUrls: ['./owner-login.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OwnerLoginComponent implements OnInit {
  isLoading = signal(false);

  constructor(
    private readonly ownerAuth: OwnerAuthService,
    private readonly router: Router,
    private readonly toast: ToastService
  ) {}

  async ngOnInit(): Promise<void> {
    // Check if already authenticated
    const isAuth = await this.ownerAuth.isOktaAuthenticated();
    if (isAuth) {
      this.router.navigate(['/owner/dashboard']);
    }
  }

  async loginWithOkta(): Promise<void> {
    this.isLoading.set(true);
    try {
      await this.ownerAuth.loginWithOkta('/owner/login/callback');
    } catch (err) {
      this.isLoading.set(false);
      this.toast.error('Failed to redirect to login. Please try again.');
    }
  }
}
