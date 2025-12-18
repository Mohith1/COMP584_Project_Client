import { FormControl } from '@angular/forms';
import { vinValidator, normalizeVin, normalizePlate } from './vin.validator';

describe('VIN Validator', () => {
  describe('normalizeVin', () => {
    it('should remove spaces from VIN', () => {
      expect(normalizeVin('WVWZ ZZ3C ZWE1 2345')).toBe('WVWZZZ3CZWE12345');
    });

    it('should remove hyphens from VIN', () => {
      expect(normalizeVin('WVWZZZ3C-ZWE-12345')).toBe('WVWZZZ3CZWE12345');
    });

    it('should convert to uppercase', () => {
      expect(normalizeVin('wvwzzz3czwe12345')).toBe('WVWZZZ3CZWE12345');
    });

    it('should handle mixed spaces, hyphens, and case', () => {
      expect(normalizeVin('wvw-zzz 3c-zwe 123-45')).toBe('WVWZZZ3CZWE12345');
    });

    it('should return empty string for null/undefined', () => {
      expect(normalizeVin('')).toBe('');
      expect(normalizeVin(null as unknown as string)).toBe('');
      expect(normalizeVin(undefined as unknown as string)).toBe('');
    });
  });

  describe('normalizePlate', () => {
    it('should trim whitespace from plate', () => {
      expect(normalizePlate('  ABC1234  ')).toBe('ABC1234');
    });

    it('should convert to uppercase', () => {
      expect(normalizePlate('abc1234')).toBe('ABC1234');
    });

    it('should handle mixed case and whitespace', () => {
      expect(normalizePlate('  aBc-1234  ')).toBe('ABC-1234');
    });

    it('should return empty string for null/undefined', () => {
      expect(normalizePlate('')).toBe('');
      expect(normalizePlate(null as unknown as string)).toBe('');
      expect(normalizePlate(undefined as unknown as string)).toBe('');
    });
  });

  describe('vinValidator()', () => {
    let validator: ReturnType<typeof vinValidator>;
    let control: FormControl;

    beforeEach(() => {
      validator = vinValidator();
      control = new FormControl('');
    });

    it('should return null for empty value (let required handle it)', () => {
      control.setValue('');
      expect(validator(control)).toBeNull();

      control.setValue(null);
      expect(validator(control)).toBeNull();
    });

    it('should accept valid 17-character VIN', () => {
      control.setValue('WVWZZZ3CZWE123456');
      expect(validator(control)).toBeNull();
    });

    it('should accept valid 11-character VIN (minimum)', () => {
      control.setValue('WVWZZZ3CZWE');
      expect(validator(control)).toBeNull();
    });

    it('should accept VIN with spaces (normalized)', () => {
      control.setValue('WVWZ ZZ3C ZWE1 23456');
      expect(validator(control)).toBeNull();
    });

    it('should accept VIN with hyphens (normalized)', () => {
      control.setValue('WVWZZZ3C-ZWE-123456');
      expect(validator(control)).toBeNull();
    });

    it('should reject VIN shorter than 11 characters', () => {
      control.setValue('WVWZZZ3CZW'); // 10 chars
      const result = validator(control);
      
      expect(result).not.toBeNull();
      expect(result?.['vinLength']).toBeDefined();
      expect(result?.['vinLength'].actualLength).toBe(10);
    });

    it('should reject VIN longer than 17 characters', () => {
      control.setValue('WVWZZZ3CZWE123456789'); // 20 chars
      const result = validator(control);
      
      expect(result).not.toBeNull();
      expect(result?.['vinLength']).toBeDefined();
      expect(result?.['vinLength'].actualLength).toBe(20);
    });

    it('should reject VIN containing letter I', () => {
      control.setValue('WVWZZZ3CZWI123456'); // Contains I
      const result = validator(control);
      
      expect(result).not.toBeNull();
      expect(result?.['vinFormat']).toBeDefined();
      expect(result?.['vinFormat'].message).toContain('I, O, or Q');
    });

    it('should reject VIN containing letter O', () => {
      control.setValue('WVWZZZ3CZWO123456'); // Contains O
      const result = validator(control);
      
      expect(result).not.toBeNull();
      expect(result?.['vinFormat']).toBeDefined();
    });

    it('should reject VIN containing letter Q', () => {
      control.setValue('WVWZZZ3CZWQ123456'); // Contains Q
      const result = validator(control);
      
      expect(result).not.toBeNull();
      expect(result?.['vinFormat']).toBeDefined();
    });

    it('should reject VIN with special characters', () => {
      control.setValue('WVWZZZ3CZWE!@#456');
      const result = validator(control);
      
      expect(result).not.toBeNull();
      expect(result?.['vinFormat']).toBeDefined();
    });

    it('should accept VIN with lowercase (converts to uppercase)', () => {
      control.setValue('wvwzzz3czwe123456');
      expect(validator(control)).toBeNull();
    });

    it('should accept VIN at exactly 11 characters', () => {
      control.setValue('1G1YY22G965');
      expect(validator(control)).toBeNull();
    });

    it('should accept VIN at exactly 17 characters', () => {
      control.setValue('1G1YY22G965104625');
      expect(validator(control)).toBeNull();
    });

    it('should handle real-world VIN examples', () => {
      // Toyota VIN
      control.setValue('JTDKN3DU5A0123456');
      expect(validator(control)).toBeNull();

      // Ford VIN  
      control.setValue('1FAHP3F25CL123456');
      expect(validator(control)).toBeNull();

      // Tesla VIN
      control.setValue('5YJ3E1EA1LF123456');
      expect(validator(control)).toBeNull();

      // BMW VIN
      control.setValue('WBAPH5C55BA123456');
      expect(validator(control)).toBeNull();
    });
  });
});


