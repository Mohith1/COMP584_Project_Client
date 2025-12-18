# Server-Side: Supabase Real-Time Implementation Prompt

## 🎯 Objective
Implement real-time updates for Fleet and Vehicle management using Supabase Real-Time subscriptions. When data changes in the database (INSERT, UPDATE, DELETE), all connected clients should receive instant updates without polling.

## 📋 Requirements

### 1. **Supabase Real-Time Channel Configuration**

**Set up Supabase Realtime for the following tables:**
- `Fleets` table
- `Vehicles` table
- `TelemetrySnapshots` table (if exists)

**Required Actions:**
1. Enable Realtime on these tables in Supabase Dashboard:
   - Go to Database → Replication
   - Enable replication for: `Fleets`, `Vehicles`, `TelemetrySnapshots`
   
2. Configure Row Level Security (RLS) policies for real-time:
   - Owners should only receive updates for their own fleets/vehicles
   - Example policy: `SELECT` and `UPDATE` allowed where `ownerId = auth.uid()` or similar

### 2. **Backend WebSocket/SSE Endpoint**

**Option A: Supabase Realtime Client (Recommended)**
- Install: `Supabase.Realtime` NuGet package
- Create a service that subscribes to Supabase real-time channels
- Forward updates to connected SignalR clients

**Option B: Direct SignalR Implementation**
- If not using Supabase Realtime client library, implement SignalR hubs:
  - `FleetHub` - Broadcasts fleet changes
  - `VehicleHub` - Broadcasts vehicle changes  
  - `TelemetryHub` - Broadcasts telemetry updates

### 3. **SignalR Hub Implementation**

**Create SignalR Hubs:**

```csharp
// FleetHub.cs
public class FleetHub : Hub
{
    public async Task JoinFleetGroup(string ownerId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, $"owner-{ownerId}");
    }

    public async Task LeaveFleetGroup(string ownerId)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"owner-{ownerId}");
    }
}

// VehicleHub.cs  
public class VehicleHub : Hub
{
    public async Task JoinVehicleGroup(string fleetId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, $"fleet-{fleetId}");
    }
}
```

### 4. **Database Change Notifications**

**After any CRUD operation on Fleets/Vehicles, broadcast changes:**

```csharp
// Example in FleetService or FleetController
public async Task<FleetSummary> CreateFleet(string ownerId, CreateFleetDto dto)
{
    var fleet = await _repository.CreateFleetAsync(ownerId, dto);
    
    // Broadcast to all clients subscribed to this owner
    await _hubContext.Clients
        .Group($"owner-{ownerId}")
        .SendAsync("FleetCreated", fleet);
    
    return fleet;
}

public async Task<FleetSummary> UpdateFleet(string fleetId, UpdateFleetDto dto)
{
    var fleet = await _repository.UpdateFleetAsync(fleetId, dto);
    
    // Broadcast update
    await _hubContext.Clients
        .Group($"owner-{fleet.OwnerId}")
        .SendAsync("FleetUpdated", fleet);
    
    return fleet;
}

public async Task DeleteFleet(string fleetId)
{
    var ownerId = await _repository.GetFleetOwnerIdAsync(fleetId);
    await _repository.DeleteFleetAsync(fleetId);
    
    // Broadcast deletion
    await _hubContext.Clients
        .Group($"owner-{ownerId}")
        .SendAsync("FleetDeleted", fleetId);
}
```

### 5. **Supabase Realtime → SignalR Bridge Service**

**Create a service to listen to Supabase changes and forward to SignalR:**

```csharp
public class SupabaseRealtimeService : BackgroundService
{
    private readonly IHubContext<FleetHub> _fleetHub;
    private readonly IHubContext<VehicleHub> _vehicleHub;
    private readonly Supabase.Client _supabase;
    
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        // Subscribe to Fleet changes
        var fleetChannel = _supabase
            .Realtime
            .Channel("fleets")
            .OnPostgresChange(PostgresChangesFilter.Event.Insert, (sender, response) =>
            {
                var fleet = response.NewRecord.ToObject<FleetSummary>();
                _fleetHub.Clients
                    .Group($"owner-{fleet.OwnerId}")
                    .SendAsync("FleetCreated", fleet);
            })
            .OnPostgresChange(PostgresChangesFilter.Event.Update, (sender, response) =>
            {
                var fleet = response.NewRecord.ToObject<FleetSummary>();
                _fleetHub.Clients
                    .Group($"owner-{fleet.OwnerId}")
                    .SendAsync("FleetUpdated", fleet);
            })
            .OnPostgresChange(PostgresChangesFilter.Event.Delete, (sender, response) =>
            {
                var fleetId = response.OldRecord["id"].ToString();
                var ownerId = response.OldRecord["ownerId"].ToString();
                _fleetHub.Clients
                    .Group($"owner-{ownerId}")
                    .SendAsync("FleetDeleted", fleetId);
            });
            
        await fleetChannel.Subscribe();
        
        // Similar for Vehicles and Telemetry...
    }
}
```

### 6. **SignalR Configuration in Program.cs / Startup.cs**

```csharp
// Add SignalR
builder.Services.AddSignalR();

// Configure SignalR endpoint
app.MapHub<FleetHub>("/hub/fleets");
app.MapHub<VehicleHub>("/hub/vehicles");
app.MapHub<TelemetryHub>("/hub/telemetry");

// Enable CORS for SignalR (if client is on different domain)
app.UseCors(cors => cors
    .WithOrigins("https://your-client-domain.vercel.app")
    .AllowCredentials()
    .AllowAnyMethod()
    .AllowAnyHeader());
```

### 7. **Authentication for SignalR**

**Ensure SignalR connections are authenticated:**

```csharp
public class FleetHub : Hub
{
    public override async Task OnConnectedAsync()
    {
        var ownerId = Context.User?.FindFirst("ownerId")?.Value;
        if (ownerId != null)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, $"owner-{ownerId}");
        }
        await base.OnConnectedAsync();
    }
}
```

## 📡 API Endpoints Status Check

**Verify these endpoints exist and work correctly:**

### Fleet Endpoints:
- `POST /api/owners/{ownerId}/fleets` - Create fleet
- `GET /api/owners/{ownerId}/fleets` - List fleets
- `PUT /api/Fleets/{fleetId}` - Update fleet
- `DELETE /api/Fleets/{fleetId}` - Delete fleet
- `GET /api/Fleets/{fleetId}` - Get fleet details

### Vehicle Endpoints:
- `POST /api/Fleets/{fleetId}/vehicles` - Add vehicle
- `PUT /api/Vehicles/{vehicleId}` - Update vehicle
- `DELETE /api/Vehicles/{vehicleId}` - Delete vehicle

**Test each endpoint:**
1. Verify authentication (JWT token validation)
2. Verify authorization (owner can only access their own data)
3. Verify response format matches client expectations
4. Check error handling returns proper status codes

## 🔍 Troubleshooting Checklist

- [ ] Supabase Realtime is enabled in dashboard
- [ ] RLS policies allow real-time subscriptions
- [ ] SignalR hubs are registered and accessible
- [ ] Authentication tokens are validated on SignalR connection
- [ ] CORS is configured for SignalR endpoint
- [ ] All CRUD operations broadcast to SignalR groups
- [ ] Error handling for failed broadcasts (log, don't fail the request)

## 📝 Expected Message Format

**Client expects these SignalR message formats:**

```typescript
// Fleet messages
interface FleetCreatedMessage {
  id: string;
  name: string;
  description?: string;
  vehicleCount: number;
  status: 'Active' | 'Inactive';
  ownerId: string;
}

interface FleetUpdatedMessage extends FleetCreatedMessage {}
interface FleetDeletedMessage { fleetId: string; }

// Vehicle messages  
interface VehicleCreatedMessage {
  id: string;
  fleetId: string;
  vin: string;
  plateNumber: string;
  make?: string;
  model?: string;
  modelYear: number;
  status: VehicleStatus;
}

interface VehicleUpdatedMessage extends VehicleCreatedMessage {}
interface VehicleDeletedMessage { vehicleId: string; fleetId: string; }
```

## ✅ Acceptance Criteria

1. When a fleet is created/updated/deleted, all connected clients for that owner receive update within 1 second
2. When a vehicle is added/updated/deleted, all clients viewing that fleet receive update within 1 second  
3. Multiple browser tabs/windows stay in sync automatically
4. No polling required - updates are push-based
5. Authentication/authorization is enforced on all SignalR connections

## 🔗 Resources

- [Supabase Realtime Docs](https://supabase.com/docs/guides/realtime)
- [ASP.NET Core SignalR Docs](https://learn.microsoft.com/en-us/aspnet/core/signalr/introduction)
- [Supabase .NET Client](https://github.com/supabase/supabase-csharp)

---

**After implementing, provide:**
1. SignalR hub endpoint URLs
2. Connection authentication requirements
3. Message format documentation
4. Test the endpoints and confirm they broadcast changes


