import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { OwnerAuthService } from '../../../core/services/owner-auth.service';
import { CityService, Country } from '../../../core/services/city.service';

@Component({
  selector: 'app-owner-login',
  templateUrl: './owner-login.component.html',
  styleUrls: ['./owner-login.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OwnerLoginComponent implements OnInit {
  countries: Country[] = [];
  showPassword = false;
  showPasswordRules = false;

  loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
    countryId: ['']
  });

  constructor(
    private readonly fb: FormBuilder,
    private readonly ownerAuth: OwnerAuthService,
    private readonly router: Router,
    private readonly cityService: CityService
  ) {}

  ngOnInit(): void {
    this.loadCountries();
  }

  loadCountries(): void {
    this.cityService.getCountries().subscribe((countries) => {
      this.countries = countries;
    });
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  onPasswordBlur(): void {
    // Hide password rules when field loses focus
    setTimeout(() => {
      this.showPasswordRules = false;
    }, 300);
  }

  submit() {
    if (this.loginForm.invalid) {
      return;
    }
    const formValue = this.loginForm.value;
    const credentials = {
      email: formValue.email ?? '',
      password: formValue.password ?? ''
    };
    this.ownerAuth.login(credentials).subscribe(() => {
      this.router.navigate(['/owner/dashboard']);
    });
  }
}

