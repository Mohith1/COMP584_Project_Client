import { ChangeDetectionStrategy, Component, OnInit, signal } from '@angular/core';
import { FormBuilder, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router } from '@angular/router';
import { OwnerAuthService } from '../../../core/services/owner-auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { CityService, City, Country } from '../../../core/services/city.service';

// Hardcoded US Metro Cities for when API doesn't return data
const US_METRO_CITIES: City[] = [
  { id: 'nyc-001', name: 'New York City', countryId: 'usa-001', countryName: 'United States', countryIsoCode: 'USA' },
  { id: 'la-002', name: 'Los Angeles', countryId: 'usa-001', countryName: 'United States', countryIsoCode: 'USA' },
  { id: 'chi-003', name: 'Chicago', countryId: 'usa-001', countryName: 'United States', countryIsoCode: 'USA' },
  { id: 'hou-004', name: 'Houston', countryId: 'usa-001', countryName: 'United States', countryIsoCode: 'USA' },
  { id: 'phx-005', name: 'Phoenix', countryId: 'usa-001', countryName: 'United States', countryIsoCode: 'USA' },
  { id: 'phi-006', name: 'Philadelphia', countryId: 'usa-001', countryName: 'United States', countryIsoCode: 'USA' },
  { id: 'sa-007', name: 'San Antonio', countryId: 'usa-001', countryName: 'United States', countryIsoCode: 'USA' },
  { id: 'sd-008', name: 'San Diego', countryId: 'usa-001', countryName: 'United States', countryIsoCode: 'USA' },
  { id: 'dal-009', name: 'Dallas', countryId: 'usa-001', countryName: 'United States', countryIsoCode: 'USA' },
  { id: 'sj-010', name: 'San Jose', countryId: 'usa-001', countryName: 'United States', countryIsoCode: 'USA' },
  { id: 'aus-011', name: 'Austin', countryId: 'usa-001', countryName: 'United States', countryIsoCode: 'USA' },
  { id: 'jax-012', name: 'Jacksonville', countryId: 'usa-001', countryName: 'United States', countryIsoCode: 'USA' },
  { id: 'fw-013', name: 'Fort Worth', countryId: 'usa-001', countryName: 'United States', countryIsoCode: 'USA' },
  { id: 'col-014', name: 'Columbus', countryId: 'usa-001', countryName: 'United States', countryIsoCode: 'USA' },
  { id: 'cha-015', name: 'Charlotte', countryId: 'usa-001', countryName: 'United States', countryIsoCode: 'USA' },
  { id: 'ind-016', name: 'Indianapolis', countryId: 'usa-001', countryName: 'United States', countryIsoCode: 'USA' },
  { id: 'sf-017', name: 'San Francisco', countryId: 'usa-001', countryName: 'United States', countryIsoCode: 'USA' },
  { id: 'sea-018', name: 'Seattle', countryId: 'usa-001', countryName: 'United States', countryIsoCode: 'USA' },
  { id: 'den-019', name: 'Denver', countryId: 'usa-001', countryName: 'United States', countryIsoCode: 'USA' },
  { id: 'dc-020', name: 'Washington D.C.', countryId: 'usa-001', countryName: 'United States', countryIsoCode: 'USA' },
  { id: 'bos-021', name: 'Boston', countryId: 'usa-001', countryName: 'United States', countryIsoCode: 'USA' },
  { id: 'mia-022', name: 'Miami', countryId: 'usa-001', countryName: 'United States', countryIsoCode: 'USA' },
  { id: 'atl-023', name: 'Atlanta', countryId: 'usa-001', countryName: 'United States', countryIsoCode: 'USA' },
  { id: 'lv-024', name: 'Las Vegas', countryId: 'usa-001', countryName: 'United States', countryIsoCode: 'USA' },
  { id: 'det-025', name: 'Detroit', countryId: 'usa-001', countryName: 'United States', countryIsoCode: 'USA' },
  { id: 'min-026', name: 'Minneapolis', countryId: 'usa-001', countryName: 'United States', countryIsoCode: 'USA' },
  { id: 'por-027', name: 'Portland', countryId: 'usa-001', countryName: 'United States', countryIsoCode: 'USA' },
  { id: 'nas-028', name: 'Nashville', countryId: 'usa-001', countryName: 'United States', countryIsoCode: 'USA' },
  { id: 'orl-029', name: 'Orlando', countryId: 'usa-001', countryName: 'United States', countryIsoCode: 'USA' },
  { id: 'bal-030', name: 'Baltimore', countryId: 'usa-001', countryName: 'United States', countryIsoCode: 'USA' }
];

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
    cityId: ['', Validators.required],
    phoneNumber: ['']
  }, { validators: this.passwordMatchValidator });

  constructor(
    private readonly fb: FormBuilder,
    private readonly ownerAuth: OwnerAuthService,
    private readonly cityService: CityService,
    private readonly router: Router,
    private readonly toast: ToastService
  ) {}

  ngOnInit(): void {
    this.loadCountries();
    this.loadCities();
  }

  private loadCountries(): void {
    this.cityService.getCountries().subscribe(countries => {
      this.countries.set(countries);
    });
  }

  private loadCities(countryId?: string): void {
    this.citiesLoading.set(true);
    this.cityService.getCities(countryId).subscribe({
      next: (cities) => {
        // Use API cities if available, otherwise fallback to hardcoded
        if (cities && cities.length > 0) {
          this.cities.set(cities);
        } else {
          // Only use hardcoded cities if API returns empty
          this.cities.set(US_METRO_CITIES);
        }
        this.citiesLoading.set(false);
      },
      error: () => {
        // On error, fallback to hardcoded cities
        this.cities.set(US_METRO_CITIES);
        this.citiesLoading.set(false);
      }
    });
  }

  onCountryChange(countryId: string): void {
    this.registerForm.patchValue({ cityId: '' });
    if (countryId) {
      this.loadCities(countryId);
    } else {
      // No country selected, show all US metro cities
      this.cities.set(US_METRO_CITIES);
    }
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
      password: formValue.password!,
      confirmPassword: formValue.confirmPassword!,
      cityId: formValue.cityId!,
      phoneNumber: formValue.phoneNumber || undefined
    };

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
