import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { OwnerShellComponent } from './pages/owner-shell/owner-shell.component';
import { OwnerDashboardComponent } from './pages/owner-dashboard/owner-dashboard.component';
import { OwnerFleetsComponent } from './pages/owner-fleets/owner-fleets.component';
import { OwnerProfileComponent } from './pages/owner-profile/owner-profile.component';
import { OwnerLoginComponent } from './pages/owner-login/owner-login.component';
import { OwnerRegisterComponent } from './pages/owner-register/owner-register.component';
import { OwnerGuard } from '../core/guards/owner.guard';

const routes: Routes = [
  {
    path: 'login',
    component: OwnerLoginComponent
  },
  {
    path: 'register',
    component: OwnerRegisterComponent
  },
  {
    path: '',
    component: OwnerShellComponent,
    canActivate: [OwnerGuard],
    canActivateChild: [OwnerGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: OwnerDashboardComponent },
      { path: 'fleets', component: OwnerFleetsComponent },
      { path: 'profile', component: OwnerProfileComponent }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class OwnerRoutingModule {}

