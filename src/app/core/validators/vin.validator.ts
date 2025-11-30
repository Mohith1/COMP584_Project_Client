import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/**
 * Normalizes a VIN by removing spaces and hyphens, and converting to uppercase
 */
export function normalizeVin(vin: string): string {
  if (!vin) return '';
  return vin.replace(/\s+/g, '').replace(/-/g, '').toUpperCase();
}

/**
 * VIN validator that matches server-side validation rules:
 * - Length: 11-17 characters (after normalization)
 * - Format: Alphanumeric only, no I, O, or Q
 * - Pattern: /^[A-HJ-NPR-Z0-9]{11,17}$/
 */
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

/**
 * Normalizes a plate number by trimming and converting to uppercase
 */
export function normalizePlate(plate: string): string {
  if (!plate) return '';
  return plate.trim().toUpperCase();
}


