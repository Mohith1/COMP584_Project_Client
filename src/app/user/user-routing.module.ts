import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { OktaCallbackComponent } from '@okta/okta-angular';
import { UserShellComponent } from './pages/user-shell/user-shell.component';
import { UserVehiclesComponent } from './pages/user-vehicles/user-vehicles.component';
import { UserProfileComponent } from './pages/user-profile/user-profile.component';
import { UserLoginComponent } from './pages/user-login/user-login.component';
import { UserGuard } from '../core/guards/user.guard';

const routes: Routes = [
  { path: 'login', component: UserLoginComponent },
  { path: 'login/callback', component: OktaCallbackComponent },
  {
    path: '',
    component: UserShellComponent,
    canActivate: [UserGuard],
    canActivateChild: [UserGuard],
    children: [
      { path: '', redirectTo: 'vehicles', pathMatch: 'full' },
      { path: 'vehicles', component: UserVehiclesComponent },
      { path: 'profile', component: UserProfileComponent }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class UserRoutingModule {}



