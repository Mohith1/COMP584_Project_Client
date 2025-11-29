import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { OwnerAuthService } from '../../../core/services/owner-auth.service';

@Component({
  selector: 'app-owner-register',
  templateUrl: './owner-register.component.html',
  styleUrls: ['./owner-register.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OwnerRegisterComponent {
  registerForm = this.fb.group({
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
    companyName: ['', Validators.required],
    phoneNumber: ['']
  });

  constructor(
    private readonly fb: FormBuilder,
    private readonly ownerAuth: OwnerAuthService,
    private readonly router: Router
  ) {}

  submit() {
    if (this.registerForm.invalid) {
      return;
    }

    this.ownerAuth.register(this.registerForm.value).subscribe(() => {
      this.ownerAuth
        .login({
          email: this.registerForm.value.email!,
          password: this.registerForm.value.password!
        })
        .subscribe(() => this.router.navigate(['/owner/dashboard']));
    });
  }
}

