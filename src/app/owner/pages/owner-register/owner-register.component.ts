import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { OwnerAuthService } from '../../../core/services/owner-auth.service';
import { CityService, City, Country } from '../../../core/services/city.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-owner-register',
  templateUrl: './owner-register.component.html',
  styleUrls: ['./owner-register.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OwnerRegisterComponent implements OnInit {
  countries: Country[] = [];
  cities: City[] = [];
  isLoadingCities = false;

  registerForm = this.fb.group({
    companyName: ['', [Validators.required, Validators.maxLength(128)]],
    primaryContactName: ['', [Validators.required, Validators.maxLength(64)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(12)]],
    confirmPassword: [''],
    countryId: [''],
    cityId: ['', Validators.required],
    phoneNumber: ['']
  });

  constructor(
    private readonly fb: FormBuilder,
    private readonly ownerAuth: OwnerAuthService,
    private readonly router: Router,
    private readonly cityService: CityService,
    private readonly toast: ToastService
  ) {}

  ngOnInit(): void {
    this.loadCountries();
    // Don't load cities until a country is selected
    this.cities = [];
  }

  loadCountries(): void {
    this.cityService.getCountries().subscribe((countries) => {
      this.countries = countries;
    });
  }

  onCountryChange(countryId: string): void {
    // Reset city selection when country changes
    this.registerForm.patchValue({ cityId: '' });
    
    if (countryId) {
      // Load cities for the selected country (e.g., USA)
      this.isLoadingCities = true;
      this.cityService.getCitiesByCountry(countryId).subscribe((cities) => {
        this.cities = cities;
        this.isLoadingCities = false;
      });
    } else {
      // If no country selected, clear cities
      this.cities = [];
    }
  }

  submit() {
    if (this.registerForm.invalid) {
      return;
    }
    const formValue = this.registerForm.value;
    const payload = {
      companyName: formValue.companyName ?? '',
      primaryContactName: formValue.primaryContactName ?? '',
      email: formValue.email ?? '',
      password: formValue.password ?? '',
      confirmPassword: formValue.confirmPassword ?? formValue.password ?? '',
      cityId: formValue.cityId ?? '',
      phoneNumber: formValue.phoneNumber || undefined
    };
    this.ownerAuth.register(payload).subscribe({
      next: () => {
        this.toast.success('Registration successful! Redirecting to dashboard...');
        this.router.navigate(['/owner/dashboard']);
      },
      error: (err) => {
        console.error('Registration failed:', err);
        const errorMessage = err?.error?.title || err?.error?.message || err?.message || 'Registration failed. Please try again.';
        this.toast.error(errorMessage);
      }
    });
  }
}
