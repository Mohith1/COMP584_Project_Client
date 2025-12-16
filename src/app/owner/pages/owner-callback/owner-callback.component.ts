import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { OwnerAuthService } from '../../../core/services/owner-auth.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-owner-callback',
  template: `
    <div class="callback-container">
      <div class="loader">
        <mat-spinner diameter="48"></mat-spinner>
        <p>{{ message }}</p>
      </div>
    </div>
  `,
  styles: [`
    .callback-container {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
    }
    .loader {
      text-align: center;
      color: #fff;
    }
    .loader p {
      margin-top: 1.5rem;
      font-size: 1.1rem;
      color: rgba(255, 255, 255, 0.8);
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OwnerCallbackComponent implements OnInit {
  message = 'Completing authentication...';

  constructor(
    private readonly ownerAuth: OwnerAuthService,
    private readonly router: Router,
    private readonly route: ActivatedRoute,
    private readonly toast: ToastService
  ) {}

  async ngOnInit(): Promise<void> {
    try {
      // Check if this is a registration callback
      const action = this.route.snapshot.queryParams['action'];
      const isRegistration = action === 'register' || this.ownerAuth.hasPendingRegistration();

      // Wait for Auth0 to process the callback
      const isAuthenticated = await this.ownerAuth.isAuth0Authenticated();

      if (!isAuthenticated) {
        this.toast.error('Authentication failed. Please try again.');
        this.router.navigate(['/owner/login']);
        return;
      }

      if (isRegistration) {
        this.message = 'Creating your account...';
        // Complete the registration process
        this.ownerAuth.completeRegistration().subscribe({
          next: (owner) => {
            if (owner) {
              this.toast.success('Registration successful! Welcome aboard.');
              this.router.navigate(['/owner/dashboard']);
            } else {
              // No pending registration, just sync with existing profile
              this.syncAndNavigate();
            }
          },
          error: (err) => {
            const message = err?.error?.message || 'Registration failed. Please try again.';
            this.toast.error(message);
            this.router.navigate(['/owner/register']);
          }
        });
      } else {
        // Regular login - sync with backend and navigate
        this.syncAndNavigate();
      }
    } catch (error) {
      console.error('Callback error:', error);
      this.toast.error('Authentication failed. Please try again.');
      this.router.navigate(['/owner/login']);
    }
  }

  private syncAndNavigate(): void {
    this.message = 'Loading your profile...';
    this.ownerAuth.syncWithAuth0().subscribe({
      next: (owner) => {
        if (owner) {
          this.toast.success('Welcome back!');
          this.router.navigate(['/owner/dashboard']);
        } else {
          // No owner profile exists - redirect to registration
          this.toast.info('Please complete your registration.');
          this.router.navigate(['/owner/register']);
        }
      },
      error: () => {
        // Profile doesn't exist, redirect to registration
        this.toast.info('Please complete your registration.');
        this.router.navigate(['/owner/register']);
      }
    });
  }
}

