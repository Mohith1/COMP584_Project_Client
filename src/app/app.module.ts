import { APP_INITIALIZER, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientModule } from '@angular/common/http';
import { AuthService } from '@auth0/auth0-angular';
import { firstValueFrom } from 'rxjs';
import { filter, take, timeout } from 'rxjs/operators';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { CoreModule } from './core/core.module';
import { SharedModule } from './shared/shared.module';

// Factory to wait for Auth0 to be ready before starting the app
function initializeAuth0(auth0: AuthService): () => Promise<void> {
  return () => {
    // Check if this is a callback from Auth0 (has code in URL)
    const hasAuthCode = window.location.search.includes('code=');
    
    if (hasAuthCode) {
      console.log('🔄 Auth0 callback detected, waiting for authentication...');
      // Wait for Auth0 to process the callback (with timeout)
      return firstValueFrom(
        auth0.isLoading$.pipe(
          filter((loading) => !loading),
          take(1),
          timeout(10000) // 10 second timeout
        )
      ).then(() => {
        console.log('✅ Auth0 initialization complete');
      }).catch(() => {
        console.warn('⚠️ Auth0 initialization timeout');
      });
    }
    
    // No callback, just proceed
    return Promise.resolve();
  };
}

@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    HttpClientModule,
    CoreModule,
    SharedModule,
    AppRoutingModule
  ],
  providers: [
    {
      provide: APP_INITIALIZER,
      useFactory: initializeAuth0,
      deps: [AuthService],
      multi: true
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}
