import { ChangeDetectionStrategy, Component, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '@auth0/auth0-angular';
import { filter, take } from 'rxjs/operators';
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
    private readonly toast: ToastService,
    private readonly auth0: AuthService
  ) {}

  ngOnInit(): void {
    // Subscribe to Auth0 authentication state
    // This will handle the callback when Auth0 redirects back with a code
    this.auth0.isAuthenticated$.pipe(
      filter((isAuth) => isAuth),
      take(1)
    ).subscribe(() => {
      console.log('✅ Auth0 authenticated, redirecting to dashboard...');
      this.router.navigate(['/owner/dashboard']);
    });
  }

  loginWithAuth0(): void {
    this.isLoading.set(true);
    // loginWithAuth0 triggers Auth0 redirect - no callback expected
    // The loading state will remain until redirect happens
    this.ownerAuth.loginWithAuth0();
  }
}
