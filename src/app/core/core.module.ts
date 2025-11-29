import { NgModule, Optional, SkipSelf } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { OktaAuthModule, OKTA_CONFIG } from '@okta/okta-angular';
import { OktaAuth } from '@okta/okta-auth-js';

import { AuthInterceptor } from './interceptors/auth.interceptor';
import { HttpErrorInterceptor } from './interceptors/http-error.interceptor';
import { environment } from '../../environments/environment';

const oktaAuth = new OktaAuth({
  issuer: environment.okta.issuer,
  clientId: environment.okta.clientId,
  redirectUri: environment.okta.redirectUri,
  scopes: ['openid', 'profile', 'email'],
  tokenManager: {
    storage: 'sessionStorage'
  }
});

@NgModule({
  imports: [CommonModule, HttpClientModule, OktaAuthModule],
  providers: [
    { provide: OKTA_CONFIG, useValue: { oktaAuth } },
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
    { provide: HTTP_INTERCEPTORS, useClass: HttpErrorInterceptor, multi: true }
  ]
})
export class CoreModule {
  constructor(@Optional() @SkipSelf() parentModule?: CoreModule) {
    if (parentModule) {
      throw new Error('CoreModule has already been loaded. Import in AppModule only.');
    }
  }
}

