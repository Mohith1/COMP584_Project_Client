import { NgModule, Optional, SkipSelf } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { AuthModule } from '@auth0/auth0-angular';

import { AuthInterceptor } from './interceptors/auth.interceptor';
import { HttpErrorInterceptor } from './interceptors/http-error.interceptor';
import { environment } from '../../environments/environment';

// Build redirect URI - use environment config for consistency
// The redirect_uri MUST match exactly between authorize request and token exchange
const getRedirectUri = (): string => {
  // Use the configured redirect URI from environment
  // This ensures consistency between login redirect and token exchange
  const envUri = environment.auth0.redirectUri;
  const windowOrigin = typeof window !== 'undefined' ? window.location.origin : '';
  
  // Log both for debugging
  console.log('🔧 Auth0 Redirect URI Check:');
  console.log('   Environment config:', envUri);
  console.log('   Window origin:', windowOrigin);
  
  // Use window.location.origin as it's the most accurate
  return windowOrigin || envUri;
};

// Debug: Log Auth0 configuration
console.log('🔧 Auth0 Configuration:');
console.log('   Domain:', environment.auth0.domain);
console.log('   Client ID:', environment.auth0.clientId ? '✓ SET' : '✗ NOT SET');
console.log('   Redirect URI:', getRedirectUri());

// Get audience only if it's a valid Auth0 API identifier
const getAudience = (): string | undefined => {
  const audience: string = environment.auth0.audience || '';
  if (audience && audience !== 'api://default' && !audience.includes('{your')) {
    return audience;
  }
  return undefined;
};

@NgModule({
  imports: [
    CommonModule,
    HttpClientModule,
    AuthModule.forRoot({
      domain: environment.auth0.domain,
      clientId: environment.auth0.clientId,
      authorizationParams: {
        redirect_uri: getRedirectUri(),
        ...(getAudience() && { audience: getAudience() })
      },
      cacheLocation: 'localstorage',
      httpInterceptor: {
        allowedList: []
      }
    })
  ],
  providers: [
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



