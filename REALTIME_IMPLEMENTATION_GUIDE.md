# Real-Time Dashboard Updates - Implementation Guide

## 🔍 Current Situation

### What's Working:
- ✅ Dashboard displays fleet count and telemetry snapshots
- ✅ Fleet management page (`/owner/fleets`) has full CRUD functionality
- ✅ Client uses polling (15s intervals) for telemetry updates
- ✅ All CRUD operations work via REST API calls

### What's Missing:
- ❌ Real-time updates - changes require page refresh to see
- ❌ Dashboard doesn't have inline CRUD (by design - it's read-only)
- ❌ Multiple browser tabs don't stay in sync
- ❌ No WebSocket/SignalR connection for push updates

## 🎯 Solution Options

### Option 1: Server-Side Real-Time (RECOMMENDED)

**Use Supabase Real-Time + SignalR** to push updates when database changes.

**Required Actions:**
1. **See `SERVER_REALTIME_SUPABASE_PROMPT.md`** for detailed server implementation
2. Server needs to:
   - Enable Supabase Realtime on `Fleets` and `Vehicles` tables
   - Set up SignalR hubs to broadcast changes
   - Bridge Supabase changes → SignalR messages

### Option 2: Client-Side Polling (TEMPORARY)

Currently using 15-second polling. Can reduce interval, but this is not ideal:
- ❌ High server load
- ❌ Delayed updates (up to 15 seconds)
- ❌ Not real-time

## 🚀 Quick Fix: Navigation

**Added:** Dashboard now has a "Manage Fleets" button that links to the Fleet Management page where all CRUD operations are available.

**To edit/add/delete:**
1. Click "Manage Fleets" button on Dashboard, OR
2. Navigate to `/owner/fleets` in the sidebar

## 📋 Client-Side Preparation (Ready for Real-Time)

The client is already structured to support real-time updates:

### State Management:
- `OwnerStateService` uses Angular signals - updates will automatically reflect in UI
- Services already have `upsertFleet()`, `removeFleet()`, `upsertVehicle()` methods

### What's Needed (After Server Implements SignalR):

1. **Install SignalR Client:**
```bash
npm install @microsoft/signalr
```

2. **Create SignalR Service:**
```typescript
// src/app/core/services/realtime.service.ts
import { Injectable } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { environment } from '../../../environments/environment';
import { OwnerStateService } from '../state/owner-state.service';
import { FleetSummary, VehicleSummary } from '../models/...';

@Injectable({ providedIn: 'root' })
export class RealtimeService {
  private connection?: signalR.HubConnection;

  constructor(private ownerState: OwnerStateService) {}

  async start(ownerId: string): Promise<void> {
    this.connection = new signalR.HubConnectionBuilder()
      .withUrl(`${environment.apiUrl}/hub/fleets`, {
        accessTokenFactory: () => {
          // Return current auth token
          return this.getAuthToken();
        }
      })
      .build();

    // Listen for fleet updates
    this.connection.on('FleetCreated', (fleet: FleetSummary) => {
      this.ownerState.upsertFleet(fleet);
    });

    this.connection.on('FleetUpdated', (fleet: FleetSummary) => {
      this.ownerState.upsertFleet(fleet);
    });

    this.connection.on('FleetDeleted', (fleetId: string) => {
      this.ownerState.removeFleet(fleetId);
    });

    await this.connection.start();
    await this.connection.invoke('JoinFleetGroup', ownerId);
  }

  async stop(): Promise<void> {
    if (this.connection) {
      await this.connection.stop();
    }
  }

  private getAuthToken(): string {
    // Get token from OwnerAuthService or OktaAuthFacade
    return ''; // Implement based on current persona
  }
}
```

3. **Connect in Dashboard/Fleets Components:**
```typescript
// In owner-dashboard.component.ts
ngOnInit(): void {
  const ownerId = this.ownerAuth.ownerId();
  if (ownerId) {
    this.realtimeService.start(ownerId);
  }
}

ngOnDestroy(): void {
  this.realtimeService.stop();
}
```

## 🔧 Troubleshooting CRUD Not Working

If you can't edit/add/delete on the **Fleets page** (`/owner/fleets`), check:

### 1. **Authentication:**
- [ ] Are you logged in? Check browser console for auth errors
- [ ] Is the JWT token being sent? Check Network tab → Headers → Authorization
- [ ] Is the token expired? Check token expiration time

### 2. **API Endpoints:**
- [ ] Is the API URL correct in `environment.ts`?
- [ ] Can you access the API directly? Test with Postman/curl
- [ ] Are the endpoints returning correct status codes?

### 3. **CORS/Network:**
- [ ] Check browser console for CORS errors
- [ ] Check Network tab for failed requests (4xx, 5xx)
- [ ] Verify API is accepting requests from your client domain

### 4. **Form Validation:**
- [ ] Are all required fields filled?
- [ ] Check form validation errors (should show red borders)
- [ ] Check browser console for validation errors

## 📞 Next Steps

1. **Immediate:** Use the Fleet Management page (`/owner/fleets`) for all CRUD operations
2. **Server Task:** Implement Supabase Real-Time + SignalR (see `SERVER_REALTIME_SUPABASE_PROMPT.md`)
3. **Client Task:** Once server is ready, implement SignalR client connection
4. **Testing:** Verify real-time updates work across multiple browser tabs

## 🎓 Questions for Server Developer

Ask your server developer:

1. "Have you enabled Supabase Realtime on the Fleets and Vehicles tables?"
2. "Do you have SignalR hubs set up to broadcast fleet/vehicle changes?"
3. "What's the SignalR hub endpoint URL? (e.g., `/hub/fleets`)"
4. "How should I authenticate the SignalR connection? (Same JWT token?)"
5. "Are the CRUD endpoints (`POST /api/owners/{ownerId}/fleets`, etc.) working correctly?"
6. "Can you test creating a fleet and confirm the API returns the created fleet object?"


