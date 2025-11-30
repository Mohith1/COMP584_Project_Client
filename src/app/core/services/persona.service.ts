import { computed, Injectable, signal } from '@angular/core';
import { Persona } from '../models/common.model';
import { STORAGE_KEYS } from '../constants/storage-keys';

@Injectable({
  providedIn: 'root'
})
export class PersonaService {
  private readonly personaSig = signal<Persona>(this.restorePersona());

  readonly persona = computed(() => this.personaSig());

  setPersona(persona: Persona): void {
    this.personaSig.set(persona);
    if (persona) {
      sessionStorage.setItem(STORAGE_KEYS.persona, persona);
    } else {
      sessionStorage.removeItem(STORAGE_KEYS.persona);
    }
  }

  private restorePersona(): Persona {
    return (sessionStorage.getItem(STORAGE_KEYS.persona) as Persona) ?? null;
  }
}



