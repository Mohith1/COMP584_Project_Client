# Client-Side Endpoints Reference - Integration Guide

## 🎯 Complete API Endpoints for Angular Client

This document provides all endpoints needed for client-side integration, with special focus on the new validation and error handling features.

---

## 🔐 Authentication Endpoints

### POST `/api/auth/login`
**Purpose:** Login and get JWT token

**Request:**
```typescript
{
  email: string;
  password: string;
}
```

**Response (200 OK):**
```typescript
{
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  userId: string;
  email: string;
  roles: string[];
}
```

**Error Responses:**
- `401 Unauthorized` - Invalid credentials
- `400 Bad Request` - Validation errors

---

### POST `/api/auth/register-owner`
**Purpose:** Register new fleet owner

**Request:**
```typescript
{
  email: string;
  password: string;
  companyName: string;
  contactEmail: string;
  cityId: string; // GUID from /api/cities endpoint
}
```

**Response (200 OK):**
```typescript
{
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  userId: string;
  email: string;
  roles: string[];
}
```

---

### POST `/api/auth/refresh`
**Purpose:** Refresh expired access token

**Request:**
```typescript
{
  refreshToken: string;
}
```

**Response (200 OK):**
```typescript
{
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}
```

---

## 🌍 Public Endpoints (No Authentication Required)

### GET `/api/countries`
**Purpose:** Get all countries for registration form

**Response (200 OK):**
```typescript
CountryResponse[] = [
  {
    id: string;        // GUID
    name: string;      // "United States"
    isoCode: string;   // "USA"
  }
]
```

**Usage:** Populate country dropdown in registration form

---

### GET `/api/cities`
**Purpose:** Get paginated list of cities

**Query Parameters:**
- `search` (optional): Filter by city name
- `countryId` (optional): Filter by country GUID
- `page` (optional, default: 1): Page number
- `pageSize` (optional, default: 50, max: 100): Items per page

**Response (200 OK):**
```typescript
{
  items: CityResponse[];
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

// CityResponse
{
  id: string;           // GUID - USE THIS for cityId in registration
  name: string;         // "New York"
  countryId: string;    // GUID
  countryName: string;  // "United States"
  countryIsoCode: string; // "USA"
}
```

**Usage:** 
- Populate city dropdown in registration form
- Use `id` (GUID) as `cityId` when registering owner

**Example:**
```typescript
// Get cities for USA
GET /api/cities?countryId={usaCountryId}&pageSize=100

// Search cities
GET /api/cities?search=new&pageSize=50
```

---

### GET `/api/cities/{id}`
**Purpose:** Get specific city by ID

**Path Parameter:**
- `id` (required): City GUID

**Response (200 OK):**
```typescript
{
  id: string;
  name: string;
  countryId: string;
  countryName: string;
  countryIsoCode: string;
}
```

**Response (404 Not Found):**
```typescript
{
  message: "City not found"
}
```

---

## 🚢 Fleet Management Endpoints (Authentication Required)

### POST `/api/owners/{ownerId}/fleets`
**Purpose:** Create a new fleet

**Headers:**
```
Authorization: Bearer {accessToken}
Content-Type: application/json
```

**Path Parameter:**
- `ownerId` (required): Owner GUID

**Request Body:**
```typescript
{
  name: string;           // Required, max 128 chars
  description?: string;   // Optional, max 512 chars
}
```

**Success Response (201 Created):**
```typescript
{
  id: string;             // GUID
  name: string;
  description?: string | null;
  vehicleCount: number;   // Always 0 for new fleet
}
```

**Error Responses:**

**400 Bad Request - Validation Error:**
```typescript
{
  message: string;        // "Fleet name is required and cannot be empty."
  errors: {
    name?: string[];      // Field-specific errors
  }
}
```

**400 Bad Request - Duplicate Name:**
```typescript
{
  message: string;        // "A fleet with the name 'Fleet Name' already exists for this owner."
  errors: {
    name?: string[];     // ["A fleet with the name 'Fleet Name' already exists for this owner."]
  }
}
```

**401 Unauthorized:**
```typescript
{
  message: "Unauthorized"
}
```

**404 Not Found:**
```typescript
{
  message: "Owner with id '{ownerId}' not found."
}
```

**Client Implementation:**
```typescript
createFleet(ownerId: string, request: CreateFleetRequest): Observable<FleetResponse> {
  return this.http.post<FleetResponse>(
    `${this.apiUrl}/owners/${ownerId}/fleets`,
    request
  );
}

// Error handling
this.fleetService.createFleet(ownerId, request).subscribe({
  next: (response) => {
    // Success - show toast, close modal, refresh list
  },
  error: (error) => {
    if (error.status === 400 && error.error?.errors?.['name']) {
      // Set error on name field
      this.name?.setErrors({ serverError: error.error.errors['name'][0] });
    }
    // Show error notification
  }
});
```

---

### GET `/api/owners/{ownerId}/fleets`
**Purpose:** Get all fleets for an owner (paginated)

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Path Parameter:**
- `ownerId` (required): Owner GUID

**Query Parameters:**
- `page` (optional, default: 1): Page number
- `size` (optional, default: 10): Items per page

**Response (200 OK):**
```typescript
{
  items: FleetResponse[];
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

// FleetResponse
{
  id: string;
  name: string;
  description?: string | null;
  vehicleCount: number;
}
```

**Client Implementation:**
```typescript
getFleets(ownerId: string, page: number = 1, size: number = 20): Observable<PagedFleetResponse> {
  const params = new HttpParams()
    .set('page', page.toString())
    .set('size', size.toString());
  
  return this.http.get<PagedFleetResponse>(
    `${this.apiUrl}/owners/${ownerId}/fleets`,
    { params }
  );
}
```

---

### PUT `/api/fleets/{fleetId}`
**Purpose:** Update fleet details

**Headers:**
```
Authorization: Bearer {accessToken}
Content-Type: application/json
```

**Path Parameter:**
- `fleetId` (required): Fleet GUID

**Request Body:**
```typescript
{
  name?: string;          // Optional, max 128 chars
  description?: string;   // Optional, max 512 chars
}
```

**Response (200 OK):**
```typescript
{
  id: string;
  name: string;
  description?: string | null;
  vehicleCount: number;
}
```

---

### DELETE `/api/fleets/{fleetId}`
**Purpose:** Delete a fleet (soft delete)

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Response (204 No Content)** - Success

**Response (404 Not Found)** - Fleet doesn't exist

---

## 🚗 Vehicle Management Endpoints (Authentication Required)

### POST `/api/fleets/{fleetId}/vehicles`
**Purpose:** Add a new vehicle to a fleet

**Headers:**
```
Authorization: Bearer {accessToken}
Content-Type: application/json
```

**Path Parameter:**
- `fleetId` (required): Fleet GUID

**Request Body:**
```typescript
{
  vin: string;                    // Required, 11-17 chars, alphanumeric (no I, O, Q)
  plateNumber: string;            // Required, max 16 chars
  make?: string | null;           // Optional, max 64 chars
  model?: string | null;          // Optional, max 64 chars
  modelYear: number;              // Required, range: 1900 to (current year + 1)
  status: VehicleStatus;          // Required, default: "Available"
}

// VehicleStatus enum
type VehicleStatus = "Available" | "InTransit" | "Maintenance" | "Offline";
```

**Success Response (200 OK):**
```typescript
{
  id: string;                     // GUID
  vin: string;                     // Normalized (uppercase, no spaces)
  plateNumber: string;             // Normalized (uppercase, trimmed)
  make?: string | null;
  model?: string | null;
  modelYear: number;
  status: VehicleStatus;
}
```

**Error Responses:**

**400 Bad Request - VIN Validation:**
```typescript
{
  message: string;        // "VIN must be at least 11 characters long."
                          // OR "VIN cannot exceed 17 characters."
                          // OR "VIN contains invalid characters. VINs cannot contain the letters I, O, or Q."
  errors: {
    vin?: string[];       // Field-specific errors
  }
}
```

**400 Bad Request - Model Year:**
```typescript
{
  message: string;        // "Model year must be between 1900 and 2025."
  errors: {
    modelYear?: string[];
  }
}
```

**400 Bad Request - Plate Number:**
```typescript
{
  message: string;        // "License plate number is required."
                          // OR "License plate number cannot exceed 16 characters."
  errors: {
    plateNumber?: string[];
  }
}
```

**409 Conflict - Duplicate VIN:**
```typescript
{
  message: string;        // "A vehicle with VIN '1HGBH41JXMN109186' already exists in the system."
  vin: string;            // The duplicate VIN
  errorCode: "DUPLICATE_VIN"
}
```

**404 Not Found - Fleet doesn't exist:**
```typescript
{
  message: "Fleet with id '{fleetId}' not found."
}
```

**Client Implementation:**
```typescript
addVehicle(fleetId: string, request: CreateVehicleRequest): Observable<VehicleResponse> {
  // IMPORTANT: Normalize VIN and plate before sending
  const normalizedRequest = {
    ...request,
    vin: normalizeVin(request.vin),           // Remove spaces/hyphens, uppercase
    plateNumber: normalizePlate(request.plateNumber)  // Trim, uppercase
  };
  
  return this.http.post<VehicleResponse>(
    `${this.apiUrl}/fleets/${fleetId}/vehicles`,
    normalizedRequest
  );
}

// Error handling
this.vehicleService.addVehicle(fleetId, request).subscribe({
  next: (response) => {
    // Success - show toast, close modal, refresh list
  },
  error: (error) => {
    // Handle 409 Conflict (Duplicate VIN)
    if (error.status === 409 && error.error?.errorCode === 'DUPLICATE_VIN') {
      this.vin?.setErrors({ 
        duplicate: true,
        serverError: error.error.message 
      });
      this.notification.showError(error.error.message);
      return;
    }
    
    // Handle 400 Bad Request (Validation errors)
    if (error.status === 400 && error.error?.errors) {
      Object.keys(error.error.errors).forEach(field => {
        const control = this.vehicleForm.get(field);
        if (control) {
          control.setErrors({ 
            serverError: error.error.errors[field][0] 
          });
        }
      });
      this.notification.showError(error.error.message);
      return;
    }
    
    // Handle other errors
    this.notification.showError('Failed to add vehicle. Please try again.');
  }
});
```

---

### GET `/api/fleets/{fleetId}/vehicles`
**Purpose:** Get all vehicles in a fleet (paginated)

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Path Parameter:**
- `fleetId` (required): Fleet GUID

**Query Parameters:**
- `page` (optional, default: 1): Page number
- `size` (optional, default: 20): Items per page

**Response (200 OK):**
```typescript
{
  items: VehicleResponse[];
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

// VehicleResponse
{
  id: string;
  vin: string;
  plateNumber: string;
  make?: string | null;
  model?: string | null;
  modelYear: number;
  status: VehicleStatus;
}
```

**Client Implementation:**
```typescript
getVehicles(fleetId: string, page: number = 1, size: number = 20): Observable<PagedVehicleResponse> {
  const params = new HttpParams()
    .set('page', page.toString())
    .set('size', size.toString());
  
  return this.http.get<PagedVehicleResponse>(
    `${this.apiUrl}/fleets/${fleetId}/vehicles`,
    { params }
  );
}
```

---

### PUT `/api/vehicles/{vehicleId}`
**Purpose:** Update vehicle details

**Headers:**
```
Authorization: Bearer {accessToken}
Content-Type: application/json
```

**Path Parameter:**
- `vehicleId` (required): Vehicle GUID

**Request Body:**
```typescript
{
  plateNumber?: string;   // Optional, max 16 chars
  make?: string | null;  // Optional, max 64 chars
  model?: string | null; // Optional, max 64 chars
  status?: VehicleStatus; // Optional
}
```

**Response (200 OK):**
```typescript
{
  id: string;
  vin: string;
  plateNumber: string;
  make?: string | null;
  model?: string | null;
  modelYear: number;
  status: VehicleStatus;
}
```

**Note:** VIN cannot be updated (it's immutable)

---

### DELETE `/api/vehicles/{vehicleId}`
**Purpose:** Delete a vehicle (soft delete)

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Response (204 No Content)** - Success

**Response (404 Not Found)** - Vehicle doesn't exist

---

## 📊 Owner Endpoints (Authentication Required)

### GET `/api/owners/{ownerId}`
**Purpose:** Get owner profile details

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Response (200 OK):**
```typescript
{
  id: string;
  companyName: string;
  contactEmail: string;
  cityId: string;
  cityName: string;
  countryName: string;
  totalFleets: number;
  totalVehicles: number;
}
```

**Usage:** Get owner details including `ownerId` for other endpoints

---

### PUT `/api/owners/{ownerId}`
**Purpose:** Update owner profile

**Headers:**
```
Authorization: Bearer {accessToken}
Content-Type: application/json
```

**Request Body:**
```typescript
{
  companyName?: string;
  contactEmail?: string;
  cityId?: string;  // GUID from /api/cities
}
```

**Response (200 OK):**
```typescript
{
  success: boolean;
  message: string;
}
```

---

## 📡 Telemetry Endpoints (Authentication Required)

### GET `/api/owners/{ownerId}/vehicles/telemetry`
**Purpose:** Get latest telemetry for all vehicles owned by an owner

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Response (200 OK):**
```typescript
VehicleTelemetryResponse[] = [
  {
    snapshotId: string;        // GUID
    vehicleId: string;          // GUID
    latitude: number;          // decimal
    longitude: number;         // decimal
    speedKph: number;          // decimal
    fuelLevelPercentage: number; // decimal
    capturedAtUtc: string;     // ISO 8601 datetime
  }
]
```

**Response (200 OK - Empty):**
```typescript
[]  // Empty array if no telemetry data
```

---

## 🔑 Key Integration Points

### 1. **Authentication Flow**
```typescript
// 1. Login
POST /api/auth/login
→ Get accessToken

// 2. Use token in all subsequent requests
Authorization: Bearer {accessToken}

// 3. Refresh token when expired
POST /api/auth/refresh
```

### 2. **Registration Flow**
```typescript
// 1. Get countries
GET /api/countries
→ Display in dropdown

// 2. Get cities for selected country
GET /api/cities?countryId={countryId}
→ Display in dropdown

// 3. Register owner with cityId (GUID from step 2)
POST /api/auth/register-owner
{
  cityId: string  // Use the GUID from CityResponse.id
}
```

### 3. **Fleet Creation Flow**
```typescript
// 1. Get ownerId (from login response or owner profile)
GET /api/owners/{ownerId}

// 2. Create fleet
POST /api/owners/{ownerId}/fleets
{
  name: string;
  description?: string;
}

// 3. Handle errors
- 400: Validation error (check errors.name)
- 400: Duplicate name (check errors.name)
```

### 4. **Vehicle Creation Flow**
```typescript
// 1. Get fleetId (from fleet list or fleet detail)
GET /api/owners/{ownerId}/fleets

// 2. Create vehicle
POST /api/fleets/{fleetId}/vehicles
{
  vin: string;              // Will be normalized server-side
  plateNumber: string;      // Will be normalized server-side
  make?: string;
  model?: string;
  modelYear: number;        // 1900 to current+1
  status: VehicleStatus;    // "Available" | "InTransit" | "Maintenance" | "Offline"
}

// 3. Handle errors
- 400: Validation error (check errors.vin, errors.modelYear, etc.)
- 409: Duplicate VIN (check errorCode === "DUPLICATE_VIN")
- 404: Fleet not found
```

---

## ⚠️ Important Notes for Client Integration

### **VIN Handling**
- **Client should normalize before display:** Remove spaces/hyphens, uppercase
- **Server normalizes automatically:** But client should match for consistency
- **Duplicate check uses normalized VIN:** "1hgb h41-jxmn" = "1HGBH41JXMN" (duplicate)

### **Error Response Structure**
```typescript
// Validation Error (400)
{
  message: string;
  errors: {
    fieldName: string[];  // Array of error messages for each field
  }
}

// Duplicate VIN (409)
{
  message: string;
  vin: string;
  errorCode: "DUPLICATE_VIN"
}

// Not Found (404)
{
  message: string;
}
```

### **Status Values**
Use exact enum values (case-sensitive):
- `"Available"` ✅
- `"InTransit"` ✅
- `"Maintenance"` ✅
- `"Offline"` ✅

**NOT:**
- `"In_Transit"` ❌
- `"in_transit"` ❌
- `"Available"` with different casing ❌

### **Data Normalization**
Server automatically normalizes:
- **VIN:** Uppercase, remove spaces/hyphens
- **Plate Number:** Uppercase, trimmed
- **All strings:** Trimmed

Client should normalize for consistency and better UX.

---

## 📝 TypeScript Interface Definitions

```typescript
// Authentication
interface LoginRequest {
  email: string;
  password: string;
}

interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  userId: string;
  email: string;
  roles: string[];
}

// Public Endpoints
interface CountryResponse {
  id: string;
  name: string;
  isoCode: string;
}

interface CityResponse {
  id: string;           // Use this as cityId
  name: string;
  countryId: string;
  countryName: string;
  countryIsoCode: string;
}

interface PagedCityResponse {
  items: CityResponse[];
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

// Fleet Management
interface CreateFleetRequest {
  name: string;
  description?: string | null;
}

interface FleetResponse {
  id: string;
  name: string;
  description?: string | null;
  vehicleCount: number;
}

interface PagedFleetResponse {
  items: FleetResponse[];
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

// Vehicle Management
type VehicleStatus = "Available" | "InTransit" | "Maintenance" | "Offline";

interface CreateVehicleRequest {
  vin: string;
  plateNumber: string;
  make?: string | null;
  model?: string | null;
  modelYear: number;
  status: VehicleStatus;
}

interface VehicleResponse {
  id: string;
  vin: string;
  plateNumber: string;
  make?: string | null;
  model?: string | null;
  modelYear: number;
  status: VehicleStatus;
}

interface PagedVehicleResponse {
  items: VehicleResponse[];
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

// Owner
interface OwnerResponse {
  id: string;
  companyName: string;
  contactEmail: string;
  cityId: string;
  cityName: string;
  countryName: string;
  totalFleets: number;
  totalVehicles: number;
}

// Telemetry
interface VehicleTelemetryResponse {
  snapshotId: string;
  vehicleId: string;
  latitude: number;
  longitude: number;
  speedKph: number;
  fuelLevelPercentage: number;
  capturedAtUtc: string;
}

// Error Responses
interface ValidationError {
  message: string;
  errors?: Record<string, string[]>;
}

interface DuplicateVinError {
  message: string;
  vin: string;
  errorCode: "DUPLICATE_VIN";
}
```

---

## 🔧 Helper Functions for Client

```typescript
// VIN Normalization
export function normalizeVin(vin: string): string {
  return vin.replace(/\s+/g, '').replace(/-/g, '').toUpperCase();
}

// Plate Normalization
export function normalizePlate(plate: string): string {
  return plate.trim().toUpperCase();
}

// Get Current Year + 1 (for model year max)
export function getMaxModelYear(): number {
  return new Date().getFullYear() + 1;
}

// Generate Years Array (for dropdown)
export function generateYearOptions(): number[] {
  const currentYear = new Date().getFullYear();
  const years: number[] = [];
  for (let year = currentYear + 1; year >= 1900; year--) {
    years.push(year);
  }
  return years;
}
```

---

## ✅ Integration Checklist

- [ ] Set up HTTP interceptor for authentication token
- [ ] Implement error handling for 409 Conflict (duplicate VIN)
- [ ] Implement error handling for 400 Bad Request (validation errors)
- [ ] Map field-specific errors to form controls
- [ ] Normalize VIN and plate number before submission
- [ ] Use exact status enum values
- [ ] Use city GUID (not name) for registration
- [ ] Handle pagination for fleet and vehicle lists
- [ ] Implement loading states
- [ ] Show user-friendly error messages

---

## 🚀 Quick Start Integration

1. **Set up base URL:**
```typescript
// environment.ts
export const environment = {
  apiUrl: 'http://localhost:5224'
};
```

2. **Create HTTP interceptor:**
```typescript
// auth.interceptor.ts
intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
  const token = this.authService.getToken();
  if (token) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }
  return next.handle(req);
}
```

3. **Use endpoints as documented above**

---

**All endpoints are ready for client integration!**

