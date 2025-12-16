import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { OwnerAuthService } from '../../../core/services/owner-auth.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-owner-login',
  templateUrl: './owner-login.component.html',
  styleUrls: ['./owner-login.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OwnerLoginComponent {
  hidePassword = true;
  isLoading = signal(false);

  loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
    rememberMe: [false]
  });

  constructor(
    private readonly fb: FormBuilder,
    private readonly ownerAuth: OwnerAuthService,
    private readonly router: Router,
    private readonly toast: ToastService
  ) {}

  onSubmit() {
    if (this.loginForm.invalid || this.isLoading()) {
      return;
    }

    this.isLoading.set(true);
    const { email, password, rememberMe } = this.loginForm.value;

    this.ownerAuth.login({ email: email!, password: password!, rememberMe: rememberMe ?? false })
      .subscribe({
        next: () => {
          this.toast.success('Login successful');
          this.router.navigate(['/owner/dashboard']);
        },
        error: (err) => {
          this.isLoading.set(false);
          const message = err?.error?.message || 'Invalid email or password';
          this.toast.error(message);
        }
      });
  }
}
