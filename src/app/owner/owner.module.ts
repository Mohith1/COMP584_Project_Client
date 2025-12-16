import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../shared/shared.module';
import { OwnerRoutingModule } from './owner-routing.module';
import { OwnerShellComponent } from './pages/owner-shell/owner-shell.component';
import { OwnerDashboardComponent } from './pages/owner-dashboard/owner-dashboard.component';
import { OwnerFleetsComponent } from './pages/owner-fleets/owner-fleets.component';
import { OwnerProfileComponent } from './pages/owner-profile/owner-profile.component';
import { OwnerLoginComponent } from './pages/owner-login/owner-login.component';
import { OwnerRegisterComponent } from './pages/owner-register/owner-register.component';
import { OwnerCallbackComponent } from './pages/owner-callback/owner-callback.component';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@NgModule({
  declarations: [
    OwnerShellComponent,
    OwnerDashboardComponent,
    OwnerFleetsComponent,
    OwnerProfileComponent,
    OwnerLoginComponent,
    OwnerRegisterComponent,
    OwnerCallbackComponent
  ],
  imports: [CommonModule, SharedModule, OwnerRoutingModule, MatProgressSpinnerModule]
})
export class OwnerModule {}












