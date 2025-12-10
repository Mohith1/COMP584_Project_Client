import { computed, Injectable, signal } from '@angular/core';
import { OwnerProfile } from '../models/owner.model';
import { FleetSummary } from '../models/fleet.model';
import { VehicleSummary } from '../models/vehicle.model';
import { TelemetrySnapshot } from '../models/telemetry.model';

@Injectable({
  providedIn: 'root'
})
export class OwnerStateService {
  private readonly ownerSig = signal<OwnerProfile | null>(null);
  private readonly fleetsSig = signal<FleetSummary[]>([]);
  private readonly vehiclesSig = signal<VehicleSummary[]>([]);
  private readonly telemetrySig = signal<TelemetrySnapshot[]>([]);
  private readonly loadingSig = signal(false);

  readonly owner = computed(() => this.ownerSig());
  readonly fleets = computed(() => this.fleetsSig());
  readonly vehicles = computed(() => this.vehiclesSig());
  readonly telemetry = computed(() => this.telemetrySig());
  readonly loading = computed(() => this.loadingSig());

  setOwner(owner: OwnerProfile | null): void {
    this.ownerSig.set(owner);
  }

  setFleets(fleets: FleetSummary[]): void {
    this.fleetsSig.set(fleets);
  }

  upsertFleet(fleet: FleetSummary): void {
    const updated = [...this.fleetsSig()];
    const index = updated.findIndex((f) => f.id === fleet.id);
    if (index > -1) {
      updated[index] = fleet;
    } else {
      updated.unshift(fleet);
    }
    this.fleetsSig.set(updated);
  }

  removeFleet(fleetId: string): void {
    this.fleetsSig.set(this.fleetsSig().filter((f) => f.id !== fleetId));
  }

  setVehicles(vehicles: VehicleSummary[]): void {
    this.vehiclesSig.set(vehicles);
  }

  upsertVehicle(vehicle: VehicleSummary): void {
    const current = this.vehiclesSig();
    const index = current.findIndex((v) => v.id === vehicle.id);
    if (index > -1) {
      current[index] = vehicle;
      this.vehiclesSig.set([...current]);
    } else {
      this.vehiclesSig.set([vehicle, ...current]);
    }
  }

  removeVehicle(vehicleId: string): void {
    this.vehiclesSig.set(this.vehiclesSig().filter((v) => v.id !== vehicleId));
  }

  setTelemetry(payload: TelemetrySnapshot[]): void {
    this.telemetrySig.set(payload);
  }

  setLoading(isLoading: boolean): void {
    this.loadingSig.set(isLoading);
  }
}










