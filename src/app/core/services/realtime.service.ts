import { Injectable, OnDestroy, effect } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { Subject, BehaviorSubject } from 'rxjs';
import { environment } from '../../../environments/environment';
import { FleetSummary } from '../models/fleet.model';
import { VehicleSummary } from '../models/vehicle.model';
import { OwnerAuthService } from './owner-auth.service';
import { OwnerStateService } from '../state/owner-state.service';
import { ToastService } from './toast.service';
import { statusNumberToString } from '../models/vehicle.model';

/**
 * Real-time service for Fleet and Vehicle updates via SignalR
 * Connects to server SignalR hubs and broadcasts changes to state
 */
@Injectable({
  providedIn: 'root'
})
export class RealtimeService implements OnDestroy {
  private fleetHubConnection?: signalR.HubConnection;
  private vehicleHubConnection?: signalR.HubConnection;
  private isConnected$ = new BehaviorSubject<boolean>(false);
  private connectionErrors$ = new Subject<Error>();
  private destroy$ = new Subject<void>();
  private currentOwnerId?: string;
  private isStarting = false;
  private startPromise?: Promise<void>;

  readonly isConnected = this.isConnected$.asObservable();

  constructor(
    private readonly ownerAuth: OwnerAuthService,
    private readonly ownerState: OwnerStateService,
    private readonly toast: ToastService
  ) {
    // Automatically stop connection when owner logs out
    effect(() => {
      const isAuthenticated = this.ownerAuth.isAuthenticated();
      if (!isAuthenticated) {
        this.stop();
      }
    });
  }

  /**
   * Start SignalR connections for fleet and vehicle updates
   * Prevents duplicate connections - if already connected or connecting, returns existing promise
   */
  async start(ownerId: string): Promise<void> {
    if (!ownerId) {
      console.warn('⚠️ Cannot start SignalR: ownerId is required');
      return;
    }

    // If already connected for this owner, no need to reconnect
    if (this.currentOwnerId === ownerId && this.isConnected$.value) {
      console.log('✅ SignalR already connected for this owner');
      return;
    }

    // If already connecting, return the existing promise
    if (this.isStarting && this.startPromise) {
      console.log('⏳ SignalR connection already in progress...');
      return this.startPromise;
    }

    // If connecting for a different owner, stop first
    if (this.currentOwnerId && this.currentOwnerId !== ownerId) {
      console.log(`🔄 Owner changed (${this.currentOwnerId} → ${ownerId}), reconnecting...`);
      await this.stop();
    }

    this.isStarting = true;
    this.currentOwnerId = ownerId;

      this.startPromise = (async () => {
      try {
        await this.connectFleetHub(ownerId);
        await this.connectVehicleHub();
        this.isConnected$.next(true);
        console.log('✅ SignalR connections established');
        this.toast.success('Real-time updates enabled', 3000);
      } catch (error) {
        console.error('❌ Failed to start SignalR connections:', error);
        this.connectionErrors$.next(error as Error);
        this.isConnected$.next(false);
        this.toast.warn('Real-time updates unavailable. Using polling.', 5000);
        // Don't throw - allow app to continue with polling
      } finally {
        this.isStarting = false;
      }
    })();

    return this.startPromise;
  }

  /**
   * Stop all SignalR connections
   */
  async stop(): Promise<void> {
    try {
      if (this.fleetHubConnection) {
        await this.fleetHubConnection.stop();
        this.fleetHubConnection = undefined;
      }
      if (this.vehicleHubConnection) {
        await this.vehicleHubConnection.stop();
        this.vehicleHubConnection = undefined;
      }
      this.currentOwnerId = undefined;
      this.isStarting = false;
      this.startPromise = undefined;
      this.isConnected$.next(false);
      console.log('🛑 SignalR connections stopped');
    } catch (error) {
      console.error('❌ Error stopping SignalR:', error);
      // Reset state even if stop fails
      this.currentOwnerId = undefined;
      this.isStarting = false;
      this.startPromise = undefined;
      this.isConnected$.next(false);
    }
  }

  /**
   * Connect to Fleet Hub for fleet updates
   */
  private async connectFleetHub(ownerId: string): Promise<void> {
    const token = this.ownerAuth.accessToken();
    if (!token) {
      throw new Error('No access token available for SignalR connection');
    }

    this.fleetHubConnection = new signalR.HubConnectionBuilder()
      .withUrl(`${environment.apiUrl}/hub/fleets`, {
        accessTokenFactory: () => {
          const currentToken = this.ownerAuth.accessToken();
          if (!currentToken) {
            throw new Error('Access token expired');
          }
          return currentToken;
        },
        transport: signalR.HttpTransportType.WebSockets
      })
      .withAutomaticReconnect({
        nextRetryDelayInMilliseconds: (retryContext) => {
          // Exponential backoff: 0s, 2s, 10s, 30s, then stop after 60s
          if (retryContext.elapsedMilliseconds < 60000) {
            return Math.min(1000 * Math.pow(2, retryContext.previousRetryCount), 30000);
          }
          return null; // Stop retrying after 60 seconds
        }
      })
      .configureLogging(signalR.LogLevel.Information)
      .build();

    // Set up message handlers
    this.setupFleetHandlers();

    // Start connection
    await this.fleetHubConnection.start();
    console.log('✅ Connected to Fleet Hub');

    // Server automatically groups by owner (via authentication), but we can explicitly join if server requires it
    // According to server guide, Fleet Hub groups are based on ownerId automatically
    // Some implementations may require explicit join - try it, but don't fail if not available
    try {
      await this.fleetHubConnection.invoke('JoinFleetGroup', ownerId);
      console.log(`✅ Joined Fleet group: owner-${ownerId}`);
    } catch (error) {
      // Server might auto-group, so this is optional
      console.log('ℹ️ Fleet Hub auto-groups by owner (JoinFleetGroup not required)');
    }

    // Connection event handlers
    this.fleetHubConnection.onreconnecting((error) => {
      console.log('🔄 Fleet Hub reconnecting...', error);
      this.isConnected$.next(false);
      this.toast.warn('Real-time connection lost. Reconnecting...', 3000);
    });

    this.fleetHubConnection.onreconnected((connectionId) => {
      console.log('✅ Fleet Hub reconnected:', connectionId);
      // Rejoin group after reconnection (if required by server)
      if (this.currentOwnerId) {
        this.fleetHubConnection?.invoke('JoinFleetGroup', this.currentOwnerId).catch(() => {
          // Ignore - server might auto-group
        });
      }
      this.isConnected$.next(true);
    });

    // Handle server 'Connected' event (if server sends it)
    this.fleetHubConnection.on('Connected', (data: { ownerId: string }) => {
      console.log('✅ Server confirmed connection to owner group:', data.ownerId);
    });

    this.fleetHubConnection.onclose((error) => {
      console.log('🛑 Fleet Hub connection closed:', error);
      this.isConnected$.next(false);
      if (error) {
        this.toast.warn('Real-time connection closed', 3000);
      }
    });
  }

  /**
   * Set up Fleet Hub message handlers
   */
  private setupFleetHandlers(): void {
    if (!this.fleetHubConnection) return;

    // Fleet Created
    this.fleetHubConnection.on('FleetCreated', (fleet: FleetSummary) => {
      console.log('📨 FleetCreated received:', fleet);
      this.ownerState.upsertFleet(this.normalizeFleet(fleet));
      this.toast.info(`Fleet "${fleet.name}" created`, 3000);
    });

    // Fleet Updated
    this.fleetHubConnection.on('FleetUpdated', (fleet: FleetSummary) => {
      console.log('📨 FleetUpdated received:', fleet);
      this.ownerState.upsertFleet(this.normalizeFleet(fleet));
      this.toast.info(`Fleet "${fleet.name}" updated`, 3000);
    });

    // Fleet Deleted
    this.fleetHubConnection.on('FleetDeleted', (data: { fleetId: string; ownerId: string }) => {
      console.log('📨 FleetDeleted received:', data);
      this.ownerState.removeFleet(data.fleetId);
      this.toast.info('Fleet deleted', 3000);
    });
  }

  /**
   * Connect to Vehicle Hub for vehicle updates
   */
  private async connectVehicleHub(): Promise<void> {
    const token = this.ownerAuth.accessToken();
    if (!token) {
      throw new Error('No access token available for SignalR connection');
    }

    this.vehicleHubConnection = new signalR.HubConnectionBuilder()
      .withUrl(`${environment.apiUrl}/hub/vehicles`, {
        accessTokenFactory: () => {
          const currentToken = this.ownerAuth.accessToken();
          if (!currentToken) {
            throw new Error('Access token expired');
          }
          return currentToken;
        },
        transport: signalR.HttpTransportType.WebSockets
      })
      .withAutomaticReconnect({
        nextRetryDelayInMilliseconds: (retryContext) => {
          if (retryContext.elapsedMilliseconds < 60000) {
            return Math.min(1000 * Math.pow(2, retryContext.previousRetryCount), 30000);
          }
          return null;
        }
      })
      .configureLogging(signalR.LogLevel.Information)
      .build();

    // Set up message handlers
    this.setupVehicleHandlers();

    // Start connection
    await this.vehicleHubConnection.start();
    console.log('✅ Connected to Vehicle Hub');

    // Connection event handlers
    this.vehicleHubConnection.onreconnecting((error) => {
      console.log('🔄 Vehicle Hub reconnecting...', error);
    });

    this.vehicleHubConnection.onreconnected((connectionId) => {
      console.log('✅ Vehicle Hub reconnected:', connectionId);
    });

    this.vehicleHubConnection.onclose((error) => {
      console.log('🛑 Vehicle Hub connection closed:', error);
    });
  }

  /**
   * Set up Vehicle Hub message handlers
   */
  private setupVehicleHandlers(): void {
    if (!this.vehicleHubConnection) return;

    // Vehicle Created
    this.vehicleHubConnection.on('VehicleCreated', (vehicle: VehicleSummary) => {
      console.log('📨 VehicleCreated received:', vehicle);
      this.ownerState.upsertVehicle(this.normalizeVehicle(vehicle));
      this.toast.info(`Vehicle "${vehicle.vin}" added`, 3000);
    });

    // Vehicle Updated
    this.vehicleHubConnection.on('VehicleUpdated', (vehicle: VehicleSummary) => {
      console.log('📨 VehicleUpdated received:', vehicle);
      this.ownerState.upsertVehicle(this.normalizeVehicle(vehicle));
      this.toast.info(`Vehicle "${vehicle.vin}" updated`, 3000);
    });

    // Vehicle Deleted
    this.vehicleHubConnection.on('VehicleDeleted', (data: { vehicleId: string; fleetId: string }) => {
      console.log('📨 VehicleDeleted received:', data);
      this.ownerState.removeVehicle(data.vehicleId);
      this.toast.info('Vehicle deleted', 3000);
    });
  }

  /**
   * Join a fleet group to receive vehicle updates for that fleet
   */
  async joinFleetGroup(fleetId: string): Promise<void> {
    if (this.vehicleHubConnection?.state === signalR.HubConnectionState.Connected) {
      await this.vehicleHubConnection.invoke('JoinFleetGroup', fleetId);
      console.log(`✅ Joined Vehicle group: fleet-${fleetId}`);
    }
  }

  /**
   * Leave a fleet group
   */
  async leaveFleetGroup(fleetId: string): Promise<void> {
    if (this.vehicleHubConnection?.state === signalR.HubConnectionState.Connected) {
      await this.vehicleHubConnection.invoke('LeaveFleetGroup', fleetId);
      console.log(`✅ Left Vehicle group: fleet-${fleetId}`);
    }
  }

  /**
   * Normalize fleet data from server format to client format
   */
  private normalizeFleet(fleet: FleetSummary): FleetSummary {
    return {
      ...fleet,
      updatedOn: fleet.updatedAtUtc || fleet.createdAtUtc || new Date().toISOString()
    };
  }

  /**
   * Normalize vehicle data from server format (status as number) to client format (status as string)
   */
  private normalizeVehicle(vehicle: VehicleSummary): VehicleSummary {
    // Convert status from number to string if needed
    const status = typeof vehicle.status === 'number' 
      ? statusNumberToString(vehicle.status)
      : vehicle.status;

    return {
      ...vehicle,
      status: status as VehicleSummary['status'],
      year: vehicle.modelYear // Legacy field
    };
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.stop();
  }
}

