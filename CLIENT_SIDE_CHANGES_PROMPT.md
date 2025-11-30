# Client-Side Changes Required - Implementation Prompt

## 🎯 Overview

The server-side has been enhanced with robust validation, duplicate detection, and improved error handling. The Angular client needs to be updated to properly handle these changes and provide a seamless user experience.

---

## 📋 Required Changes Summary

### 1. **Error Handling Updates**
- Handle new 409 Conflict status for duplicate VIN
- Update error message parsing for ValidationException responses
- Handle field-specific validation errors

### 2. **VIN Validation Updates**
- Implement client-side VIN validation matching server rules
- Auto-normalize VIN (uppercase, remove spaces/hyphens)
- Show real-time validation feedback
- Handle duplicate VIN errors (409 Conflict)

### 3. **Fleet Validation Updates**
- Handle duplicate fleet name errors
- Update validation messages to match server

### 4. **Vehicle Form Updates**
- Add model year validation (1900 to current+1)
- Enhance plate number validation
- Update error messages for all fields

### 5. **Data Normalization**
- Auto-uppercase VIN input
- Auto-uppercase plate number input
- Trim all string inputs before submission

---

## 🚀 Implementation Prompt

**Copy and use this prompt to implement the required client-side changes:**

---

### **PROMPT START**

Update the Angular client application to handle the enhanced server-side validation and error responses. Implement the following changes:

#### **1. Update Error Handling Service/Interceptor**

Create or update the HTTP error interceptor to handle:
- **409 Conflict** status for duplicate VIN errors
- **400 Bad Request** with field-specific validation errors
- Parse error responses with structure: `{ message: string, errors?: Record<string, string[]>, vin?: string, errorCode?: string }`

**Error Response Handling:**
```typescript
// Handle 409 Conflict (Duplicate VIN)
if (error.status === 409 && error.error?.errorCode === 'DUPLICATE_VIN') {
  // Return error with VIN and error code for form field binding
  return throwError(() => ({
    ...error.error,
    field: 'vin',
    status: 409
  }));
}

// Handle 400 Bad Request (Validation Errors)
if (error.status === 400 && error.error?.errors) {
  // Map field errors to form controls
  return throwError(() => ({
    ...error.error,
    fieldErrors: error.error.errors
  }));
}
```

#### **2. Update VIN Validator**

Update the VIN validator (`vin.validator.ts`) to match server-side validation exactly:

**Requirements:**
- Length: 11-17 characters (after normalization)
- Format: Alphanumeric only, no I, O, or Q
- Pattern: `/^[A-HJ-NPR-Z0-9]{11,17}$/`
- Normalization: Remove spaces and hyphens, convert to uppercase
- Real-time validation with clear error messages

**Implementation:**
```typescript
export function vinValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) {
      return null; // Let required validator handle empty
    }

    const vin = normalizeVin(control.value);
    
    if (vin.length < 11 || vin.length > 17) {
      return { 
        vinLength: { 
          value: control.value, 
          requiredLength: '11-17',
          actualLength: vin.length
        } 
      };
    }

    const vinPattern = /^[A-HJ-NPR-Z0-9]+$/;
    if (!vinPattern.test(vin)) {
      return { 
        vinFormat: { 
          value: control.value,
          message: 'VIN cannot contain letters I, O, or Q'
        } 
      };
    }

    return null;
  };
}

export function normalizeVin(vin: string): string {
  return vin.replace(/\s+/g, '').replace(/-/g, '').toUpperCase();
}
```

#### **3. Update Vehicle Form Component**

Update the Add Vehicle component to:

**A. Auto-normalize VIN input:**
```typescript
// In ngOnInit or constructor
this.vehicleForm.get('vin')?.valueChanges.subscribe(value => {
  if (value) {
    const normalized = normalizeVin(value);
    if (normalized !== value) {
      this.vehicleForm.get('vin')?.setValue(normalized, { emitEvent: false });
    }
  }
});
```

**B. Auto-normalize plate number:**
```typescript
this.vehicleForm.get('plateNumber')?.valueChanges.subscribe(value => {
  if (value) {
    const normalized = normalizePlate(value);
    if (normalized !== value) {
      this.vehicleForm.get('plateNumber')?.setValue(normalized, { emitEvent: false });
    }
  }
});
```

**C. Handle duplicate VIN error (409 Conflict):**
```typescript
onSubmit(): void {
  if (this.vehicleForm.valid && !this.isLoading) {
    this.isLoading = true;
    
    const request: CreateVehicleRequest = {
      vin: normalizeVin(this.vehicleForm.value.vin),
      plateNumber: normalizePlate(this.vehicleForm.value.plateNumber),
      make: this.vehicleForm.value.make?.trim() || null,
      model: this.vehicleForm.value.model?.trim() || null,
      modelYear: this.vehicleForm.value.modelYear,
      status: this.vehicleForm.value.status
    };

    this.vehicleService.addVehicle(this.fleetId, request).subscribe({
      next: (response) => {
        this.notification.showSuccess(`Vehicle "${response.vin}" added successfully!`);
        this.dialogRef.close(response);
      },
      error: (error) => {
        this.handleError(error);
        this.isLoading = false;
      }
    });
  }
}

private handleError(error: any): void {
  // Handle duplicate VIN (409 Conflict)
  if (error.status === 409 && error.error?.errorCode === 'DUPLICATE_VIN') {
    this.notification.showError(error.error.message);
    this.vin?.setErrors({ 
      duplicate: true,
      serverError: error.error.message 
    });
    return;
  }

  // Handle validation errors (400 Bad Request)
  if (error.status === 400 && error.error?.errors) {
    // Map server field errors to form controls
    Object.keys(error.error.errors).forEach(field => {
      const control = this.vehicleForm.get(field);
      if (control) {
        control.setErrors({ 
          serverError: error.error.errors[field][0] 
        });
      }
    });
    this.notification.showError(error.error.message || 'Validation failed');
    return;
  }

  // Handle other errors
  if (error.error?.message) {
    this.notification.showError(error.error.message);
  } else {
    this.notification.showError('Failed to add vehicle. Please try again.');
  }
}
```

**D. Update VIN input field in template:**
```html
<div class="form-group">
  <label for="vin">
    VIN (Vehicle Identification Number) <span class="required">*</span>
  </label>
  <input
    id="vin"
    type="text"
    formControlName="vin"
    placeholder="Enter 17-character VIN..."
    [class.error]="vin?.invalid && vin?.touched"
    maxlength="17"
    style="font-family: monospace; text-transform: uppercase;"
  />
  <div class="helper-text">
    ℹ️ Must be 11-17 characters, alphanumeric (no I, O, Q)
  </div>
  <div class="error-message" *ngIf="vin?.invalid && vin?.touched">
    <mat-icon>error</mat-icon>
    <span *ngIf="vin?.errors?.['required']">VIN is required.</span>
    <span *ngIf="vin?.errors?.['vinLength']">
      VIN must be 11-17 characters (currently {{ vin?.errors?.['vinLength']?.actualLength || 0 }}).
    </span>
    <span *ngIf="vin?.errors?.['vinFormat']">
      VIN cannot contain letters I, O, or Q.
    </span>
    <span *ngIf="vin?.errors?.['duplicate']">
      {{ vin?.errors?.['serverError'] }}
    </span>
    <span *ngIf="vin?.errors?.['serverError']">
      {{ vin?.errors?.['serverError'] }}
    </span>
  </div>
</div>
```

#### **4. Update Model Year Validation**

Add model year validation to match server (1900 to current+1):

```typescript
// In component
currentYear = new Date().getFullYear();
years: number[] = [];

constructor() {
  // Generate years from 1900 to current year + 1
  for (let year = this.currentYear + 1; year >= 1900; year--) {
    this.years.push(year);
  }
}

// In form initialization
modelYear: [this.currentYear, [Validators.required, Validators.min(1900), Validators.max(this.currentYear + 1)]]
```

#### **5. Update Fleet Form Component**

Update Create Fleet component to handle duplicate name errors:

```typescript
private handleError(error: any): void {
  // Handle duplicate fleet name
  if (error.status === 400 && error.error?.errors?.['name']) {
    this.name?.setErrors({ 
      serverError: error.error.errors['name'][0] 
    });
    this.notification.showError(error.error.errors['name'][0]);
    return;
  }

  // Handle other validation errors
  if (error.status === 400 && error.error?.message) {
    this.notification.showError(error.error.message);
    // Map field errors if present
    if (error.error.errors) {
      Object.keys(error.error.errors).forEach(field => {
        const control = this.fleetForm.get(field);
        if (control) {
          control.setErrors({ 
            serverError: error.error.errors[field][0] 
          });
        }
      });
    }
    return;
  }

  // Handle other errors
  this.notification.showError('Failed to create fleet. Please try again.');
}
```

#### **6. Update Error Messages in Templates**

Update all form templates to show server error messages:

```html
<!-- Example for any form field -->
<div class="error-message" *ngIf="fieldName?.invalid && fieldName?.touched">
  <mat-icon>error</mat-icon>
  <span *ngIf="fieldName?.errors?.['required']">This field is required.</span>
  <span *ngIf="fieldName?.errors?.['maxlength']">
    Maximum length exceeded.
  </span>
  <span *ngIf="fieldName?.errors?.['serverError']">
    {{ fieldName?.errors?.['serverError'] }}
  </span>
</div>
```

#### **7. Update Vehicle Service Error Handling**

Ensure the vehicle service properly handles and propagates errors:

```typescript
addVehicle(fleetId: string, request: CreateVehicleRequest): Observable<VehicleResponse> {
  return this.http.post<VehicleResponse>(
    `${this.apiUrl}/fleets/${fleetId}/vehicles`,
    request
  ).pipe(
    catchError(error => {
      // Let the error propagate with full details
      return throwError(() => error);
    })
  );
}
```

#### **8. Add Real-Time VIN Validation Feedback**

Show validation feedback as user types:

```typescript
// In component
get vinValidationMessage(): string {
  const vinControl = this.vin;
  if (!vinControl || !vinControl.value) return '';
  
  if (vinControl.errors?.['vinLength']) {
    const length = normalizeVin(vinControl.value).length;
    if (length < 11) {
      return `VIN too short (${length}/11 minimum)`;
    } else {
      return `VIN too long (${length}/17 maximum)`;
    }
  }
  
  if (vinControl.errors?.['vinFormat']) {
    return 'VIN contains invalid characters (I, O, or Q)';
  }
  
  if (vinControl.errors?.['duplicate']) {
    return vinControl.errors['serverError'] || 'This VIN already exists';
  }
  
  return '';
}
```

```html
<!-- In template -->
<div class="validation-feedback" *ngIf="vin?.value && vin?.invalid && vin?.touched">
  <span [class.error]="vin?.invalid">{{ vinValidationMessage }}</span>
</div>
```

#### **9. Update Status Enum Handling**

Ensure status values match server exactly:

```typescript
// In component
vehicleStatuses: { value: VehicleStatus; label: string; color: string }[] = [
  { value: 'Available', label: 'Available', color: '#10b981' },
  { value: 'InTransit', label: 'In Transit', color: '#3b82f6' },
  { value: 'Maintenance', label: 'Maintenance', color: '#f59e0b' },
  { value: 'Offline', label: 'Offline', color: '#6b7280' }
];
```

**Important:** Use exact enum values: `'Available'`, `'InTransit'`, `'Maintenance'`, `'Offline'` (not `'In_Transit'`)

#### **10. Add Loading States and Disable Forms During Submission**

```typescript
onSubmit(): void {
  if (this.vehicleForm.valid && !this.isLoading) {
    this.isLoading = true;
    this.vehicleForm.disable(); // Disable form during submission
    
    // ... API call ...
    
    // Re-enable on error
    error: (error) => {
      this.handleError(error);
      this.isLoading = false;
      this.vehicleForm.enable();
    }
  }
}
```

---

## ✅ Testing Checklist

After implementing these changes, test:

- [ ] VIN validation works correctly (length, format)
- [ ] VIN auto-uppercases and removes spaces/hyphens
- [ ] Duplicate VIN shows 409 error with proper message
- [ ] Fleet duplicate name shows proper error
- [ ] Model year validation works (1900 to current+1)
- [ ] Plate number auto-uppercases
- [ ] All server validation errors display in forms
- [ ] Error messages are user-friendly
- [ ] Forms disable during submission
- [ ] Loading states work correctly

---

## 🔗 Reference Documents

- **API_IMPLEMENTATION_GUIDE.md** - Complete API reference
- **ANGULAR_SCAFFOLDING_GUIDE.md** - Component implementations
- **TEST_SCENARIOS.md** - Test cases

---

### **PROMPT END**

---

## 📝 Quick Reference: Key Changes

### Error Status Codes
- **400 Bad Request** - Validation errors (field-specific)
- **409 Conflict** - Duplicate VIN
- **404 Not Found** - Resource not found
- **401 Unauthorized** - Authentication required

### Validation Rules
- **VIN:** 11-17 chars, no I/O/Q, auto-uppercase
- **Plate:** Max 16 chars, auto-uppercase
- **Model Year:** 1900 to (current year + 1)
- **Fleet Name:** Required, max 128 chars, unique per owner

### Data Normalization
- VIN: Remove spaces/hyphens, uppercase
- Plate: Trim, uppercase
- All strings: Trim before submission

---

**Use this prompt to update your Angular client to work seamlessly with the enhanced server-side validation!**

