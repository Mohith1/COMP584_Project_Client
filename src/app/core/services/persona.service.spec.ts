import { TestBed } from '@angular/core/testing';
import { PersonaService } from './persona.service';
import { STORAGE_KEYS } from '../constants/storage-keys';

describe('PersonaService', () => {
  let service: PersonaService;

  beforeEach(() => {
    // Clear sessionStorage before each test
    sessionStorage.clear();

    TestBed.configureTestingModule({
      providers: [PersonaService]
    });

    service = TestBed.inject(PersonaService);
  });

  afterEach(() => {
    sessionStorage.clear();
  });

  describe('persona', () => {
    it('should return null initially when no persona is stored', () => {
      expect(service.persona()).toBeNull();
    });

    it('should restore persona from sessionStorage on init', () => {
      sessionStorage.setItem(STORAGE_KEYS.persona, 'owner');
      
      // Create new instance to test initialization
      const newService = new PersonaService();
      expect(newService.persona()).toBe('owner');
    });
  });

  describe('setPersona', () => {
    it('should set persona to owner', () => {
      service.setPersona('owner');

      expect(service.persona()).toBe('owner');
      expect(sessionStorage.getItem(STORAGE_KEYS.persona)).toBe('owner');
    });

    it('should set persona to user', () => {
      service.setPersona('user');

      expect(service.persona()).toBe('user');
      expect(sessionStorage.getItem(STORAGE_KEYS.persona)).toBe('user');
    });

    it('should clear persona when set to null', () => {
      service.setPersona('owner');
      service.setPersona(null);

      expect(service.persona()).toBeNull();
      expect(sessionStorage.getItem(STORAGE_KEYS.persona)).toBeNull();
    });

    it('should overwrite existing persona', () => {
      service.setPersona('owner');
      service.setPersona('user');

      expect(service.persona()).toBe('user');
      expect(sessionStorage.getItem(STORAGE_KEYS.persona)).toBe('user');
    });
  });

  describe('computed signal behavior', () => {
    it('should be reactive to changes', () => {
      const values: (string | null)[] = [];
      
      // Capture initial value
      values.push(service.persona());
      
      service.setPersona('owner');
      values.push(service.persona());
      
      service.setPersona('user');
      values.push(service.persona());
      
      service.setPersona(null);
      values.push(service.persona());

      expect(values).toEqual([null, 'owner', 'user', null]);
    });
  });
});

