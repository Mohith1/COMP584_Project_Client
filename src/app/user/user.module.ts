import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../shared/shared.module';
import { UserRoutingModule } from './user-routing.module';
import { UserShellComponent } from './pages/user-shell/user-shell.component';
import { UserVehiclesComponent } from './pages/user-vehicles/user-vehicles.component';
import { UserProfileComponent } from './pages/user-profile/user-profile.component';
import { UserLoginComponent } from './pages/user-login/user-login.component';

@NgModule({
  declarations: [
    UserShellComponent,
    UserVehiclesComponent,
    UserProfileComponent,
    UserLoginComponent
  ],
  imports: [CommonModule, SharedModule, UserRoutingModule]
})
export class UserModule {}



