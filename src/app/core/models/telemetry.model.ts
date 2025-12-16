export interface TelemetrySnapshot {
  vehicleId: string;
  vehicleName?: string;
  speed: number;
  fuelLevel: number;
  batteryHealth: number;
  latitude: number;
  longitude: number;
  status: 'Normal' | 'Warning' | 'Critical';
  alert?: string;
  recordedOn: string;
}











