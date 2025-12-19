import { ChangeDetectionStrategy, Component, OnInit, signal } from '@angular/core';
import { FormBuilder, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { OwnerAuthService } from '../../../core/services/owner-auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { CityService, City, Country } from '../../../core/services/city.service';

@Component({
  selector: 'app-owner-register',
  templateUrl: './owner-register.component.html',
  styleUrls: ['./owner-register.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OwnerRegisterComponent implements OnInit {
  hidePassword = true;
  hideConfirmPassword = true;
  isLoading = signal(false);
  isAuth0Authenticated = signal(false);
  
  countries = signal<Country[]>([]);
  cities = signal<City[]>([]);  // Start empty, load from API first
  citiesLoading = signal(true);
  
  registerForm = this.fb.group({
    companyName: ['', [Validators.required, Validators.maxLength(128)]],
    primaryContactName: ['', [Validators.required, Validators.maxLength(128)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', [Validators.required]],
    countryId: [''],
    cityId: [''],  // Optional - server may not have cities
    phoneNumber: ['']
  }, { validators: this.passwordMatchValidator });

  constructor(
    private readonly fb: FormBuilder,
    private readonly ownerAuth: OwnerAuthService,
    private readonly cityService: CityService,
    private readonly router: Router,
    private readonly toast: ToastService
  ) {}

  async ngOnInit(): Promise<void> {
    this.loadCountries();
    this.loadCities();
    
    // Check if user is already authenticated with Auth0
    const isAuth = await this.ownerAuth.isAuth0Authenticated();
    this.isAuth0Authenticated.set(isAuth);
    
    if (isAuth) {
      // User is already logged in - make password fields optional
      console.log('📝 User already authenticated with Auth0, password not required');
      this.registerForm.get('password')?.clearValidators();
      this.registerForm.get('confirmPassword')?.clearValidators();
      this.registerForm.get('password')?.updateValueAndValidity();
      this.registerForm.get('confirmPassword')?.updateValueAndValidity();
    }
  }

  private loadCountries(): void {
    this.cityService.getCountries().subscribe({
      next: (countries) => {
        this.countries.set(countries);
      },
      error: () => {
        // Error already handled in service, just ensure empty array
        this.countries.set([]);
      }
    });
  }

  private loadCities(countryId?: string): void {
    this.citiesLoading.set(true);
    this.cityService.getCities(countryId).subscribe({
      next: (cities) => {
        this.cities.set(cities || []);
        this.citiesLoading.set(false);
      },
      error: () => {
        this.cities.set([]);
        this.citiesLoading.set(false);
      }
    });
  }

  onCountryChange(countryId: string): void {
    this.registerForm.patchValue({ cityId: '' });
    this.loadCities(countryId || undefined);
  }

  passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password');
    const confirmPassword = control.get('confirmPassword');
    
    if (password && confirmPassword && password.value !== confirmPassword.value) {
      confirmPassword.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }
    return null;
  }

  onSubmit(): void {
    if (this.registerForm.invalid || this.isLoading()) {
      // Mark all fields as touched to show validation errors
      this.registerForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    const formValue = this.registerForm.value;

    const payload = {
      companyName: formValue.companyName!,
      primaryContactName: formValue.primaryContactName!,
      email: formValue.email!,
      password: formValue.password || '',
      confirmPassword: formValue.confirmPassword || '',
      cityId: formValue.cityId!,
      phoneNumber: formValue.phoneNumber || undefined
    };

    // If already authenticated with Auth0, create profile directly
    if (this.isAuth0Authenticated()) {
      console.log('📝 Creating owner profile for authenticated user...');
      this.ownerAuth.createProfile(payload).subscribe({
        next: (owner) => {
          this.isLoading.set(false);
          this.toast.success('Registration complete! Welcome aboard.');
          console.log('📝 Owner profile created:', owner?.companyName);
          this.router.navigate(['/owner/dashboard']);
        },
        error: (err: unknown) => {
          this.isLoading.set(false);
          const error = err as HttpErrorResponse | { error?: { message?: string }, status?: number };
          console.error('📝 Failed to create profile:', error);
          
          // Handle CORS/network errors (status 0)
          if ((error as HttpErrorResponse)?.status === 0 || !(error as HttpErrorResponse)?.status) {
            const message = 'Unable to connect to server. This may be a CORS configuration issue. Please try again or contact support.';
            this.toast.error(message);
            // Don't redirect or logout - keep user on registration page so they can retry
            return;
          }
          
          // Handle server errors (500, etc.)
          const status = (error as HttpErrorResponse)?.status || (error as { status?: number })?.status;
          if (status === 500) {
            this.toast.error('Server error occurred. Please try again or contact support.');
            return;
          }
          
          // Handle other errors (400, 401, etc.)
          const message = (error as { error?: { message?: string } })?.error?.message || 'Registration failed. Please try again.';
          this.toast.error(message);
          // Don't logout - keep user authenticated with Auth0 so they can retry
        }
      });
      return;
    }

    // Not authenticated - go through Auth0 signup flow
    try {
      // This will store the registration data and redirect to Auth0
      this.ownerAuth.initiateRegistration(payload);
      // The page will redirect, so we don't need to handle success here
    } catch (err: unknown) {
      this.isLoading.set(false);
      const error = err as { error?: { message?: string } };
      const message = error?.error?.message || 'Registration failed. Please try again.';
      this.toast.error(message);
    }
  }
}
