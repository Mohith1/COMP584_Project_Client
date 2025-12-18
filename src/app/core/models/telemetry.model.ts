export interface TelemetrySnapshot {
  id?: string;                    // GUID - from server (TelemetryDto)
  vehicleId: string;
  vehicleVin?: string;            // Optional - from server
  vehicleName?: string;           // Optional - client-only field
  speed?: number;                 // Legacy field name
  speedKph: number;               // Server field name (required)
  fuelLevel?: number;             // Legacy field name
  fuelLevelPercentage: number;    // Server field name (required)
  batteryHealth?: number;         // Client-only field (not in server DTO)
  latitude: number;
  longitude: number;
  status?: 'Normal' | 'Warning' | 'Critical';  // Client-only field
  alert?: string;                 // Client-only field
  recordedOn?: string;            // Legacy field name
  capturedAtUtc: string;          // ISO 8601 - server field name (required)
}













